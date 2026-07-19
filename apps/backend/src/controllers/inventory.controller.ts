import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── POST /api/inventory/update  [PHARMACY] ───────────────────────────────────
export const updateInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const { drugId, inStock, price } = req.body;

  // Verify the pharmacy profile exists
  const pharmacy = await queryOne('SELECT pharmacy_id FROM pharmacies WHERE pharmacy_id = $1', [pharmacyId]);
  if (!pharmacy) throw new AppError('Pharmacy profile not found. Please complete your pharmacy registration.', 404);

  const inventory = await queryOne(
    `INSERT INTO pharmacy_inventory (inventory_id, pharmacy_id, drug_id, in_stock, current_price, last_updated)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
     ON CONFLICT (pharmacy_id, drug_id)
     DO UPDATE SET in_stock = $3, current_price = $4, last_updated = NOW()
     RETURNING inventory_id AS "inventoryId", pharmacy_id AS "pharmacyId", drug_id AS "drugId",
               in_stock AS "inStock", current_price AS "currentPrice", last_updated AS "lastUpdated"`,
    [pharmacyId, drugId, inStock, price]
  );

  res.json({ success: true, message: 'Inventory updated successfully', data: inventory, timestamp: new Date().toISOString() });
};

// ─── GET /api/inventory/locate  [PATIENT, DOCTOR] ────────────────────────────
export const locateMedicine = async (req: AuthRequest, res: Response): Promise<void> => {
  const { drugId, saltComposition, city } = req.query as {
    drugId?: string;
    saltComposition?: string;
    city?: string;
  };

  const results = await query(
    `SELECT
        ph.store_name AS "storeName",
        ph.street_address AS "streetAddress",
        ph.city,
        ph.is_verified AS "isVerified",
        mp.brand_name AS "brandName",
        mp.salt_composition AS "saltComposition",
        mp.strength,
        pi.in_stock AS "inStock",
        pi.current_price AS "currentPrice",
        pi.last_updated AS "lastUpdated"
     FROM pharmacy_inventory pi
     JOIN pharmacies ph ON ph.pharmacy_id = pi.pharmacy_id
     JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
     WHERE pi.in_stock = true
       AND ($1::uuid IS NULL OR pi.drug_id = $1::uuid)
       AND ($2::text IS NULL OR LOWER(mp.salt_composition) LIKE LOWER($2))
       AND ($3::text IS NULL OR LOWER(ph.city) = LOWER($3))
       AND ph.is_verified = true
     ORDER BY pi.current_price ASC
     LIMIT 50`,
    [drugId || null, saltComposition ? `%${saltComposition}%` : null, city || null]
  );

  res.json({ success: true, message: 'Pharmacy locations retrieved', data: results, timestamp: new Date().toISOString() });
};

// ─── GET /api/inventory/my-stock  [PHARMACY] ──────────────────────────────────
export const getMyStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;

  const stock = await query(
    `SELECT
        pi.inventory_id AS "inventoryId",
        mp.brand_name AS "brandName",
        mp.salt_composition AS "saltComposition",
        mp.strength,
        pi.in_stock AS "inStock",
        pi.current_price AS "currentPrice",
        pi.last_updated AS "lastUpdated"
     FROM pharmacy_inventory pi
     JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
     WHERE pi.pharmacy_id = $1
     ORDER BY mp.brand_name ASC`,
    [pharmacyId]
  );

  res.json({ success: true, message: 'Stock retrieved', data: stock, timestamp: new Date().toISOString() });
};
