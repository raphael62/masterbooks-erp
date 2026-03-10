-- Chart of Accounts Migration
-- Ghana GRA-compliant Chart of Accounts structure

-- 1. Create ENUM types
DROP TYPE IF EXISTS public.coa_account_type CASCADE;
CREATE TYPE public.coa_account_type AS ENUM (
  'Assets',
  'Liabilities',
  'Equity',
  'Revenue',
  'Cost of Goods Sold',
  'Expenses'
);

-- 2. Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(20) NOT NULL,
  account_name TEXT NOT NULL,
  account_type public.coa_account_type NOT NULL,
  sub_type TEXT,
  parent_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_header BOOLEAN NOT NULL DEFAULT false,
  currency VARCHAR(10) NOT NULL DEFAULT 'GHS',
  opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Unique index on account_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_coa_account_code ON public.chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_coa_account_type ON public.chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_coa_parent_account_id ON public.chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_coa_is_header ON public.chart_of_accounts(is_header);

-- 4. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_coa_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- 6. Open access RLS policy
DROP POLICY IF EXISTS "coa_open_access" ON public.chart_of_accounts;
CREATE POLICY "coa_open_access"
  ON public.chart_of_accounts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 7. Trigger for updated_at
DROP TRIGGER IF EXISTS trg_coa_updated_at ON public.chart_of_accounts;
CREATE TRIGGER trg_coa_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coa_updated_at();

-- 8. Seed Ghana GRA-compliant Chart of Accounts
DO $$
DECLARE
  -- Assets headers
  assets_id UUID := gen_random_uuid();
  current_assets_id UUID := gen_random_uuid();
  fixed_assets_id UUID := gen_random_uuid();
  other_assets_id UUID := gen_random_uuid();
  -- Liabilities headers
  liabilities_id UUID := gen_random_uuid();
  current_liab_id UUID := gen_random_uuid();
  long_term_liab_id UUID := gen_random_uuid();
  -- Equity headers
  equity_id UUID := gen_random_uuid();
  -- Revenue headers
  revenue_id UUID := gen_random_uuid();
  -- COGS headers
  cogs_id UUID := gen_random_uuid();
  -- Expenses headers
  expenses_id UUID := gen_random_uuid();
  admin_exp_id UUID := gen_random_uuid();
  selling_exp_id UUID := gen_random_uuid();
  finance_exp_id UUID := gen_random_uuid();
