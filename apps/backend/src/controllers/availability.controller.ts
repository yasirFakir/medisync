import { Response } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { getCache, setCache } from '../config/redis';

// ─── Stock Status Derivation ──────────────────────────────────────────────────
// Decision Policy: Stock availability is 100% deterministic via DB queries.
// NEVER ask AI if stock exists.

const LOW_STOCK_THRESHOLD = 10;

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

function deriveStockStatus(inStock: boolean, quantity: number): StockStatus {
  if (!inStock || quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'LOW_STOCK';
  return 'IN_STOCK';
}

// ─── GET /api/availability/:drugId ────────────────────────────────────────────
export const getAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId } = req.params;

  // Verify drug exists
  const [drug] = await query<{ drugId: string; brandName: string; saltComposition: string }>(
    `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition"
     FROM master_pharmacy WHERE drug_id = $1`,
    [drugId]
  );
  if (!drug) throw new AppError('Drug not found', 404);

  // Check cache
  const cacheKey = `availability:${drugId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({
      success: true,
      message: 'Availability retrieved (cached)',
      data: cached,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Fetch inventory across all verified pharmacies
  const inventoryRows = await query<{
    pharmacyId: string;
    storeName: string;
    streetAddress: string;
    city: string;
    isVerified: boolean;
    inStock: boolean;
    quantity: number;
    currentPrice: number | null;
    lastUpdated: string;
  }>(
    `SELECT
       ph.pharmacy_id AS "pharmacyId",
       ph.store_name AS "storeName",
       ph.street_address AS "streetAddress",
       ph.city,
       ph.is_verified AS "isVerified",
       pi.in_stock AS "inStock",
       pi.quantity,
       pi.current_price AS "currentPrice",
       pi.last_updated AS "lastUpdated"
     FROM pharmacy_inventory pi
     JOIN pharmacies ph ON ph.pharmacy_id = pi.pharmacy_id
     WHERE pi.drug_id = $1
       AND ph.is_verified = true
     ORDER BY pi.current_price ASC NULLS LAST`,
    [drugId]
  );

  // Derive stock status for each pharmacy
  const pharmacies = inventoryRows.map((row) => ({
    pharmacyId: row.pharmacyId,
    storeName: row.storeName,
    streetAddress: row.streetAddress,
    city: row.city,
    stockStatus: deriveStockStatus(row.inStock, row.quantity),
    quantity: row.quantity,
    currentPrice: row.currentPrice ? Number(row.currentPrice) : null,
    lastUpdated: row.lastUpdated,
  }));

  // Aggregate summary
  const inStockCount = pharmacies.filter((p) => p.stockStatus === 'IN_STOCK').length;
  const lowStockCount = pharmacies.filter((p) => p.stockStatus === 'LOW_STOCK').length;
  const outOfStockCount = pharmacies.filter((p) => p.stockStatus === 'OUT_OF_STOCK').length;

  const prices = pharmacies
    .filter((p) => p.currentPrice !== null && p.stockStatus !== 'OUT_OF_STOCK')
    .map((p) => p.currentPrice as number);

  const result = {
    drug: {
      drugId: drug.drugId,
      brandName: drug.brandName,
      saltComposition: drug.saltComposition,
    },
    summary: {
      totalPharmacies: pharmacies.length,
      inStock: inStockCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      overallStatus: inStockCount > 0
        ? 'IN_STOCK'
        : lowStockCount > 0
          ? 'LOW_STOCK'
          : 'OUT_OF_STOCK',
      lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
      highestPrice: prices.length > 0 ? Math.max(...prices) : null,
      averagePrice: prices.length > 0
        ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
        : null,
    },
    pharmacies,
  };

  // Cache for 5 minutes (inventory changes more frequently)
  await setCache(cacheKey, result, 300);

  res.json({
    success: true,
    message: `Availability data for ${drug.brandName}`,
    data: result,
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/availability/check?drugIds=uuid1,uuid2 ──────────────────────────
// Batch availability check — returns stock status for multiple drugs at once
export const batchCheckAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const idsParam = req.query.drugIds as string;

  if (!idsParam) {
    throw new AppError('Query parameter "drugIds" is required (comma-separated)', 400);
  }

  const drugIds = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
  if (drugIds.length === 0 || drugIds.length > 20) {
    throw new AppError('Provide between 1 and 20 drug IDs', 400);
  }

  const placeholders = drugIds.map((_, i) => `$${i + 1}`).join(', ');

  const rows = await query<{
    drugId: string;
    brandName: string;
    totalPharmacies: string;
    inStockCount: string;
    lowestPrice: number | null;
  }>(
    `SELECT
       mp.drug_id AS "drugId",
       mp.brand_name AS "brandName",
       COUNT(pi.inventory_id) AS "totalPharmacies",
       COUNT(pi.inventory_id) FILTER (WHERE pi.in_stock = true AND pi.quantity > 0) AS "inStockCount",
       MIN(pi.current_price) FILTER (WHERE pi.in_stock = true AND pi.quantity > 0) AS "lowestPrice"
     FROM master_pharmacy mp
     LEFT JOIN pharmacy_inventory pi ON pi.drug_id = mp.drug_id
     LEFT JOIN pharmacies ph ON ph.pharmacy_id = pi.pharmacy_id AND ph.is_verified = true
     WHERE mp.drug_id IN (${placeholders})
     GROUP BY mp.drug_id, mp.brand_name`,
    drugIds
  );

  const result = rows.map((row) => {
    const total = parseInt(row.totalPharmacies || '0', 10);
    const inStock = parseInt(row.inStockCount || '0', 10);
    return {
      drugId: row.drugId,
      brandName: row.brandName,
      totalPharmacies: total,
      inStockCount: inStock,
      status: inStock > 0 ? 'IN_STOCK' : total > 0 ? 'OUT_OF_STOCK' : 'UNAVAILABLE',
      lowestPrice: row.lowestPrice ? Number(row.lowestPrice) : null,
    };
  });

  res.json({
    success: true,
    message: `Availability checked for ${result.length} drugs`,
    data: result,
    timestamp: new Date().toISOString(),
  });
};
