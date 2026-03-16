-- Stock Transfer: add request date, driver, vehicle; line items: pack unit, cartons, bottles, ctn_qty, value
-- Timestamp: 20260309250000

ALTER TABLE public.stock_transfer_header
  ADD COLUMN IF NOT EXISTS request_date DATE,
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_no TEXT;

ALTER TABLE public.stock_transfer_items
  ADD COLUMN IF NOT EXISTS pack_unit NUMERIC(12, 2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cartons NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bottles NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctn_qty NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(14, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS value NUMERIC(14, 2) DEFAULT 0;
