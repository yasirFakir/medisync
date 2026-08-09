import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── POST /api/inventory/update  [PHARMACY] ───────────────────────────────────
export const updateInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const {
    inventoryId,
    drugId,
    inStock,
    price,
    costPrice,
    quantity,
    batchNumber,
    expiryDate,
    rackLocation,
    supplierName,
  } = req.body;

  // Verify the pharmacy profile exists
  const pharmacy = await queryOne('SELECT pharmacy_id FROM pharmacies WHERE pharmacy_id = $1', [pharmacyId]);
  if (!pharmacy) throw new AppError('Pharmacy profile not found. Please complete your pharmacy registration.', 404);

  const finalQty = quantity !== undefined ? Number(quantity) : 0;
  const isAvailable = inStock !== undefined ? Boolean(inStock) : finalQty > 0;
  const batchStr = batchNumber ? String(batchNumber).trim() : 'DEFAULT';

  let inventory;

  if (inventoryId) {
    // Update existing inventory batch record directly
    inventory = await queryOne(
      `UPDATE pharmacy_inventory
       SET in_stock = $3,
           current_price = $4,
           cost_price = COALESCE($5, cost_price),
           quantity = $6,
           batch_number = COALESCE($7, batch_number),
           expiry_date = COALESCE($8, expiry_date),
           rack_location = COALESCE($9, rack_location),
           supplier_name = COALESCE($10, supplier_name),
           last_updated = NOW()
       WHERE inventory_id = $1 AND pharmacy_id = $2
       RETURNING inventory_id AS "inventoryId", pharmacy_id AS "pharmacyId", drug_id AS "drugId",
                 in_stock AS "inStock", current_price AS "currentPrice", cost_price AS "costPrice",
                 quantity, batch_number AS "batchNumber", expiry_date AS "expiryDate",
                 rack_location AS "rackLocation", supplier_name AS "supplierName", last_updated AS "lastUpdated"`,
      [inventoryId, pharmacyId, isAvailable, price, costPrice || null, finalQty, batchStr, expiryDate || null, rackLocation || null, supplierName || null]
    );
  } else {
    // Upsert batch entry
    inventory = await queryOne(
      `INSERT INTO pharmacy_inventory (
          inventory_id, pharmacy_id, drug_id, in_stock, current_price,
          cost_price, quantity, batch_number, expiry_date, rack_location, supplier_name, last_updated
       )
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (pharmacy_id, drug_id, COALESCE(batch_number, 'DEFAULT'))
       DO UPDATE SET
          in_stock = EXCLUDED.in_stock,
          current_price = EXCLUDED.current_price,
          cost_price = COALESCE(EXCLUDED.cost_price, pharmacy_inventory.cost_price),
          quantity = EXCLUDED.quantity,
          expiry_date = COALESCE(EXCLUDED.expiry_date, pharmacy_inventory.expiry_date),
          rack_location = COALESCE(EXCLUDED.rack_location, pharmacy_inventory.rack_location),
          supplier_name = COALESCE(EXCLUDED.supplier_name, pharmacy_inventory.supplier_name),
          last_updated = NOW()
       RETURNING inventory_id AS "inventoryId", pharmacy_id AS "pharmacyId", drug_id AS "drugId",
                 in_stock AS "inStock", current_price AS "currentPrice", cost_price AS "costPrice",
                 quantity, batch_number AS "batchNumber", expiry_date AS "expiryDate",
                 rack_location AS "rackLocation", supplier_name AS "supplierName", last_updated AS "lastUpdated"`,
      [
        pharmacyId,
        drugId,
        isAvailable,
        price,
        costPrice || null,
        finalQty,
        batchStr,
        expiryDate || null,
        rackLocation || null,
        supplierName || null,
      ]
    );
  }

  res.json({ success: true, message: 'Inventory updated successfully', data: inventory, timestamp: new Date().toISOString() });
};

