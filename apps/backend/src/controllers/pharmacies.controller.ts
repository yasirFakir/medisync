import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── SQL Field Selections ─────────────────────────────────────────────────────
const PHARMACY_FIELDS = `
  ph.pharmacy_id AS "pharmacyId",
  ph.store_name AS "storeName",
  ph.license_number AS "licenseNumber",
  ph.street_address AS "streetAddress",
  ph.city,
  ph.is_verified AS "isVerified",
  ph.created_at AS "createdAt",
  u.email AS "contactEmail",
  u.phone_number AS "contactPhone"
`;

// ─── GET /api/pharmacies ──────────────────────────────────────────────────────
export const listPharmacies = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string || '20', 10));
  const offset = (page - 1) * limit;
  const city = req.query.city as string | undefined;
  const verified = req.query.verified as string | undefined;

  const cityFilter = city ? city.trim() : null;
  const verifiedFilter = verified !== undefined ? verified === 'true' : null;

  const pharmacies = await query(
    `SELECT ${PHARMACY_FIELDS}
     FROM pharmacies ph
     JOIN users u ON u.user_id = ph.pharmacy_id
     WHERE ($1::text IS NULL OR LOWER(ph.city) = LOWER($1))
       AND ($2::boolean IS NULL OR ph.is_verified = $2)
     ORDER BY ph.store_name ASC
     LIMIT $3 OFFSET $4`,
    [cityFilter, verifiedFilter, limit, offset]
  );

  const [countResult] = await query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM pharmacies ph
     WHERE ($1::text IS NULL OR LOWER(ph.city) = LOWER($1))
       AND ($2::boolean IS NULL OR ph.is_verified = $2)`,
    [cityFilter, verifiedFilter]
  );
  const total = parseInt(countResult?.count || '0', 10);

  res.json({
    success: true,
    message: 'Pharmacies retrieved',
    data: pharmacies,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/pharmacies/search?q= ────────────────────────────────────────────
export const searchPharmacies = async (req: AuthRequest, res: Response): Promise<void> => {
  const q = (req.query.q as string || '').trim();
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string || '20', 10));
  const offset = (page - 1) * limit;

  if (!q) throw new AppError('Search query (q) is required', 400);

  const searchPattern = `%${q}%`;

  const pharmacies = await query(
    `SELECT ${PHARMACY_FIELDS}
     FROM pharmacies ph
     JOIN users u ON u.user_id = ph.pharmacy_id
     WHERE LOWER(ph.store_name) LIKE LOWER($1)
        OR LOWER(ph.city) LIKE LOWER($1)
        OR LOWER(ph.street_address) LIKE LOWER($1)
     ORDER BY ph.store_name ASC
     LIMIT $2 OFFSET $3`,
    [searchPattern, limit, offset]
  );

  const [countResult] = await query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM pharmacies ph
     WHERE LOWER(ph.store_name) LIKE LOWER($1)
        OR LOWER(ph.city) LIKE LOWER($1)
        OR LOWER(ph.street_address) LIKE LOWER($1)`,
    [searchPattern]
  );
  const total = parseInt(countResult?.count || '0', 10);

  res.json({
    success: true,
    message: 'Pharmacy search results',
    data: pharmacies,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/pharmacies/:pharmacyId ──────────────────────────────────────────
export const getPharmacyById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { pharmacyId } = req.params;

  const pharmacy = await queryOne(
    `SELECT ${PHARMACY_FIELDS}
     FROM pharmacies ph
     JOIN users u ON u.user_id = ph.pharmacy_id
     WHERE ph.pharmacy_id = $1`,
    [pharmacyId]
  );

  if (!pharmacy) throw new AppError('Pharmacy not found', 404);

  // Also fetch the pharmacy's inventory summary
  const stockSummary = await query<{
    totalDrugs: string;
    inStockCount: string;
    outOfStockCount: string;
  }>(
    `SELECT
       COUNT(*) AS "totalDrugs",
       COUNT(*) FILTER (WHERE in_stock = true) AS "inStockCount",
       COUNT(*) FILTER (WHERE in_stock = false) AS "outOfStockCount"
     FROM pharmacy_inventory
     WHERE pharmacy_id = $1`,
    [pharmacyId]
  );

  res.json({
    success: true,
    message: 'Pharmacy retrieved',
    data: {
      ...pharmacy,
      stockSummary: stockSummary[0] ? {
        totalDrugs: parseInt(stockSummary[0].totalDrugs || '0', 10),
        inStockCount: parseInt(stockSummary[0].inStockCount || '0', 10),
        outOfStockCount: parseInt(stockSummary[0].outOfStockCount || '0', 10),
      } : null,
    },
    timestamp: new Date().toISOString(),
  });
};
