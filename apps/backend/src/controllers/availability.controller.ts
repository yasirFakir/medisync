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

// ─── POST /api/availability/search-prescription ──────────────────────────────
export const searchPrescriptionAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('An array of "items" with at least one medicine is required', 400);
  }
  if (items.length > 25) {
    throw new AppError('Cannot search more than 25 medicines at once', 400);
  }

  // 1. Resolve item info (brandName & saltComposition) from DB if missing
  const processedItems: Array<{ drugId: string; brandName: string; saltComposition: string; dosage: string }> = [];

  for (const item of items) {
    let drugId = item.drugId || '';
    let brandName = (item.brandName || '').trim();
    let saltComposition = (item.saltComposition || '').trim();

    if ((!saltComposition || !brandName) && (drugId || brandName)) {
      const [dbDrug] = await query<{ drugId: string; brandName: string; saltComposition: string }>(
        `SELECT drug_id AS "drugId", brand_name AS "brandName", salt_composition AS "saltComposition"
         FROM master_pharmacy
         WHERE drug_id::text = $1 OR LOWER(brand_name) = LOWER($2) OR LOWER(salt_composition) LIKE LOWER($3)
         LIMIT 1`,
        [drugId || '00000000-0000-0000-0000-000000000000', brandName || '_____', `%${brandName || '____'}%`]
      );
      if (dbDrug) {
        drugId = drugId || dbDrug.drugId;
        brandName = brandName || dbDrug.brandName;
        saltComposition = saltComposition || dbDrug.saltComposition;
      }
    }

    processedItems.push({
      drugId,
      brandName: brandName || 'Unknown Medicine',
      saltComposition: saltComposition || 'Unknown Salt',
      dosage: item.dosage || ''
    });
  }

  // 2. Fetch all verified pharmacies
  const verifiedPharmacies = await query<{
    pharmacyId: string;
    storeName: string;
    streetAddress: string;
    city: string;
  }>(
    `SELECT pharmacy_id AS "pharmacyId", store_name AS "storeName", street_address AS "streetAddress", city
     FROM pharmacies WHERE is_verified = true ORDER BY store_name ASC`
  );

  // 3. Fetch all active inventory for verified pharmacies
  const allInventory = await query<{
    pharmacyId: string;
    drugId: string;
    brandName: string;
    saltComposition: string;
    strength: string;
    manufacturer: string | null;
    quantity: number;
    currentPrice: number | null;
  }>(
    `SELECT
       pi.pharmacy_id AS "pharmacyId",
       mp.drug_id AS "drugId",
       mp.brand_name AS "brandName",
       mp.salt_composition AS "saltComposition",
       mp.strength,
       mp.manufacturer,
       pi.quantity,
       pi.current_price AS "currentPrice"
     FROM pharmacy_inventory pi
     JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
     JOIN pharmacies ph ON ph.pharmacy_id = pi.pharmacy_id
     WHERE ph.is_verified = true AND pi.in_stock = true AND pi.quantity > 0`
  );

  // Group inventory by pharmacyId
  const inventoryByPharmacy = new Map<string, typeof allInventory>();
  for (const row of allInventory) {
    if (!inventoryByPharmacy.has(row.pharmacyId)) {
      inventoryByPharmacy.set(row.pharmacyId, []);
    }
    inventoryByPharmacy.get(row.pharmacyId)!.push(row);
  }

  // Helper function to check salt compatibility
  const isSaltMatching = (reqSalt: string, invSalt: string): boolean => {
    if (!reqSalt || reqSalt === 'Unknown Salt' || !invSalt) return false;
    const r = reqSalt.toLowerCase().trim();
    const i = invSalt.toLowerCase().trim();
    if (r === i || r.includes(i) || i.includes(r)) return true;

    // Extract main chemical tokens (length > 3)
    const reqTokens = r.split(/[\+\,\s\/]+/).filter((t) => t.length > 3);
    const invTokens = i.split(/[\+\,\s\/]+/).filter((t) => t.length > 3);
    return reqTokens.some((rt) => invTokens.some((it) => rt === it || rt.includes(it) || it.includes(rt)));
  };

  // 4. Calculate matching, alternatives, and missing for each pharmacy
  const pharmacyResults = verifiedPharmacies.map((pharmacy) => {
    const pInventory = inventoryByPharmacy.get(pharmacy.pharmacyId) || [];

    const matching: Array<{
      requestedBrand: string;
      drugId: string;
      brandName: string;
      saltComposition: string;
      strength: string;
      manufacturer: string | null;
      quantity: number;
      currentPrice: number | null;
    }> = [];

    const alternatives: Array<{
      requestedBrand: string;
      saltComposition: string;
      availableBrands: Array<{
        drugId: string;
        brandName: string;
        manufacturer: string | null;
        strength: string;
        quantity: number;
        currentPrice: number | null;
      }>;
    }> = [];

    const missing: Array<{
      requestedBrand: string;
      saltComposition: string;
    }> = [];

    for (const reqItem of processedItems) {
      const reqBrandLower = reqItem.brandName.toLowerCase();

      // Check direct exact brand match first
      const directMatch = pInventory.find(
        (inv) =>
          (reqItem.drugId && inv.drugId === reqItem.drugId) ||
          inv.brandName.toLowerCase() === reqBrandLower ||
          inv.brandName.toLowerCase().startsWith(reqBrandLower) ||
          reqBrandLower.startsWith(inv.brandName.toLowerCase())
      );

      if (directMatch) {
        matching.push({
          requestedBrand: reqItem.brandName,
          drugId: directMatch.drugId,
          brandName: directMatch.brandName,
          saltComposition: directMatch.saltComposition,
          strength: directMatch.strength,
          manufacturer: directMatch.manufacturer,
          quantity: directMatch.quantity,
          currentPrice: directMatch.currentPrice ? Number(directMatch.currentPrice) : null,
        });
      } else {
        // Find alternative brands in stock with matching salt composition
        const altMatches = pInventory.filter((inv) =>
          isSaltMatching(reqItem.saltComposition, inv.saltComposition)
        );

        if (altMatches.length > 0) {
          alternatives.push({
            requestedBrand: reqItem.brandName,
            saltComposition: reqItem.saltComposition || altMatches[0].saltComposition,
            availableBrands: altMatches.map((inv) => ({
              drugId: inv.drugId,
              brandName: inv.brandName,
              manufacturer: inv.manufacturer,
              strength: inv.strength,
              quantity: inv.quantity,
              currentPrice: inv.currentPrice ? Number(inv.currentPrice) : null,
            })),
          });
        } else {
          missing.push({
            requestedBrand: reqItem.brandName,
            saltComposition: reqItem.saltComposition,
          });
        }
      }
    }

    const directCount = matching.length;
    const altCount = alternatives.length;
    const missingCount = missing.length;
    const totalReq = processedItems.length;

    const matchScore = totalReq > 0 ? (directCount * 1.0 + altCount * 0.7) / totalReq : 0;
    const availabilityPercentage = totalReq > 0 ? Math.round(((directCount + altCount) / totalReq) * 100) : 0;

    return {
      pharmacyId: pharmacy.pharmacyId,
      storeName: pharmacy.storeName,
      streetAddress: pharmacy.streetAddress,
      city: pharmacy.city,
      summary: {
        totalRequested: totalReq,
        directMatchCount: directCount,
        alternativeMatchCount: altCount,
        missingCount,
        availabilityPercentage,
        matchScore: Math.round(matchScore * 100) / 100,
      },
      matching,
      alternatives,
      missing,
    };
  });

  // Sort pharmacies by matchScore descending (highest total availability first)
  pharmacyResults.sort(
    (a, b) => b.summary.matchScore - a.summary.matchScore || b.summary.directMatchCount - a.summary.directMatchCount
  );

  res.json({
    success: true,
    message: `Evaluated availability across ${pharmacyResults.length} verified pharmacies`,
    data: {
      requestedItems: processedItems,
      pharmacies: pharmacyResults,
    },
    timestamp: new Date().toISOString(),
  });
};