// ─── POST /api/inventory/bulk-update  [PHARMACY] ─────────────────────────────
export const bulkUpdateInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const { items } = req.body as {
    items: Array<{
      drugId: string;
      inStock?: boolean;
      price: number;
      costPrice?: number;
      quantity?: number;
      batchNumber?: string;
      expiryDate?: string;
      rackLocation?: string;
      supplierName?: string;
    }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required for bulk update', 400);
  }

  const pharmacy = await queryOne('SELECT pharmacy_id FROM pharmacies WHERE pharmacy_id = $1', [pharmacyId]);
  if (!pharmacy) throw new AppError('Pharmacy profile not found.', 404);

  const updatedRecords = [];

  for (const item of items) {
    const qty = item.quantity !== undefined ? Number(item.quantity) : 0;
    const isAvail = item.inStock !== undefined ? Boolean(item.inStock) : qty > 0;
    const batchStr = item.batchNumber ? String(item.batchNumber).trim() : 'DEFAULT';

    const row = await queryOne(
      `INSERT INTO pharmacy_inventory (
          inventory_id, pharmacy_id, drug_id, in_stock, current_price,
          cost_price, quantity, batch_number, expiry_date, rack_location, supplier_name, last_updated
       )
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (pharmacy_id, drug_id, COALESCE(batch_number, 'DEFAULT'))
       DO UPDATE SET
          in_stock = EXCLUDED.in_stock,
          current_price = EXCLUDED.current_price,
          cost_price = COALESCE(EXCLUDED.cost_price, pharmacy_inventory.cost_price),
          quantity = EXCLUDED.quantity,
          expiry_date = COALESCE(EXCLUDED.expiry_date, pharmacy_inventory.expiry_date),
          rack_location = COALESCE(EXCLUDED.rack_location, pharmacy_inventory.rack_location),
          supplier_name = COALESCE(EXCLUDED.supplier_name, pharmacy_inventory.supplier_name),
          last_updated = NOW()
       RETURNING inventory_id AS "inventoryId", drug_id AS "drugId", in_stock AS "inStock", current_price AS "currentPrice"`,
      [
        pharmacyId,
        item.drugId,
        isAvail,
        item.price,
        item.costPrice || null,
        qty,
        batchStr,
        item.expiryDate || null,
        item.rackLocation || null,
        item.supplierName || null,
      ]
    );
    if (row) updatedRecords.push(row);
  }

  res.json({
    success: true,
    message: `${updatedRecords.length} items updated in inventory`,
    data: updatedRecords,
    timestamp: new Date().toISOString(),
  });
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
        pi.quantity,
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
        pi.drug_id AS "drugId",
        mp.brand_name AS "brandName",
        mp.salt_composition AS "saltComposition",
        mp.strength,
        mp.dosage_form AS "dosageForm",
        pi.in_stock AS "inStock",
        pi.quantity,
        pi.current_price AS "currentPrice",
        pi.cost_price AS "costPrice",
        pi.batch_number AS "batchNumber",
        pi.expiry_date AS "expiryDate",
        pi.rack_location AS "rackLocation",
        pi.supplier_name AS "supplierName",
        pi.last_updated AS "lastUpdated"
     FROM pharmacy_inventory pi
     JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
     WHERE pi.pharmacy_id = $1
     ORDER BY mp.brand_name ASC, pi.expiry_date ASC NULLS LAST`,
    [pharmacyId]
  );

  res.json({ success: true, message: 'Stock retrieved', data: stock, timestamp: new Date().toISOString() });
};

// ─── GET /api/inventory/expiring-soon  [PHARMACY] ───────────────────────────
export const getExpiringSoon = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;

  const expiring = await query(
    `SELECT
        pi.inventory_id AS "inventoryId",
        pi.drug_id AS "drugId",
        mp.brand_name AS "brandName",
        mp.strength,
        pi.batch_number AS "batchNumber",
        pi.expiry_date AS "expiryDate",
        pi.quantity,
        pi.current_price AS "currentPrice"
     FROM pharmacy_inventory pi
     JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
     WHERE pi.pharmacy_id = $1
       AND pi.expiry_date IS NOT NULL
       AND pi.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
     ORDER BY pi.expiry_date ASC`,
    [pharmacyId]
  );

  res.json({ success: true, message: 'Expiring items retrieved', data: expiring, timestamp: new Date().toISOString() });
};

// ─── GET /api/inventory/low-stock  [PHARMACY] ───────────────────────────────
export const getLowStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;

  const lowStock = await query(
    `SELECT
        pi.inventory_id AS "inventoryId",
        pi.drug_id AS "drugId",
        mp.brand_name AS "brandName",
        mp.strength,
        pi.quantity,
        pi.in_stock AS "inStock",
        pi.current_price AS "currentPrice"
     FROM pharmacy_inventory pi
     JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
     WHERE pi.pharmacy_id = $1
       AND (pi.quantity < 10 OR pi.in_stock = false)
     ORDER BY pi.quantity ASC`,
    [pharmacyId]
  );

  res.json({ success: true, message: 'Low stock items retrieved', data: lowStock, timestamp: new Date().toISOString() });
};

// ─── DELETE /api/inventory/:inventoryId  [PHARMACY] ──────────────────────────
export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const { inventoryId } = req.params;

  const result = await query(
    'DELETE FROM pharmacy_inventory WHERE inventory_id = $1 AND pharmacy_id = $2 RETURNING inventory_id',
    [inventoryId, pharmacyId]
  );

  if (!result.length) {
    throw new AppError('Stock item not found or unauthorized', 404);
  }

  res.json({ success: true, message: 'Stock item deleted successfully', timestamp: new Date().toISOString() });
};