BEGIN

  -- ============================================================
  -- ASSETS (1xxx)
  -- ============================================================
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (assets_id, '1000', 'ASSETS', 'Assets', NULL, NULL, true, 'GHS', 0, 0, true, 'Total Assets header account')
  ON CONFLICT (account_code) DO NOTHING;

  -- Current Assets header
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (current_assets_id, '1100', 'Current Assets', 'Assets', 'Current Assets', assets_id, true, 'GHS', 0, 0, true, 'Current Assets group')
  ON CONFLICT (account_code) DO NOTHING;

  -- Cash and Bank
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '1101', 'Cash on Hand', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Petty cash and cash on hand'),
    (gen_random_uuid(), '1102', 'Cash at Bank - GCB', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Ghana Commercial Bank current account'),
    (gen_random_uuid(), '1103', 'Cash at Bank - Ecobank', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Ecobank current account'),
    (gen_random_uuid(), '1104', 'Cash at Bank - Stanbic', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Stanbic Bank current account'),
    (gen_random_uuid(), '1105', 'Mobile Money - MTN', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'MTN Mobile Money wallet'),
    (gen_random_uuid(), '1106', 'Mobile Money - Vodafone', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Vodafone Cash wallet'),
    (gen_random_uuid(), '1110', 'Accounts Receivable', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Trade debtors - amounts owed by customers'),
    (gen_random_uuid(), '1111', 'Allowance for Doubtful Debts', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Provision for bad debts'),
    (gen_random_uuid(), '1120', 'Inventory - Finished Goods', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Stock of finished goods for sale'),
    (gen_random_uuid(), '1121', 'Inventory - Raw Materials', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Raw materials and packaging'),
    (gen_random_uuid(), '1122', 'Inventory - Returnable Empties', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Returnable bottles, crates and kegs'),
    (gen_random_uuid(), '1130', 'Prepaid Expenses', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Expenses paid in advance'),
    (gen_random_uuid(), '1131', 'Prepaid Insurance', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Insurance premiums paid in advance'),
    (gen_random_uuid(), '1140', 'VAT Input Credit', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'VAT paid on purchases recoverable from GRA'),
    (gen_random_uuid(), '1141', 'NHIL Input Credit', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'NHIL paid on purchases'),
    (gen_random_uuid(), '1142', 'GETFund Input Credit', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'GETFund levy paid on purchases'),
    (gen_random_uuid(), '1150', 'Staff Advances', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Advances given to employees'),
    (gen_random_uuid(), '1160', 'Other Current Assets', 'Assets', 'Current Assets', current_assets_id, false, 'GHS', 0, 0, true, 'Miscellaneous current assets')
  ON CONFLICT (account_code) DO NOTHING;

  -- Fixed Assets header
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (fixed_assets_id, '1200', 'Fixed Assets (Non-Current)', 'Assets', 'Fixed Assets', assets_id, true, 'GHS', 0, 0, true, 'Fixed Assets group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '1201', 'Land and Buildings', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Land and building assets'),
    (gen_random_uuid(), '1202', 'Accumulated Depreciation - Buildings', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Accumulated depreciation on buildings'),
    (gen_random_uuid(), '1210', 'Plant and Machinery', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Production plant and machinery'),
    (gen_random_uuid(), '1211', 'Accumulated Depreciation - Plant', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Accumulated depreciation on plant'),
    (gen_random_uuid(), '1220', 'Motor Vehicles', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Company vehicles and trucks'),
    (gen_random_uuid(), '1221', 'Accumulated Depreciation - Vehicles', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Accumulated depreciation on vehicles'),
    (gen_random_uuid(), '1230', 'Furniture and Fittings', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Office furniture and fittings'),
    (gen_random_uuid(), '1231', 'Accumulated Depreciation - Furniture', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Accumulated depreciation on furniture'),
    (gen_random_uuid(), '1240', 'Computer Equipment', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Computers and IT equipment'),
    (gen_random_uuid(), '1241', 'Accumulated Depreciation - Computers', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Accumulated depreciation on computers'),
    (gen_random_uuid(), '1250', 'Capital Work in Progress', 'Assets', 'Fixed Assets', fixed_assets_id, false, 'GHS', 0, 0, true, 'Assets under construction')
  ON CONFLICT (account_code) DO NOTHING;

  -- Other Assets
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (other_assets_id, '1300', 'Other Non-Current Assets', 'Assets', 'Other Assets', assets_id, true, 'GHS', 0, 0, true, 'Other non-current assets group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '1301', 'Intangible Assets', 'Assets', 'Other Assets', other_assets_id, false, 'GHS', 0, 0, true, 'Goodwill, patents, trademarks'),
    (gen_random_uuid(), '1302', 'Long-term Investments', 'Assets', 'Other Assets', other_assets_id, false, 'GHS', 0, 0, true, 'Long-term investment holdings'),
    (gen_random_uuid(), '1303', 'Security Deposits', 'Assets', 'Other Assets', other_assets_id, false, 'GHS', 0, 0, true, 'Deposits paid as security')
  ON CONFLICT (account_code) DO NOTHING;

  -- ============================================================
  -- LIABILITIES (2xxx)
  -- ============================================================
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (liabilities_id, '2000', 'LIABILITIES', 'Liabilities', NULL, NULL, true, 'GHS', 0, 0, true, 'Total Liabilities header account')
  ON CONFLICT (account_code) DO NOTHING;

  -- Current Liabilities
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (current_liab_id, '2100', 'Current Liabilities', 'Liabilities', 'Current Liabilities', liabilities_id, true, 'GHS', 0, 0, true, 'Current Liabilities group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '2101', 'Accounts Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Trade creditors - amounts owed to suppliers'),
    (gen_random_uuid(), '2102', 'Accrued Expenses', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Expenses incurred but not yet paid'),
    (gen_random_uuid(), '2103', 'Accrued Salaries and Wages', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Salaries and wages accrued'),
    (gen_random_uuid(), '2110', 'VAT Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'VAT collected on sales payable to GRA'),
    (gen_random_uuid(), '2111', 'NHIL Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'NHIL levy collected payable to GRA'),
    (gen_random_uuid(), '2112', 'GETFund Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'GETFund levy collected payable to GRA'),
    (gen_random_uuid(), '2113', 'COVID-19 Levy Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'COVID-19 Health Recovery Levy payable to GRA'),
    (gen_random_uuid(), '2120', 'PAYE Tax Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'PAYE income tax deducted from employees payable to GRA'),
    (gen_random_uuid(), '2121', 'SSNIT Contributions Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'SSNIT contributions payable'),
    (gen_random_uuid(), '2122', 'Tier 2 Pension Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Tier 2 occupational pension payable'),
    (gen_random_uuid(), '2130', 'Income Tax Payable', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Corporate income tax payable to GRA'),
    (gen_random_uuid(), '2140', 'Customer Deposits', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Deposits received from customers'),
    (gen_random_uuid(), '2141', 'Returnable Empties Deposits', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Deposits on returnable bottles and crates'),
    (gen_random_uuid(), '2150', 'Short-term Loans', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Bank overdrafts and short-term borrowings'),
    (gen_random_uuid(), '2160', 'Deferred Revenue', 'Liabilities', 'Current Liabilities', current_liab_id, false, 'GHS', 0, 0, true, 'Revenue received in advance')
  ON CONFLICT (account_code) DO NOTHING;

  -- Long-term Liabilities
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (long_term_liab_id, '2200', 'Long-term Liabilities', 'Liabilities', 'Long-term Liabilities', liabilities_id, true, 'GHS', 0, 0, true, 'Long-term Liabilities group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '2201', 'Long-term Bank Loans', 'Liabilities', 'Long-term Liabilities', long_term_liab_id, false, 'GHS', 0, 0, true, 'Long-term bank borrowings'),
    (gen_random_uuid(), '2202', 'Deferred Tax Liability', 'Liabilities', 'Long-term Liabilities', long_term_liab_id, false, 'GHS', 0, 0, true, 'Deferred income tax liability'),
    (gen_random_uuid(), '2203', 'Finance Lease Obligations', 'Liabilities', 'Long-term Liabilities', long_term_liab_id, false, 'GHS', 0, 0, true, 'Obligations under finance leases')
  ON CONFLICT (account_code) DO NOTHING;

  -- ============================================================
  -- EQUITY (3xxx)
  -- ============================================================
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (equity_id, '3000', 'EQUITY', 'Equity', NULL, NULL, true, 'GHS', 0, 0, true, 'Total Equity header account')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '3001', 'Share Capital', 'Equity', 'Owners Equity', equity_id, false, 'GHS', 0, 0, true, 'Issued and paid-up share capital'),
    (gen_random_uuid(), '3002', 'Share Premium', 'Equity', 'Owners Equity', equity_id, false, 'GHS', 0, 0, true, 'Premium on shares issued above par value'),
    (gen_random_uuid(), '3010', 'Retained Earnings', 'Equity', 'Retained Earnings', equity_id, false, 'GHS', 0, 0, true, 'Accumulated retained earnings'),
    (gen_random_uuid(), '3011', 'Current Year Profit/Loss', 'Equity', 'Retained Earnings', equity_id, false, 'GHS', 0, 0, true, 'Net profit or loss for the current year'),
    (gen_random_uuid(), '3020', 'Revaluation Reserve', 'Equity', 'Reserves', equity_id, false, 'GHS', 0, 0, true, 'Asset revaluation surplus'),
    (gen_random_uuid(), '3021', 'General Reserve', 'Equity', 'Reserves', equity_id, false, 'GHS', 0, 0, true, 'General reserve fund'),
    (gen_random_uuid(), '3030', 'Drawings', 'Equity', 'Owners Equity', equity_id, false, 'GHS', 0, 0, true, 'Owner drawings from the business')
  ON CONFLICT (account_code) DO NOTHING;

  -- ============================================================
  -- REVENUE (4xxx)
  -- ============================================================
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (revenue_id, '4000', 'REVENUE', 'Revenue', NULL, NULL, true, 'GHS', 0, 0, true, 'Total Revenue header account')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '4001', 'Sales Revenue - Beverages', 'Revenue', 'Operating Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Revenue from beverage sales'),
    (gen_random_uuid(), '4002', 'Sales Revenue - Water', 'Revenue', 'Operating Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Revenue from water product sales'),
    (gen_random_uuid(), '4003', 'Sales Revenue - Spirits', 'Revenue', 'Operating Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Revenue from spirits and liquor sales'),
    (gen_random_uuid(), '4004', 'Sales Revenue - Other Products', 'Revenue', 'Operating Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Revenue from other product sales'),
    (gen_random_uuid(), '4010', 'Empties Revenue', 'Revenue', 'Operating Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Revenue from returnable empties sales'),
    (gen_random_uuid(), '4020', 'Discount Received', 'Revenue', 'Other Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Discounts received from suppliers'),
    (gen_random_uuid(), '4030', 'Interest Income', 'Revenue', 'Other Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Interest earned on bank deposits'),
    (gen_random_uuid(), '4040', 'Other Income', 'Revenue', 'Other Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Miscellaneous other income'),
    (gen_random_uuid(), '4050', 'Sales Returns and Allowances', 'Revenue', 'Contra Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Returns and allowances on sales'),
    (gen_random_uuid(), '4060', 'Sales Discounts', 'Revenue', 'Contra Revenue', revenue_id, false, 'GHS', 0, 0, true, 'Discounts given to customers')
  ON CONFLICT (account_code) DO NOTHING;

  -- ============================================================
  -- COST OF GOODS SOLD (5xxx)
  -- ============================================================
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (cogs_id, '5000', 'COST OF GOODS SOLD', 'Cost of Goods Sold', NULL, NULL, true, 'GHS', 0, 0, true, 'Total Cost of Goods Sold header account')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '5001', 'Cost of Goods Sold - Beverages', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Cost of beverages sold'),
    (gen_random_uuid(), '5002', 'Cost of Goods Sold - Water', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Cost of water products sold'),
    (gen_random_uuid(), '5003', 'Cost of Goods Sold - Spirits', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Cost of spirits sold'),
    (gen_random_uuid(), '5004', 'Cost of Goods Sold - Other', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Cost of other products sold'),
    (gen_random_uuid(), '5010', 'Purchase Returns', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Returns on purchases'),
    (gen_random_uuid(), '5020', 'Freight and Carriage Inwards', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Freight costs on purchases'),
    (gen_random_uuid(), '5030', 'Customs Duties and Levies', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Import duties and levies on purchases'),
    (gen_random_uuid(), '5040', 'Excise Duty', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Excise duty on goods'),
    (gen_random_uuid(), '5050', 'Direct Labour', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Direct production labour costs'),
    (gen_random_uuid(), '5060', 'Manufacturing Overhead', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Factory overhead costs'),
    (gen_random_uuid(), '5070', 'Inventory Write-off', 'Cost of Goods Sold', 'Direct Costs', cogs_id, false, 'GHS', 0, 0, true, 'Write-off of obsolete or damaged inventory')
  ON CONFLICT (account_code) DO NOTHING;

  -- ============================================================
  -- EXPENSES (6xxx)
  -- ============================================================
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (expenses_id, '6000', 'EXPENSES', 'Expenses', NULL, NULL, true, 'GHS', 0, 0, true, 'Total Expenses header account')
  ON CONFLICT (account_code) DO NOTHING;

  -- Administrative Expenses
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (admin_exp_id, '6100', 'Administrative Expenses', 'Expenses', 'Administrative Expenses', expenses_id, true, 'GHS', 0, 0, true, 'Administrative Expenses group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '6101', 'Salaries and Wages', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Staff salaries and wages'),
    (gen_random_uuid(), '6102', 'SSNIT Employer Contribution', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Employer SSNIT contributions'),
    (gen_random_uuid(), '6103', 'Tier 2 Employer Contribution', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Employer Tier 2 pension contributions'),
    (gen_random_uuid(), '6104', 'Staff Welfare and Benefits', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Employee welfare and benefits'),
    (gen_random_uuid(), '6105', 'Training and Development', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Staff training and development costs'),
    (gen_random_uuid(), '6110', 'Rent and Rates', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Office and warehouse rent'),
    (gen_random_uuid(), '6111', 'Electricity and Utilities', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Electricity, water and utility bills'),
    (gen_random_uuid(), '6112', 'Telephone and Internet', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Communication expenses'),
    (gen_random_uuid(), '6113', 'Office Supplies and Stationery', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Office consumables and stationery'),
    (gen_random_uuid(), '6114', 'Postage and Courier', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Postage and courier charges'),
    (gen_random_uuid(), '6120', 'Depreciation - Buildings', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Depreciation charge on buildings'),
    (gen_random_uuid(), '6121', 'Depreciation - Plant and Machinery', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Depreciation charge on plant'),
    (gen_random_uuid(), '6122', 'Depreciation - Vehicles', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Depreciation charge on vehicles'),
    (gen_random_uuid(), '6123', 'Depreciation - Computers', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Depreciation charge on computers'),
    (gen_random_uuid(), '6124', 'Depreciation - Furniture', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Depreciation charge on furniture'),
    (gen_random_uuid(), '6130', 'Audit and Accounting Fees', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'External audit and accounting fees'),
    (gen_random_uuid(), '6131', 'Legal and Professional Fees', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Legal and professional advisory fees'),
    (gen_random_uuid(), '6132', 'Consulting Fees', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Management and consulting fees'),
    (gen_random_uuid(), '6140', 'Insurance Premiums', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Business insurance premiums'),
    (gen_random_uuid(), '6141', 'Repairs and Maintenance', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Repairs and maintenance of assets'),
    (gen_random_uuid(), '6150', 'Bank Charges', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Bank service charges and fees'),
    (gen_random_uuid(), '6151', 'Mobile Money Charges', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Mobile money transaction charges'),
    (gen_random_uuid(), '6160', 'Miscellaneous Expenses', 'Expenses', 'Administrative Expenses', admin_exp_id, false, 'GHS', 0, 0, true, 'Other miscellaneous administrative expenses')
  ON CONFLICT (account_code) DO NOTHING;

  -- Selling and Distribution Expenses
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (selling_exp_id, '6200', 'Selling and Distribution Expenses', 'Expenses', 'Selling Expenses', expenses_id, true, 'GHS', 0, 0, true, 'Selling and Distribution Expenses group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '6201', 'Sales Commission', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Sales commissions paid to agents'),
    (gen_random_uuid(), '6202', 'Advertising and Promotions', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Marketing and advertising costs'),
    (gen_random_uuid(), '6203', 'Delivery and Freight Outwards', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Delivery costs to customers'),
    (gen_random_uuid(), '6204', 'Vehicle Running Costs', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Fuel, oil and vehicle maintenance'),
    (gen_random_uuid(), '6205', 'Packaging Materials', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Packaging and wrapping materials'),
    (gen_random_uuid(), '6206', 'Customer Entertainment', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Customer entertainment and hospitality'),
    (gen_random_uuid(), '6207', 'Trade Discounts Allowed', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Discounts allowed to customers'),
    (gen_random_uuid(), '6208', 'Bad Debts Written Off', 'Expenses', 'Selling Expenses', selling_exp_id, false, 'GHS', 0, 0, true, 'Irrecoverable debts written off')
  ON CONFLICT (account_code) DO NOTHING;

  -- Finance Expenses
  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES (finance_exp_id, '6300', 'Finance Costs', 'Expenses', 'Finance Expenses', expenses_id, true, 'GHS', 0, 0, true, 'Finance Costs group')
  ON CONFLICT (account_code) DO NOTHING;

  INSERT INTO public.chart_of_accounts (id, account_code, account_name, account_type, sub_type, parent_account_id, is_header, currency, opening_balance, current_balance, is_active, description)
  VALUES
    (gen_random_uuid(), '6301', 'Interest on Bank Loans', 'Expenses', 'Finance Expenses', finance_exp_id, false, 'GHS', 0, 0, true, 'Interest charges on bank loans'),
    (gen_random_uuid(), '6302', 'Interest on Overdraft', 'Expenses', 'Finance Expenses', finance_exp_id, false, 'GHS', 0, 0, true, 'Interest on bank overdraft'),
    (gen_random_uuid(), '6303', 'Finance Lease Charges', 'Expenses', 'Finance Expenses', finance_exp_id, false, 'GHS', 0, 0, true, 'Finance charges on leased assets'),
    (gen_random_uuid(), '6304', 'Foreign Exchange Loss', 'Expenses', 'Finance Expenses', finance_exp_id, false, 'GHS', 0, 0, true, 'Losses on foreign currency transactions')
  ON CONFLICT (account_code) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Chart of Accounts seed data error: %', SQLERRM;
END $$;
