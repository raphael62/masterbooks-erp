-- Add pack_unit column to products table if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'pack_unit'
  ) THEN
    ALTER TABLE public.products ADD COLUMN pack_unit INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Create returnable_items master table
CREATE TABLE IF NOT EXISTS public.returnable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('Bottle', 'Crate', 'Keg', 'Other')),
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_level INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'Pcs',
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create returnable_transactions table
CREATE TABLE IF NOT EXISTS public.returnable_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  item_id UUID REFERENCES public.returnable_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  quantity_given INTEGER NOT NULL DEFAULT 0,
  quantity_returned INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partial_return', 'fully_returned')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT NOT NULL,
  location TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'transfer', 'adjustment')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  reference_no TEXT,
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.returnable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returnable_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for returnable_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'returnable_items' AND policyname = 'Allow authenticated read returnable_items') THEN
    CREATE POLICY "Allow authenticated read returnable_items" ON public.returnable_items FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'returnable_items' AND policyname = 'Allow authenticated insert returnable_items') THEN
    CREATE POLICY "Allow authenticated insert returnable_items" ON public.returnable_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'returnable_items' AND policyname = 'Allow authenticated update returnable_items') THEN
    CREATE POLICY "Allow authenticated update returnable_items" ON public.returnable_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RLS Policies for returnable_transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'returnable_transactions' AND policyname = 'Allow authenticated read returnable_transactions') THEN
    CREATE POLICY "Allow authenticated read returnable_transactions" ON public.returnable_transactions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'returnable_transactions' AND policyname = 'Allow authenticated insert returnable_transactions') THEN
    CREATE POLICY "Allow authenticated insert returnable_transactions" ON public.returnable_transactions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'returnable_transactions' AND policyname = 'Allow authenticated update returnable_transactions') THEN
    CREATE POLICY "Allow authenticated update returnable_transactions" ON public.returnable_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RLS Policies for stock_movements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_movements' AND policyname = 'Allow authenticated read stock_movements') THEN
    CREATE POLICY "Allow authenticated read stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_movements' AND policyname = 'Allow authenticated insert stock_movements') THEN
    CREATE POLICY "Allow authenticated insert stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_returnable_transactions_customer ON public.returnable_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_returnable_transactions_date ON public.returnable_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_returnable_transactions_status ON public.returnable_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(transaction_type);