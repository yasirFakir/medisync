import { Response } from 'express';
import speakeasy from 'speakeasy';
import { db, query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── POST /api/pharmacy/verify-prescription-otp  [PHARMACY] ─────────────────
export const verifyPrescriptionOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const { patientId, patientEmail, otpToken, otp } = req.body;
  const token = (otpToken || otp || '').toString().trim();

  if (!patientId && !patientEmail) {
    throw new AppError('Patient ID or patient email is required', 400);
  }
  if (!token) {
    throw new AppError('OTP verification code is required', 400);
  }

  // Find patient record
  let patient = null;
  if (patientId) {
    patient = await queryOne<{ user_id: string; full_name: string; email: string }>(
      'SELECT user_id, full_name, email FROM users WHERE user_id::text = $1',
      [patientId]
    );
  } else if (patientEmail) {
    patient = await queryOne<{ user_id: string; full_name: string; email: string }>(
      'SELECT user_id, full_name, email FROM users WHERE LOWER(email) = LOWER($1)',
      [patientEmail]
    );
  }

  if (!patient) throw new AppError('Patient not found', 404);

  // Shortcut OTP bypass for demo / testing
  const SHORTCUT_OTPS = ['123456', '000000', '111111', '999999', '888888', '777777'];
  let isValid = SHORTCUT_OTPS.includes(token);

  if (!isValid) {
    const secretRow = await queryOne<{ totp_secret: string }>(
      'SELECT totp_secret FROM patient_totp_secrets WHERE patient_id = $1',
      [patient.user_id]
    );

    if (!secretRow) {
      throw new AppError('Patient has not generated an OTP code yet. Use demo shortcut 123456.', 404);
    }

    isValid = speakeasy.totp.verify({
      secret: secretRow.totp_secret,
      encoding: 'base32',
      token: token,
      step: 300,
      window: 2,
    });
  }

  if (!isValid) {
    throw new AppError('Invalid or expired OTP token. Use demo shortcut 123456.', 401);
  }

  // Log access
  await query(
    `INSERT INTO pharmacy_prescription_access (access_id, pharmacy_id, patient_id, accessed_at)
     VALUES (uuid_generate_v4(), $1, $2, NOW())`,
    [pharmacyId, patient.user_id]
  );

  // Fetch active digitized prescriptions
  const prescriptions = await query(
    `SELECT prescription_id AS "prescriptionId", patient_id AS "patientId",
            doctor_name AS "doctorName", raw_image_url AS "rawImageUrl",
            digitized_notes AS "digitizedNotes", created_at AS "createdAt"
     FROM prescriptions
     WHERE patient_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [patient.user_id]
  );

  res.json({
    success: true,
    message: 'OTP verified successfully. Access granted to patient prescription details.',
    data: {
      patient: {
        patientId: patient.user_id,
        fullName: patient.full_name,
        email: patient.email,
      },
      prescriptions,
    },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/pharmacy/prescriptions/:patientId  [PHARMACY] ─────────────────
export const getPatientPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { patientId } = req.params;

  const prescriptions = await query(
    `SELECT prescription_id AS "prescriptionId", patient_id AS "patientId",
            doctor_name AS "doctorName", raw_image_url AS "rawImageUrl",
            digitized_notes AS "digitizedNotes", created_at AS "createdAt"
     FROM prescriptions
     WHERE patient_id = $1
     ORDER BY created_at DESC`,
    [patientId]
  );

  res.json({
    success: true,
    message: 'Patient prescriptions retrieved',
    data: prescriptions,
    timestamp: new Date().toISOString(),
  });
};

// ─── POST /api/pharmacy/sales  [PHARMACY] ────────────────────────────────────
export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const {
    patientId,
    prescriptionId,
    customerName,
    paymentMethod,
    discountAmount = 0,
    taxAmount = 0,
    items,
  } = req.body as {
    patientId?: string;
    prescriptionId?: string;
    customerName?: string;
    paymentMethod: string;
    discountAmount?: number;
    taxAmount?: number;
    items: Array<{
      inventoryId: string;
      quantity: number;
      durationDays?: number;
      dosageSchedule?: string;
    }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Sale items array is required', 400);
  }
  if (!paymentMethod) {
    throw new AppError('Payment method is required', 400);
  }

  // Generate unique invoice number: RX-YYYYMMDD-XXXX
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `RX-${todayStr}-${randSeq}`;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    let subtotal = 0;
    let costTotal = 0;
    const processedItems: Array<any> = [];

    for (const item of items) {
      if (!item.inventoryId || !item.quantity || item.quantity <= 0) {
        throw new AppError('Invalid item inventory ID or quantity', 400);
      }

      // Fetch stock record & master drug info
      const stockRes = await client.query(
        `SELECT pi.inventory_id, pi.drug_id, pi.quantity, pi.current_price, pi.cost_price,
                pi.batch_number, mp.brand_name, mp.salt_composition, mp.strength
         FROM pharmacy_inventory pi
         JOIN master_pharmacy mp ON mp.drug_id = pi.drug_id
         WHERE pi.inventory_id = $1 AND pi.pharmacy_id = $2
         FOR UPDATE`,
        [item.inventoryId, pharmacyId]
      );

      if (stockRes.rows.length === 0) {
        throw new AppError(`Item ${item.inventoryId} not found in inventory`, 404);
      }

      const stockRow = stockRes.rows[0];

      const unitSellingPrice = Number(stockRow.current_price || 0);
      const unitCostPrice = Number(stockRow.cost_price || 0);
      const lineTotal = unitSellingPrice * item.quantity;

      subtotal += lineTotal;
      costTotal += unitCostPrice * item.quantity;

      processedItems.push({
        inventoryId: stockRow.inventory_id,
        brandName: stockRow.brand_name,
        genericName: stockRow.salt_composition,
        strength: stockRow.strength,
        batchNumber: stockRow.batch_number,
        unitSellingPrice,
        unitCostPrice,
        quantity: item.quantity,
        durationDays: item.durationDays || null,
        dosageSchedule: item.dosageSchedule || null,
        lineTotal,
      });

      // Deduct stock quantity
      const newQty = stockRow.quantity - item.quantity;
      const newInStock = newQty > 0;
      await client.query(
        `UPDATE pharmacy_inventory
         SET quantity = $1, in_stock = $2, last_updated = NOW()
         WHERE inventory_id = $3`,
        [newQty, newInStock, item.inventoryId]
      );
    }

    const finalSubtotal = subtotal;
    const netTotal = Math.max(0, finalSubtotal - Number(discountAmount) + Number(taxAmount));

    // Insert sale header
    const saleRes = await client.query(
      `INSERT INTO pharmacy_sales (
          sale_id, pharmacy_id, patient_id, prescription_id, invoice_number,
          subtotal, discount_amount, tax_amount, net_total, cost_total,
          payment_method, pharmacist_id, customer_name, created_at
       )
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING sale_id AS "saleId", invoice_number AS "invoiceNumber",
                 net_total AS "netTotal", created_at AS "createdAt"`,
      [
        pharmacyId,
        patientId || null,
        prescriptionId || null,
        invoiceNumber,
        finalSubtotal,
        discountAmount,
        taxAmount,
        netTotal,
        costTotal,
        paymentMethod.toUpperCase(),
        req.user!.userId,
        customerName || null,
      ]
    );

    const saleRecord = saleRes.rows[0];

    // Insert sale line items
    for (const pItem of processedItems) {
      await client.query(
        `INSERT INTO pharmacy_sale_items (
            item_id, sale_id, inventory_id, medicine_name, generic_name,
            dosage_strength, batch_number, unit_selling_price, unit_cost_price,
            quantity, duration_days, dosage_schedule, line_total, created_at
         )
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          saleRecord.saleId,
          pItem.inventoryId,
          pItem.brandName,
          pItem.genericName,
          pItem.strength,
          pItem.batchNumber,
          pItem.unitSellingPrice,
          pItem.unitCostPrice,
          pItem.quantity,
          pItem.durationDays,
          pItem.dosageSchedule,
          pItem.lineTotal,
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Sale finalized successfully and inventory updated',
      data: {
        ...saleRecord,
        subtotal: finalSubtotal,
        discountAmount,
        taxAmount,
        costTotal,
        paymentMethod,
        customerName,
        items: processedItems,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── GET /api/pharmacy/sales  [PHARMACY] ─────────────────────────────────────
export const listSales = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const { startDate, endDate, paymentMethod, limit = 50 } = req.query as {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    limit?: string;
  };

  const sales = await query(
    `SELECT
        ps.sale_id AS "saleId",
        ps.invoice_number AS "invoiceNumber",
        ps.customer_name AS "customerName",
        u.full_name AS "patientName",
        ps.subtotal,
        ps.discount_amount AS "discountAmount",
        ps.tax_amount AS "taxAmount",
        ps.net_total AS "netTotal",
        ps.cost_total AS "costTotal",
        (ps.net_total - ps.cost_total) AS "profit",
        ps.payment_method AS "paymentMethod",
        ps.created_at AS "createdAt",
        COUNT(psi.item_id)::int AS "itemCount"
     FROM pharmacy_sales ps
     LEFT JOIN users u ON u.user_id = ps.patient_id
     LEFT JOIN pharmacy_sale_items psi ON psi.sale_id = ps.sale_id
     WHERE ps.pharmacy_id = $1
       AND ($2::timestamptz IS NULL OR ps.created_at >= $2::timestamptz)
       AND ($3::timestamptz IS NULL OR ps.created_at <= $3::timestamptz)
       AND ($4::text IS NULL OR LOWER(ps.payment_method) = LOWER($4))
     GROUP BY ps.sale_id, u.full_name
     ORDER BY ps.created_at DESC
     LIMIT $5`,
    [
      pharmacyId,
      startDate ? `${startDate}T00:00:00Z` : null,
      endDate ? `${endDate}T23:59:59Z` : null,
      paymentMethod || null,
      Number(limit),
    ]
  );

  res.json({ success: true, message: 'Sales transactions retrieved', data: sales, timestamp: new Date().toISOString() });
};

// ─── GET /api/pharmacy/sales/:saleId  [PHARMACY] ────────────────────────────
export const getSaleById = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;
  const { saleId } = req.params;

  const sale = await queryOne(
    `SELECT
        ps.sale_id AS "saleId",
        ps.pharmacy_id AS "pharmacyId",
        p.store_name AS "storeName",
        p.license_number AS "licenseNumber",
        p.street_address AS "streetAddress",
        p.city,
        ps.invoice_number AS "invoiceNumber",
        ps.customer_name AS "customerName",
        u.full_name AS "patientName",
        ps.subtotal,
        ps.discount_amount AS "discountAmount",
        ps.tax_amount AS "taxAmount",
        ps.net_total AS "netTotal",
        ps.cost_total AS "costTotal",
        (ps.net_total - ps.cost_total) AS "profit",
        ps.payment_method AS "paymentMethod",
        ps.created_at AS "createdAt"
     FROM pharmacy_sales ps
     JOIN pharmacies p ON p.pharmacy_id = ps.pharmacy_id
     LEFT JOIN users u ON u.user_id = ps.patient_id
     WHERE ps.sale_id = $1 AND ps.pharmacy_id = $2`,
    [saleId, pharmacyId]
  );

  if (!sale) throw new AppError('Sale record not found', 404);

  const items = await query(
    `SELECT
        item_id AS "itemId",
        medicine_name AS "medicineName",
        generic_name AS "genericName",
        dosage_strength AS "dosageStrength",
        batch_number AS "batchNumber",
        unit_selling_price AS "unitSellingPrice",
        unit_cost_price AS "unitCostPrice",
        quantity,
        duration_days AS "durationDays",
        dosage_schedule AS "dosageSchedule",
        line_total AS "lineTotal"
     FROM pharmacy_sale_items
     WHERE sale_id = $1`,
    [saleId]
  );

  res.json({
    success: true,
    message: 'Sale details retrieved',
    data: { ...sale, items },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/pharmacy/sales/summary  [PHARMACY] ────────────────────────────
export const getSalesSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;

  const todayStats = await queryOne<{
    todayRevenue: string;
    todayCost: string;
    todayProfit: string;
    todayOrders: string;
  }>(
    `SELECT
        COALESCE(SUM(net_total), 0) AS "todayRevenue",
        COALESCE(SUM(cost_total), 0) AS "todayCost",
        COALESCE(SUM(net_total - cost_total), 0) AS "todayProfit",
        COUNT(sale_id) AS "todayOrders"
     FROM pharmacy_sales
     WHERE pharmacy_id = $1 AND created_at >= CURRENT_DATE`,
    [pharmacyId]
  );

  const monthStats = await queryOne<{
    monthRevenue: string;
    monthCost: string;
    monthProfit: string;
    monthOrders: string;
  }>(
    `SELECT
        COALESCE(SUM(net_total), 0) AS "monthRevenue",
        COALESCE(SUM(cost_total), 0) AS "monthCost",
        COALESCE(SUM(net_total - cost_total), 0) AS "monthProfit",
        COUNT(sale_id) AS "monthOrders"
     FROM pharmacy_sales
     WHERE pharmacy_id = $1 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
    [pharmacyId]
  );

  res.json({
    success: true,
    message: 'Sales summary retrieved',
    data: {
      today: {
        revenue: Number(todayStats?.todayRevenue || 0),
        cost: Number(todayStats?.todayCost || 0),
        profit: Number(todayStats?.todayProfit || 0),
        orders: Number(todayStats?.todayOrders || 0),
      },
      month: {
        revenue: Number(monthStats?.monthRevenue || 0),
        cost: Number(monthStats?.monthCost || 0),
        profit: Number(monthStats?.monthProfit || 0),
        orders: Number(monthStats?.monthOrders || 0),
      },
    },
    timestamp: new Date().toISOString(),
  });
};

// ─── GET /api/pharmacy/sales/analytics  [PHARMACY] ──────────────────────────
export const getSalesAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const pharmacyId = req.user!.userId;

  // Top 5 selling medications
  const topSelling = await query(
    `SELECT
        psi.medicine_name AS "medicineName",
        SUM(psi.quantity)::int AS "totalQuantity",
        SUM(psi.line_total) AS "totalRevenue"
     FROM pharmacy_sale_items psi
     JOIN pharmacy_sales ps ON ps.sale_id = psi.sale_id
     WHERE ps.pharmacy_id = $1
     GROUP BY psi.medicine_name
     ORDER BY "totalQuantity" DESC
     LIMIT 5`,
    [pharmacyId]
  );

  // Payment method breakdown
  const paymentBreakdown = await query(
    `SELECT
        payment_method AS "paymentMethod",
        COUNT(sale_id)::int AS "count",
        SUM(net_total) AS "total"
     FROM pharmacy_sales
     WHERE pharmacy_id = $1
     GROUP BY payment_method`,
    [pharmacyId]
  );

  res.json({
    success: true,
    message: 'Sales analytics retrieved',
    data: {
      topSelling,
      paymentBreakdown,
    },
    timestamp: new Date().toISOString(),
  });
};
