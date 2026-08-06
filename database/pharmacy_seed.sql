-- ─────────────────────────────────────────────────────────────────────────────
-- MediSync AI — Mock Pharmacy & Inventory Seed (TASK-007)
-- Adds 5 mock pharmacies and populates inventory with stock data
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Ensure quantity column exists ───────────────────────────────────────────
-- This is idempotent; does nothing if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pharmacy_inventory' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE pharmacy_inventory ADD COLUMN quantity INT DEFAULT 0;
  END IF;
END $$;

-- ─── Mock Pharmacy Users ─────────────────────────────────────────────────────
-- Password is: "password123" (same bcrypt hash as seed.sql)
INSERT INTO users (user_id, email, password_hash, role, full_name, phone_number) VALUES
  ('00000000-0000-0000-0000-000000000005', 'pharmacy2@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'HealthPlus Pharmacy', '+880-1700-000005'),
  ('00000000-0000-0000-0000-000000000006', 'pharmacy3@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'City Medi Store', '+880-1700-000006'),
  ('00000000-0000-0000-0000-000000000007', 'pharmacy4@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'Greenlife Pharmacy', '+880-1700-000007'),
  ('00000000-0000-0000-0000-000000000008', 'pharmacy5@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'PharmaOne', '+880-1700-000008'),
  ('00000000-0000-0000-0000-000000000009', 'pharmacy6@medisync.ai',
   '$2a$10$KGvNViOATpDduxuXCX/vv.mtssXD4/D7A8wlxjw.gJ1qiIoXYLZyy', 'PHARMACY', 'QuickMed Pharmacy', '+880-1700-000009')
ON CONFLICT (email) DO NOTHING;

-- ─── Mock Pharmacy Profiles ──────────────────────────────────────────────────
INSERT INTO pharmacies (pharmacy_id, store_name, license_number, street_address, city, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000005', 'HealthPlus Pharmacy',   'LIC-DH-002', '12 Mirpur Road, Mirpur-10',          'Dhaka',       true),
  ('00000000-0000-0000-0000-000000000006', 'City Medi Store',       'LIC-DH-003', '78 Banani Road, Block-C',            'Dhaka',       true),
  ('00000000-0000-0000-0000-000000000007', 'Greenlife Pharmacy',    'LIC-CT-001', '23 GEC Circle, Nasirabad',           'Chittagong',  true),
  ('00000000-0000-0000-0000-000000000008', 'PharmaOne',             'LIC-SL-001', '5 Zinda Bazar, Sylhet Sadar',        'Sylhet',      true),
  ('00000000-0000-0000-0000-000000000009', 'QuickMed Pharmacy',     'LIC-DH-004', '90 Gulshan Avenue, Gulshan-2',       'Dhaka',       false)
ON CONFLICT (license_number) DO NOTHING;

-- ─── Mock Inventory: Multiple pharmacies stocking multiple drugs ─────────────
-- Uses drug IDs from drugs_seed.sql (10000000-0000-0000-0000-00000000000X)
-- Includes varied quantities and prices to demonstrate stock status:
--   quantity > 10  → IN_STOCK
--   quantity 1-10  → LOW_STOCK
--   quantity = 0   → OUT_OF_STOCK

-- Update existing inventory to include quantity
UPDATE pharmacy_inventory 
SET quantity = CASE 
  WHEN in_stock = true THEN 50
  ELSE 0 
END
WHERE quantity = 0 OR quantity IS NULL;

-- ── HealthPlus Pharmacy (Dhaka) ──
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, quantity, current_price) VALUES
  -- Paracetamol variants
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', true,  45, 2.40),   -- Napa 500mg
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', true,  120, 1.10),  -- Generic Paracetamol
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', true,  30, 1.40),   -- ACI Paracetamol
  -- Antibiotics
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', true,  60, 7.50),   -- Moxacil 500mg
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', true,  25, 12.00),  -- Azithromycin
  -- Antacids
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000010', true,  80, 3.50),   -- Omeprazole
  -- PPIs
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000011', true,  40, 5.00),   -- Esomeprazole
  -- Low stock example
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000015', true,  5,  18.00),  -- Metformin (LOW STOCK)
  -- Out of stock example
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000020', false, 0,  45.00)   -- Out of stock drug
ON CONFLICT (pharmacy_id, drug_id) DO UPDATE SET
  in_stock = EXCLUDED.in_stock,
  quantity = EXCLUDED.quantity,
  current_price = EXCLUDED.current_price,
  last_updated = NOW();

-- ── City Medi Store (Dhaka) ──
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, quantity, current_price) VALUES
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', true,  200, 2.60),  -- Napa (higher price)
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', true,  90,  1.25),  -- Generic Paracetamol
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', true,  35,  8.00),  -- Moxacil
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000010', true,  55,  3.60),  -- Omeprazole
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', true,  70,  17.50), -- Metformin
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000020', true,  3,   42.00)  -- LOW STOCK
ON CONFLICT (pharmacy_id, drug_id) DO UPDATE SET
  in_stock = EXCLUDED.in_stock,
  quantity = EXCLUDED.quantity,
  current_price = EXCLUDED.current_price,
  last_updated = NOW();

-- ── Greenlife Pharmacy (Chittagong) ──
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, quantity, current_price) VALUES
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', true,  80,  2.50),  -- Napa
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', true,  150, 1.15),  -- Generic Paracetamol
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', true,  45,  1.50),  -- ACI Paracetamol
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', true,  100, 7.80),  -- Moxacil
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000010', false, 0,   3.50),  -- Omeprazole (OUT OF STOCK)
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000015', true,  8,   18.50)  -- Metformin (LOW STOCK)
ON CONFLICT (pharmacy_id, drug_id) DO UPDATE SET
  in_stock = EXCLUDED.in_stock,
  quantity = EXCLUDED.quantity,
  current_price = EXCLUDED.current_price,
  last_updated = NOW();

-- ── PharmaOne (Sylhet) ──
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, quantity, current_price) VALUES
  ('00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', true,  60,  2.55),  -- Napa
  ('00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', true,  20,  8.20),  -- Moxacil
  ('00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000010', true,  25,  3.40),  -- Omeprazole (cheapest)
  ('00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000015', true,  40,  17.00), -- Metformin (cheapest)
  ('00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', true,  15,  11.50)  -- Azithromycin
ON CONFLICT (pharmacy_id, drug_id) DO UPDATE SET
  in_stock = EXCLUDED.in_stock,
  quantity = EXCLUDED.quantity,
  current_price = EXCLUDED.current_price,
  last_updated = NOW();

-- ── QuickMed Pharmacy (Dhaka - UNVERIFIED, should not appear in public searches) ──
INSERT INTO pharmacy_inventory (pharmacy_id, drug_id, in_stock, quantity, current_price) VALUES
  ('00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', true, 500, 2.00),  -- Very cheap but unverified
  ('00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', true, 300, 0.90)
ON CONFLICT (pharmacy_id, drug_id) DO UPDATE SET
  in_stock = EXCLUDED.in_stock,
  quantity = EXCLUDED.quantity,
  current_price = EXCLUDED.current_price,
  last_updated = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of seeded data:
-- 5 new pharmacy users (+ 1 existing from seed.sql = 6 total)
-- 5 new pharmacy profiles (+ 1 existing = 6 total)
-- ~30 inventory records across pharmacies
-- Mix of: IN_STOCK (qty>10), LOW_STOCK (qty 1-10), OUT_OF_STOCK (qty=0)
-- 1 unverified pharmacy (QuickMed) for testing verification filter
-- ─────────────────────────────────────────────────────────────────────────────
