-- ============================================================
-- COMPREHENSIVE SEED DATA FOR GHANA DISTRIBUTION BUSINESS
-- MasterBooks Distribution System
-- Currency: GHS (Ghana Cedis)
-- ============================================================

DO $$
DECLARE
  -- Company IDs
  comp1_id UUID := '11111111-1111-1111-1111-111111111001';
  comp2_id UUID := '11111111-1111-1111-1111-111111111002';
  comp3_id UUID := '11111111-1111-1111-1111-111111111003';

  -- Location IDs (comp1)
  loc1_1_id UUID := '22222222-2222-2222-2222-222222222001'; -- MBD Main Warehouse
  loc1_2_id UUID := '22222222-2222-2222-2222-222222222002'; -- MBD Tema Branch
  loc1_3_id UUID := '22222222-2222-2222-2222-222222222003'; -- MBD Kumasi Branch

  -- Location IDs (comp2)
  loc2_1_id UUID := '22222222-2222-2222-2222-222222222004'; -- GBD Main Depot
  loc2_2_id UUID := '22222222-2222-2222-2222-222222222005'; -- GBD Takoradi Branch

  -- Location IDs (comp3)
  loc3_1_id UUID := '22222222-2222-2222-2222-222222222006'; -- NDS Tamale Depot
  loc3_2_id UUID := '22222222-2222-2222-2222-222222222007'; -- NDS Bolgatanga Branch

  -- Supplier IDs
  sup1_id UUID := '33333333-3333-3333-3333-333333333001';
  sup2_id UUID := '33333333-3333-3333-3333-333333333002';
  sup3_id UUID := '33333333-3333-3333-3333-333333333003';
  sup4_id UUID := '33333333-3333-3333-3333-333333333004';
  sup5_id UUID := '33333333-3333-3333-3333-333333333005';
  sup6_id UUID := '33333333-3333-3333-3333-333333333006';
  sup7_id UUID := '33333333-3333-3333-3333-333333333007';

  -- Executive IDs
  exec1_id UUID := '44444444-4444-4444-4444-444444444001';
  exec2_id UUID := '44444444-4444-4444-4444-444444444002';
  exec3_id UUID := '44444444-4444-4444-4444-444444444003';
  exec4_id UUID := '44444444-4444-4444-4444-444444444004';
  exec5_id UUID := '44444444-4444-4444-4444-444444444005';
  exec6_id UUID := '44444444-4444-4444-4444-444444444006';
  exec7_id UUID := '44444444-4444-4444-4444-444444444007';
  exec8_id UUID := '44444444-4444-4444-4444-444444444008';
  exec9_id UUID := '44444444-4444-4444-4444-444444444009';
  exec10_id UUID := '44444444-4444-4444-4444-444444444010';
  exec11_id UUID := '44444444-4444-4444-4444-444444444011';
  exec12_id UUID := '44444444-4444-4444-4444-444444444012';

  -- Product IDs - Beverages
  prod_bev1 UUID := '55555555-5555-5555-5555-555555555001';
  prod_bev2 UUID := '55555555-5555-5555-5555-555555555002';
  prod_bev3 UUID := '55555555-5555-5555-5555-555555555003';
  prod_bev4 UUID := '55555555-5555-5555-5555-555555555004';
  prod_bev5 UUID := '55555555-5555-5555-5555-555555555005';
  prod_bev6 UUID := '55555555-5555-5555-5555-555555555006';
  prod_bev7 UUID := '55555555-5555-5555-5555-555555555007';
  prod_bev8 UUID := '55555555-5555-5555-5555-555555555008';
  prod_bev9 UUID := '55555555-5555-5555-5555-555555555009';
  prod_bev10 UUID := '55555555-5555-5555-5555-555555555010';

  -- Product IDs - Dairy
  prod_dai1 UUID := '55555555-5555-5555-5555-555555555011';
  prod_dai2 UUID := '55555555-5555-5555-5555-555555555012';
  prod_dai3 UUID := '55555555-5555-5555-5555-555555555013';
  prod_dai4 UUID := '55555555-5555-5555-5555-555555555014';
  prod_dai5 UUID := '55555555-5555-5555-5555-555555555015';

  -- Product IDs - Snacks
  prod_snk1 UUID := '55555555-5555-5555-5555-555555555016';
  prod_snk2 UUID := '55555555-5555-5555-5555-555555555017';
  prod_snk3 UUID := '55555555-5555-5555-5555-555555555018';
  prod_snk4 UUID := '55555555-5555-5555-5555-555555555019';
  prod_snk5 UUID := '55555555-5555-5555-5555-555555555020';
  prod_snk6 UUID := '55555555-5555-5555-5555-555555555021';

  -- Product IDs - Water
  prod_wat1 UUID := '55555555-5555-5555-5555-555555555022';
  prod_wat2 UUID := '55555555-5555-5555-5555-555555555023';
  prod_wat3 UUID := '55555555-5555-5555-5555-555555555024';

  -- Product IDs - Spirits & Beer
  prod_spr1 UUID := '55555555-5555-5555-5555-555555555025';
  prod_spr2 UUID := '55555555-5555-5555-5555-555555555026';
  prod_spr3 UUID := '55555555-5555-5555-5555-555555555027';
  prod_spr4 UUID := '55555555-5555-5555-5555-555555555028';
  prod_spr5 UUID := '55555555-5555-5555-5555-555555555029';
  prod_spr6 UUID := '55555555-5555-5555-5555-555555555030';

  -- Product IDs - Household
  prod_hh1 UUID := '55555555-5555-5555-5555-555555555031';
  prod_hh2 UUID := '55555555-5555-5555-5555-555555555032';
  prod_hh3 UUID := '55555555-5555-5555-5555-555555555033';
  prod_hh4 UUID := '55555555-5555-5555-5555-555555555034';

  -- Product IDs - Tobacco
  prod_tob1 UUID := '55555555-5555-5555-5555-555555555035';
  prod_tob2 UUID := '55555555-5555-5555-5555-555555555036';

  -- Product IDs - Confectionery
  prod_con1 UUID := '55555555-5555-5555-5555-555555555037';
  prod_con2 UUID := '55555555-5555-5555-5555-555555555038';
  prod_con3 UUID := '55555555-5555-5555-5555-555555555039';

  -- Product IDs - Cooking
  prod_ck1 UUID := '55555555-5555-5555-5555-555555555040';
  prod_ck2 UUID := '55555555-5555-5555-5555-555555555041';
  prod_ck3 UUID := '55555555-5555-5555-5555-555555555042';

  -- Product IDs - Personal Care
  prod_pc1 UUID := '55555555-5555-5555-5555-555555555043';
  prod_pc2 UUID := '55555555-5555-5555-5555-555555555044';
  prod_pc3 UUID := '55555555-5555-5555-5555-555555555045';

  -- Product IDs - Cereals
  prod_cer1 UUID := '55555555-5555-5555-5555-555555555046';
  prod_cer2 UUID := '55555555-5555-5555-5555-555555555047';
  prod_cer3 UUID := '55555555-5555-5555-5555-555555555048';

  -- Customer IDs
  cust1_id UUID := '66666666-6666-6666-6666-666666666001';
  cust2_id UUID := '66666666-6666-6666-6666-666666666002';
  cust3_id UUID := '66666666-6666-6666-6666-666666666003';
  cust4_id UUID := '66666666-6666-6666-6666-666666666004';
  cust5_id UUID := '66666666-6666-6666-6666-666666666005';
  cust6_id UUID := '66666666-6666-6666-6666-666666666006';
  cust7_id UUID := '66666666-6666-6666-6666-666666666007';
  cust8_id UUID := '66666666-6666-6666-6666-666666666008';
  cust9_id UUID := '66666666-6666-6666-6666-666666666009';
  cust10_id UUID := '66666666-6666-6666-6666-666666666010';
  cust11_id UUID := '66666666-6666-6666-6666-666666666011';
  cust12_id UUID := '66666666-6666-6666-6666-666666666012';
  cust13_id UUID := '66666666-6666-6666-6666-666666666013';
  cust14_id UUID := '66666666-6666-6666-6666-666666666014';
  cust15_id UUID := '66666666-6666-6666-6666-666666666015';
  cust16_id UUID := '66666666-6666-6666-6666-666666666016';
  cust17_id UUID := '66666666-6666-6666-6666-666666666017';
  cust18_id UUID := '66666666-6666-6666-6666-666666666018';
  cust19_id UUID := '66666666-6666-6666-6666-666666666019';
  cust20_id UUID := '66666666-6666-6666-6666-666666666020';
  cust21_id UUID := '66666666-6666-6666-6666-666666666021';
  cust22_id UUID := '66666666-6666-6666-6666-666666666022';
  cust23_id UUID := '66666666-6666-6666-6666-666666666023';
  cust24_id UUID := '66666666-6666-6666-6666-666666666024';
  cust25_id UUID := '66666666-6666-6666-6666-666666666025';

  -- Returnable Item IDs
  ret1_id UUID := '77777777-7777-7777-7777-777777777001';
  ret2_id UUID := '77777777-7777-7777-7777-777777777002';
  ret3_id UUID := '77777777-7777-7777-7777-777777777003';
  ret4_id UUID := '77777777-7777-7777-7777-777777777004';
  ret5_id UUID := '77777777-7777-7777-7777-777777777005';
  ret6_id UUID := '77777777-7777-7777-7777-777777777006';

  -- Purchase Invoice IDs
  pi1_id UUID := '88888888-8888-8888-8888-888888888001';
  pi2_id UUID := '88888888-8888-8888-8888-888888888002';
  pi3_id UUID := '88888888-8888-8888-8888-888888888003';
  pi4_id UUID := '88888888-8888-8888-8888-888888888004';
  pi5_id UUID := '88888888-8888-8888-8888-888888888005';
  pi6_id UUID := '88888888-8888-8888-8888-888888888006';
  pi7_id UUID := '88888888-8888-8888-8888-888888888007';
  pi8_id UUID := '88888888-8888-8888-8888-888888888008';
  pi9_id UUID := '88888888-8888-8888-8888-888888888009';
  pi10_id UUID := '88888888-8888-8888-8888-888888888010';
  pi11_id UUID := '88888888-8888-8888-8888-888888888011';
  pi12_id UUID := '88888888-8888-8888-8888-888888888012';

BEGIN

-- ============================================================
-- 1. COMPANIES
-- ============================================================
INSERT INTO public.companies (
  id, name, code, registration_number, tin_number, vat_number,
  address, city, region, phone, email, website, is_active, is_default
) VALUES
  (
    comp1_id,
    'MasterBooks Distribution Ltd',
    'MBD',
    'CS-2018-001234',
    'C0012345678901',
    'V0012345678901',
    'Plot 45, Industrial Area, Spintex Road',
    'Accra',
    'Greater Accra',
    '+233 24 123 4567',
    'info@masterbooks.gh',
    'www.masterbooks.gh',
    true,
    true
  ),
  (
    comp2_id,
    'Ghana Beverages Distribution Co.',
    'GBD',
    'CS-2015-005678',
    'C0098765432109',
    'V0098765432109',
    '12 Harbour Road, Takoradi',
    'Takoradi',
    'Western',
    '+233 31 202 3456',
    'info@ghanabev.gh',
    'www.ghanabev.gh',
    true,
    false
  ),
  (
    comp3_id,
    'Northern Distribution Services',
    'NDS',
    'CS-2020-009012',
    'C0056789012345',
    NULL,
    '8 Market Road, Tamale',
    'Tamale',
    'Northern',
    '+233 37 201 5678',
    'info@northerndist.gh',
    NULL,
    true,
    false
  )
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. LOCATIONS
-- ============================================================
INSERT INTO public.locations (
  id, company_id, name, code, location_type,
  address, city, phone, manager, is_active, is_default, inventory_enabled
) VALUES
  -- MasterBooks Distribution Ltd locations
  (loc1_1_id, comp1_id, 'Main Warehouse', 'MW001', 'warehouse', 'Industrial Area, Spintex Road, Accra', 'Accra', '+233 24 123 4567', 'Kwame Asante', true, true, true),
  (loc1_2_id, comp1_id, 'Tema Branch', 'TB002', 'branch', 'Community 1, Tema', 'Tema', '+233 24 234 5678', 'Ama Serwaa', true, false, true),
  (loc1_3_id, comp1_id, 'Kumasi Branch', 'KB003', 'branch', 'Adum, Kumasi', 'Kumasi', '+233 24 345 6789', 'Kofi Boateng', true, false, true),
  -- Ghana Beverages Distribution Co. locations
  (loc2_1_id, comp2_id, 'Main Depot', 'MD001', 'warehouse', 'Harbour Road, Takoradi', 'Takoradi', '+233 31 202 3456', 'Yaw Mensah', true, true, true),
  (loc2_2_id, comp2_id, 'Takoradi Branch', 'TK002', 'branch', 'Market Circle, Takoradi', 'Takoradi', '+233 31 203 4567', 'Abena Owusu', true, false, true),
  -- Northern Distribution Services locations
  (loc3_1_id, comp3_id, 'Tamale Depot', 'TD001', 'warehouse', 'Market Road, Tamale', 'Tamale', '+233 37 201 5678', 'Ibrahim Alhassan', true, true, true),
  (loc3_2_id, comp3_id, 'Bolgatanga Branch', 'BG002', 'branch', 'Upper East Road, Bolgatanga', 'Bolgatanga', '+233 37 202 6789', 'Fatima Issah', true, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. SUPPLIERS
-- ============================================================
INSERT INTO public.suppliers (
  id, supplier_code, supplier_name, contact_person, phone, email, address, payment_terms, status
) VALUES
  (sup1_id, 'SUP001', 'Accra Brewery Limited', 'Emmanuel Asare', '+233 30 277 1234', 'procurement@abl.gh', 'Abeka, Accra', 'net30', 'Active'),
  (sup2_id, 'SUP002', 'Guinness Ghana Breweries', 'Patricia Agyemang', '+233 30 277 5678', 'orders@ggb.gh', 'Kaase, Kumasi', 'net30', 'Active'),
  (sup3_id, 'SUP003', 'Fan Milk Ghana Ltd', 'Nana Ama Darko', '+233 30 222 3456', 'supply@fanmilk.gh', 'North Industrial Area, Accra', 'net14', 'Active'),
  (sup4_id, 'SUP004', 'Nestlé Ghana Limited', 'Richard Osei', '+233 30 277 8901', 'trade@nestle.gh', 'Tema Industrial Area', 'net45', 'Active'),
  (sup5_id, 'SUP005', 'Unilever Ghana Ltd', 'Josephine Mensah', '+233 30 277 2345', 'orders@unilever.gh', 'Tema Free Zone', 'net30', 'Active'),
  (sup6_id, 'SUP006', 'Kasapreko Company Ltd', 'Daniel Quaye', '+233 30 277 6789', 'sales@kasapreko.gh', 'Spintex Road, Accra', 'net21', 'Active'),
  (sup7_id, 'SUP007', 'Voltic Ghana Ltd', 'Akosua Frimpong', '+233 30 277 3456', 'orders@voltic.gh', 'Tema, Greater Accra', 'net30', 'Active')
ON CONFLICT (supplier_code) DO NOTHING;

-- ============================================================
-- 4. VENDORS (extended vendor records)
-- ============================================================
INSERT INTO public.vendors (
  id, vendor_code, vendor_name, contact_person, phone, email, address, city, country,
  payment_terms, credit_limit, outstanding_balance, tax_id, bank_name, bank_account,
  category, status, company_id
) VALUES
  ('99999999-9999-9999-9999-999999999001', 'VEN001', 'Accra Brewery Limited', 'Emmanuel Asare', '+233 30 277 1234', 'procurement@abl.gh', 'Abeka, Accra', 'Accra', 'Ghana', 'net30', 2000000, 450000, 'C0011223344556', 'GCB Bank', '1234567890', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999002', 'VEN002', 'Guinness Ghana Breweries', 'Patricia Agyemang', '+233 30 277 5678', 'orders@ggb.gh', 'Kaase, Kumasi', 'Kumasi', 'Ghana', 'net30', 1500000, 320000, 'C0022334455667', 'Ecobank Ghana', '2345678901', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999003', 'VEN003', 'Fan Milk Ghana Ltd', 'Nana Ama Darko', '+233 30 222 3456', 'supply@fanmilk.gh', 'North Industrial Area, Accra', 'Accra', 'Ghana', 'net14', 800000, 125000, 'C0033445566778', 'Stanbic Bank', '3456789012', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999004', 'VEN004', 'Nestlé Ghana Limited', 'Richard Osei', '+233 30 277 8901', 'trade@nestle.gh', 'Tema Industrial Area', 'Tema', 'Ghana', 'net45', 1200000, 280000, 'C0044556677889', 'Standard Chartered', '4567890123', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999005', 'VEN005', 'Unilever Ghana Ltd', 'Josephine Mensah', '+233 30 277 2345', 'orders@unilever.gh', 'Tema Free Zone', 'Tema', 'Ghana', 'net30', 1000000, 195000, 'C0055667788990', 'Absa Bank Ghana', '5678901234', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999006', 'VEN006', 'Kasapreko Company Ltd', 'Daniel Quaye', '+233 30 277 6789', 'sales@kasapreko.gh', 'Spintex Road, Accra', 'Accra', 'Ghana', 'net21', 600000, 88000, 'C0066778899001', 'Fidelity Bank', '6789012345', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999007', 'VEN007', 'Voltic Ghana Ltd', 'Akosua Frimpong', '+233 30 277 3456', 'orders@voltic.gh', 'Tema, Greater Accra', 'Tema', 'Ghana', 'net30', 500000, 67000, 'C0077889900112', 'Cal Bank', '7890123456', 'supplier', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999008', 'VEN008', 'Pepsico Ghana Distributors', 'Kwabena Acheampong', '+233 24 456 7890', 'kwabena@pepsigh.com', 'East Legon, Accra', 'Accra', 'Ghana', 'net30', 750000, 142000, 'C0088990011223', 'GCB Bank', '8901234567', 'distributor', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999009', 'VEN009', 'Promasidor Ghana Ltd', 'Efua Asante', '+233 30 277 4567', 'efua@promasidor.gh', 'Spintex Road, Accra', 'Accra', 'Ghana', 'net45', 900000, 210000, 'C0099001122334', 'Zenith Bank Ghana', '9012345678', 'manufacturer', 'active', comp2_id),
  ('99999999-9999-9999-9999-999999999010', 'VEN010', 'Accra Distilleries Ltd', 'Kweku Boateng', '+233 24 567 8901', 'kweku@accradist.gh', 'Tema Industrial Area', 'Tema', 'Ghana', 'net30', 400000, 55000, 'C0010112233445', 'Ecobank Ghana', '0123456789', 'manufacturer', 'active', comp2_id),
  ('99999999-9999-9999-9999-999999999011', 'VEN011', 'Twellium Industrial Co.', 'Adwoa Mensah', '+233 24 678 9012', 'adwoa@twellium.gh', 'Spintex Road, Accra', 'Accra', 'Ghana', 'net21', 350000, 42000, 'C0011223344557', 'Stanbic Bank', '1234567891', 'manufacturer', 'active', comp3_id),
  ('99999999-9999-9999-9999-999999999012', 'VEN012', 'Kama Industries Ltd', 'Yaw Asante', '+233 24 789 0123', 'yaw@kama.gh', 'Tema Free Zone', 'Tema', 'Ghana', 'cod', 200000, 0, 'C0012234455668', 'GCB Bank', '2345678902', 'supplier', 'active', comp3_id),
  ('99999999-9999-9999-9999-999999999013', 'VEN013', 'Cocoa Processing Co.', 'Abena Darko', '+233 30 277 9012', 'abena@cpc.gh', 'Tema Industrial Area', 'Tema', 'Ghana', 'net60', 1100000, 330000, 'C0013345566779', 'Standard Chartered', '3456789013', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999014', 'VEN014', 'Friesland Campina WAMCO', 'Kofi Owusu', '+233 30 277 0123', 'kofi@wamco.gh', 'Accra', 'Accra', 'Ghana', 'net30', 650000, 98000, 'C0014456677880', 'Absa Bank Ghana', '4567890124', 'manufacturer', 'active', comp1_id),
  ('99999999-9999-9999-9999-999999999015', 'VEN015', 'Meridian Brick Ltd', 'Ama Boateng', '+233 24 890 1234', 'ama@meridian.gh', 'Kumasi', 'Kumasi', 'Ghana', 'net30', 300000, 25000, 'C0015567788991', 'Fidelity Bank', '5678901235', 'supplier', 'inactive', comp2_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. BUSINESS EXECUTIVES / SALES REPS
-- ============================================================
INSERT INTO public.business_executives (
  id, exec_code, full_name, phone, mobile, email, company_id, status
) VALUES
  (exec1_id, 'BE001', 'Kwame Asante', '+233 24 111 2233', '+233 24 111 2233', 'kwame.asante@masterbooks.gh', comp1_id, 'Active'),
  (exec2_id, 'BE002', 'Ama Serwaa', '+233 24 222 3344', '+233 24 222 3344', 'ama.serwaa@masterbooks.gh', comp1_id, 'Active'),
  (exec3_id, 'BE003', 'Kofi Boateng', '+233 24 333 4455', '+233 24 333 4455', 'kofi.boateng@masterbooks.gh', comp1_id, 'Active'),
  (exec4_id, 'BE004', 'Abena Owusu', '+233 24 444 5566', '+233 24 444 5566', 'abena.owusu@masterbooks.gh', comp1_id, 'Active'),
  (exec5_id, 'BE005', 'Yaw Mensah', '+233 24 555 6677', '+233 24 555 6677', 'yaw.mensah@masterbooks.gh', comp1_id, 'Active'),
  (exec6_id, 'BE006', 'Akosua Frimpong', '+233 24 666 7788', '+233 24 666 7788', 'akosua.frimpong@masterbooks.gh', comp1_id, 'Active'),
  (exec7_id, 'BE007', 'Emmanuel Darko', '+233 24 777 8899', '+233 24 777 8899', 'emmanuel.darko@masterbooks.gh', comp1_id, 'Active'),
  (exec8_id, 'BE008', 'Patricia Agyemang', '+233 24 888 9900', '+233 24 888 9900', 'patricia.agyemang@masterbooks.gh', comp1_id, 'Active'),
  (exec9_id, 'BE009', 'Daniel Quaye', '+233 24 999 0011', '+233 24 999 0011', 'daniel.quaye@ghanabev.gh', comp2_id, 'Active'),
  (exec10_id, 'BE010', 'Josephine Mensah', '+233 24 100 1122', '+233 24 100 1122', 'josephine.mensah@ghanabev.gh', comp2_id, 'Active'),
  (exec11_id, 'BE011', 'Ibrahim Alhassan', '+233 37 201 2233', '+233 37 201 2233', 'ibrahim.alhassan@northerndist.gh', comp3_id, 'Active'),
  (exec12_id, 'BE012', 'Fatima Issah', '+233 37 202 3344', '+233 37 202 3344', 'fatima.issah@northerndist.gh', comp3_id, 'Active')
ON CONFLICT (exec_code) DO NOTHING;

-- ============================================================
-- 6. PRODUCTS (50+ products across all categories)
-- ============================================================
INSERT INTO public.products (
  id, product_code, product_name, description, category,
  unit_of_measure, pack_unit, cost_price, selling_price,
  reorder_level, reorder_quantity, supplier_id, supplier_name,
  empties_type, is_taxable, is_returnable, plastic_cost, bottle_cost,
  status, company_id
) VALUES

  -- BEVERAGES (Soft Drinks)
  (prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Coca-Cola carbonated soft drink 35cl glass bottle', 'Beverages', 'Ctn', 24, 28.50, 36.00, 50, 200, sup1_id, 'Accra Brewery Limited', 'Bottle', true, true, 0, 0.80, 'active', comp1_id),
  (prod_bev2, 'BEV002', 'Coca-Cola 50cl PET', 'Coca-Cola carbonated soft drink 50cl plastic bottle', 'Beverages', 'Ctn', 12, 32.00, 42.00, 40, 150, sup1_id, 'Accra Brewery Limited', 'Plastic', true, false, 0.50, 0, 'active', comp1_id),
  (prod_bev3, 'BEV003', 'Fanta Orange 35cl Bottle', 'Fanta Orange carbonated drink 35cl glass bottle', 'Beverages', 'Ctn', 24, 28.50, 36.00, 50, 200, sup1_id, 'Accra Brewery Limited', 'Bottle', true, true, 0, 0.80, 'active', comp1_id),
  (prod_bev4, 'BEV004', 'Sprite 35cl Bottle', 'Sprite lemon-lime carbonated drink 35cl glass bottle', 'Beverages', 'Ctn', 24, 28.50, 36.00, 40, 150, sup1_id, 'Accra Brewery Limited', 'Bottle', true, true, 0, 0.80, 'active', comp1_id),
  (prod_bev5, 'BEV005', 'Pepsi 35cl Bottle', 'Pepsi cola carbonated drink 35cl glass bottle', 'Beverages', 'Ctn', 24, 27.00, 34.00, 40, 150, sup1_id, 'Accra Brewery Limited', 'Bottle', true, true, 0, 0.80, 'active', comp1_id),
  (prod_bev6, 'BEV006', '7UP 35cl Bottle', '7UP lemon-lime carbonated drink 35cl glass bottle', 'Beverages', 'Ctn', 24, 27.00, 34.00, 30, 120, sup1_id, 'Accra Brewery Limited', 'Bottle', true, true, 0, 0.80, 'active', comp1_id),
  (prod_bev7, 'BEV007', 'Malta Guinness 33cl Can', 'Malta Guinness non-alcoholic malt drink 33cl can', 'Beverages', 'Ctn', 24, 45.00, 58.00, 60, 240, sup2_id, 'Guinness Ghana Breweries', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_bev8, 'BEV008', 'Alvaro Pineapple 33cl', 'Alvaro pineapple flavoured malt drink 33cl can', 'Beverages', 'Ctn', 24, 42.00, 54.00, 40, 160, sup2_id, 'Guinness Ghana Breweries', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_bev9, 'BEV009', 'Lucozade Boost 330ml', 'Lucozade energy drink 330ml bottle', 'Beverages', 'Ctn', 24, 55.00, 72.00, 30, 120, sup2_id, 'Guinness Ghana Breweries', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_bev10, 'BEV010', 'Mirinda Fruity 50cl PET', 'Mirinda fruity carbonated drink 50cl PET bottle', 'Beverages', 'Ctn', 12, 30.00, 39.00, 30, 120, sup1_id, 'Accra Brewery Limited', 'Plastic', true, false, 0.50, 0, 'active', comp1_id),

  -- DAIRY
  (prod_dai1, 'DAI001', 'Fan Ice Vanilla 120ml', 'Fan Ice vanilla flavoured frozen dairy dessert 120ml', 'Dairy', 'Pcs', 1, 1.20, 1.80, 200, 1000, sup3_id, 'Fan Milk Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_dai2, 'DAI002', 'Fan Choco 120ml', 'Fan chocolate flavoured frozen dairy dessert 120ml', 'Dairy', 'Pcs', 1, 1.20, 1.80, 200, 1000, sup3_id, 'Fan Milk Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_dai3, 'DAI003', 'Fan Yogo Strawberry 100ml', 'Fan Yogo strawberry flavoured yoghurt drink 100ml', 'Dairy', 'Pcs', 1, 1.50, 2.20, 150, 600, sup3_id, 'Fan Milk Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_dai4, 'DAI004', 'Cowbell Milk Powder 400g', 'Cowbell full cream milk powder 400g tin', 'Dairy', 'Pcs', 1, 28.00, 36.00, 50, 200, sup9_id, 'Promasidor Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_dai5, 'DAI005', 'Peak Milk Evaporated 410g', 'Peak full cream evaporated milk 410g tin', 'Dairy', 'Ctn', 24, 85.00, 108.00, 40, 160, sup14_id, 'Friesland Campina WAMCO', 'None', false, false, 0, 0, 'active', comp1_id),

  -- SNACKS
  (prod_snk1, 'SNK001', 'Pringles Original 165g', 'Pringles original flavour potato crisps 165g', 'Snacks', 'Pcs', 1, 18.00, 24.00, 50, 200, sup4_id, 'Nestlé Ghana Limited', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_snk2, 'SNK002', 'Lays Classic 100g', 'Lays classic salted potato chips 100g', 'Snacks', 'Pcs', 1, 12.00, 16.00, 60, 240, sup4_id, 'Nestlé Ghana Limited', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_snk3, 'SNK003', 'Biscoff Biscuits 250g', 'Lotus Biscoff caramelised biscuits 250g pack', 'Snacks', 'Pcs', 1, 22.00, 29.00, 40, 160, sup4_id, 'Nestlé Ghana Limited', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_snk4, 'SNK004', 'Digestive Biscuits 400g', 'McVities digestive biscuits 400g pack', 'Snacks', 'Pcs', 1, 25.00, 33.00, 40, 160, sup4_id, 'Nestlé Ghana Limited', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_snk5, 'SNK005', 'Nido Fortified 400g', 'Nido fortified milk powder for children 400g', 'Snacks', 'Pcs', 1, 38.00, 49.00, 30, 120, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_snk6, 'SNK006', 'Indomie Instant Noodles 70g', 'Indomie chicken flavour instant noodles 70g', 'Snacks', 'Ctn', 40, 48.00, 64.00, 80, 320, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),

  -- WATER
  (prod_wat1, 'WAT001', 'Voltic Still Water 500ml', 'Voltic natural still water 500ml PET bottle', 'Water', 'Ctn', 24, 14.00, 18.00, 100, 400, sup7_id, 'Voltic Ghana Ltd', 'Plastic', false, false, 0.30, 0, 'active', comp1_id),
  (prod_wat2, 'WAT002', 'Voltic Still Water 1.5L', 'Voltic natural still water 1.5L PET bottle', 'Water', 'Ctn', 12, 18.00, 24.00, 80, 320, sup7_id, 'Voltic Ghana Ltd', 'Plastic', false, false, 0.50, 0, 'active', comp1_id),
  (prod_wat3, 'WAT003', 'Voltic Sparkling Water 500ml', 'Voltic sparkling water 500ml PET bottle', 'Water', 'Ctn', 24, 16.00, 21.00, 60, 240, sup7_id, 'Voltic Ghana Ltd', 'Plastic', false, false, 0.30, 0, 'active', comp1_id),

  -- SPIRITS & BEER
  (prod_spr1, 'SPR001', 'Guinness Stout 60cl Bottle', 'Guinness Foreign Extra Stout 60cl glass bottle', 'Beer & Spirits', 'Ctn', 12, 72.00, 96.00, 60, 240, sup2_id, 'Guinness Ghana Breweries', 'Bottle', true, true, 0, 1.20, 'active', comp1_id),
  (prod_spr2, 'SPR002', 'Star Beer 60cl Bottle', 'Star lager beer 60cl glass bottle', 'Beer & Spirits', 'Ctn', 12, 68.00, 90.00, 60, 240, sup1_id, 'Accra Brewery Limited', 'Bottle', true, true, 0, 1.20, 'active', comp1_id),
  (prod_spr3, 'SPR003', 'Club Beer 33cl Can', 'Club lager beer 33cl aluminium can', 'Beer & Spirits', 'Ctn', 24, 55.00, 72.00, 50, 200, sup1_id, 'Accra Brewery Limited', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_spr4, 'SPR004', 'Kasapreko Alomo Bitters 200ml', 'Kasapreko Alomo Bitters herbal drink 200ml bottle', 'Beer & Spirits', 'Ctn', 24, 38.00, 50.00, 40, 160, sup6_id, 'Kasapreko Company Ltd', 'Bottle', true, true, 0, 0.60, 'active', comp1_id),
  (prod_spr5, 'SPR005', 'Kasapreko Apeteshie 750ml', 'Kasapreko local gin 750ml bottle', 'Beer & Spirits', 'Ctn', 12, 55.00, 72.00, 30, 120, sup6_id, 'Kasapreko Company Ltd', 'Bottle', true, true, 0, 1.00, 'active', comp1_id),
  (prod_spr6, 'SPR006', 'Guinness Stout 33cl Can', 'Guinness Foreign Extra Stout 33cl can', 'Beer & Spirits', 'Ctn', 24, 60.00, 78.00, 40, 160, sup2_id, 'Guinness Ghana Breweries', 'None', true, false, 0, 0, 'active', comp1_id),

  -- HOUSEHOLD
  (prod_hh1, 'HH001', 'Omo Detergent 1kg', 'Omo automatic washing powder 1kg', 'Household', 'Ctn', 12, 42.00, 55.00, 40, 160, sup5_id, 'Unilever Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_hh2, 'HH002', 'Sunlight Dish Liquid 500ml', 'Sunlight dish washing liquid 500ml bottle', 'Household', 'Ctn', 12, 28.00, 36.00, 50, 200, sup5_id, 'Unilever Ghana Ltd', 'Plastic', false, false, 0.50, 0, 'active', comp1_id),
  (prod_hh3, 'HH003', 'Jik Bleach 1L', 'Jik household bleach 1L bottle', 'Household', 'Ctn', 12, 32.00, 42.00, 40, 160, sup5_id, 'Unilever Ghana Ltd', 'Plastic', false, false, 0.50, 0, 'active', comp1_id),
  (prod_hh4, 'HH004', 'Dettol Antiseptic 500ml', 'Dettol antiseptic liquid 500ml bottle', 'Household', 'Ctn', 12, 55.00, 72.00, 30, 120, sup5_id, 'Unilever Ghana Ltd', 'Plastic', false, false, 0.50, 0, 'active', comp1_id),

  -- TOBACCO
  (prod_tob1, 'TOB001', 'Rothmans King Size 20s', 'Rothmans king size cigarettes pack of 20', 'Tobacco', 'Ctn', 10, 28.00, 36.00, 100, 500, sup4_id, 'Nestlé Ghana Limited', 'None', true, false, 0, 0, 'active', comp1_id),
  (prod_tob2, 'TOB002', 'Benson & Hedges 20s', 'Benson & Hedges cigarettes pack of 20', 'Tobacco', 'Ctn', 10, 32.00, 42.00, 80, 400, sup4_id, 'Nestlé Ghana Limited', 'None', true, false, 0, 0, 'active', comp1_id),

  -- CONFECTIONERY
  (prod_con1, 'CON001', 'Kit Kat 4-Finger 45g', 'Kit Kat chocolate wafer bar 4-finger 45g', 'Confectionery', 'Ctn', 24, 22.00, 29.00, 60, 240, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_con2, 'CON002', 'Milo Chocolate Drink 400g', 'Milo chocolate malt drink powder 400g tin', 'Confectionery', 'Ctn', 12, 68.00, 88.00, 40, 160, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_con3, 'CON003', 'Tom Tom Mint Candy 100g', 'Tom Tom mint flavoured hard candy 100g pack', 'Confectionery', 'Pcs', 1, 3.50, 5.00, 100, 500, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),

  -- COOKING
  (prod_ck1, 'CK001', 'Frytol Vegetable Oil 5L', 'Frytol refined vegetable cooking oil 5L bottle', 'Cooking', 'Ctn', 4, 95.00, 125.00, 30, 120, sup5_id, 'Unilever Ghana Ltd', 'Plastic', false, false, 1.00, 0, 'active', comp1_id),
  (prod_ck2, 'CK002', 'Frytol Vegetable Oil 2L', 'Frytol refined vegetable cooking oil 2L bottle', 'Cooking', 'Ctn', 6, 42.00, 55.00, 40, 160, sup5_id, 'Unilever Ghana Ltd', 'Plastic', false, false, 0.80, 0, 'active', comp1_id),
  (prod_ck3, 'CK003', 'Maggi Chicken Cubes 100g', 'Maggi chicken flavour seasoning cubes 100g pack', 'Cooking', 'Ctn', 24, 8.50, 12.00, 80, 320, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),

  -- PERSONAL CARE
  (prod_pc1, 'PC001', 'Dove Body Wash 250ml', 'Dove moisturising body wash 250ml bottle', 'Personal Care', 'Ctn', 12, 38.00, 50.00, 30, 120, sup5_id, 'Unilever Ghana Ltd', 'Plastic', false, false, 0.50, 0, 'active', comp1_id),
  (prod_pc2, 'PC002', 'Rexona Deodorant 150ml', 'Rexona antiperspirant deodorant spray 150ml', 'Personal Care', 'Ctn', 12, 32.00, 42.00, 30, 120, sup5_id, 'Unilever Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_pc3, 'PC003', 'Vaseline Petroleum Jelly 250ml', 'Vaseline original petroleum jelly 250ml jar', 'Personal Care', 'Ctn', 12, 28.00, 36.00, 40, 160, sup5_id, 'Unilever Ghana Ltd', 'None', false, false, 0, 0, 'active', comp1_id),

  -- CEREALS
  (prod_cer1, 'CER001', 'Quaker Oats 1kg', 'Quaker rolled oats 1kg pack', 'Cereals', 'Ctn', 12, 45.00, 58.00, 30, 120, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_cer2, 'CER002', 'Nestlé Corn Flakes 500g', 'Nestlé corn flakes breakfast cereal 500g box', 'Cereals', 'Ctn', 12, 38.00, 49.00, 30, 120, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
  (prod_cer3, 'CER003', 'Tom Brown Porridge Mix 500g', 'Tom Brown roasted corn porridge mix 500g pack', 'Cereals', 'Ctn', 12, 22.00, 29.00, 40, 160, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. CUSTOMERS (25 customers across locations)
-- ============================================================
INSERT INTO public.customers (
  id, customer_code, customer_name, business_name, price_type,
  mobile, email, business_address, call_days, customer_type,
  business_executive, credit_limit, location, status,
  company_id, location_id
) VALUES
  -- Accra / Main Warehouse customers
  (cust1_id, 'C001', 'Kofi Agyeman', 'Agyeman General Store', 'Retail', '+233 24 100 0001', 'kofi.agyeman@gmail.com', 'Madina Market, Accra', 'Mon,Wed,Fri', 'Retailer', 'Kwame Asante', 5000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust2_id, 'C002', 'Abena Mensah', 'Mensah Cold Store', 'Wholesale', '+233 24 100 0002', 'abena.mensah@gmail.com', 'Kaneshie Market, Accra', 'Tue,Thu', 'Wholesaler', 'Ama Serwaa', 15000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust3_id, 'C003', 'Yaw Darko', 'Darko Supermarket', 'Supermarket', '+233 24 100 0003', 'yaw.darko@darkosuper.gh', 'East Legon, Accra', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Kofi Boateng', 50000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust4_id, 'C004', 'Akua Boateng', 'Boateng Provisions', 'Retail', '+233 24 100 0004', NULL, 'Nima, Accra', 'Mon,Wed', 'Retailer', 'Kwame Asante', 3000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust5_id, 'C005', 'Kweku Asante', 'Asante Chop Bar', 'Catering', '+233 24 100 0005', NULL, 'Osu, Accra', 'Tue,Fri', 'Caterer', 'Ama Serwaa', 8000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust6_id, 'C006', 'Efua Owusu', 'Owusu Mini Mart', 'Retail', '+233 24 100 0006', 'efua.owusu@gmail.com', 'Dansoman, Accra', 'Mon,Thu', 'Retailer', 'Abena Owusu', 4000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust7_id, 'C007', 'Nana Ama Frimpong', 'Frimpong Wholesale', 'Wholesale', '+233 24 100 0007', 'nana.frimpong@gmail.com', 'Agbogbloshie, Accra', 'Wed,Fri', 'Wholesaler', 'Yaw Mensah', 20000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust8_id, 'C008', 'Kwame Osei', 'Osei Kiosk', 'Retail', '+233 24 100 0008', NULL, 'Adabraka, Accra', 'Mon,Wed,Fri', 'Retailer', 'Kwame Asante', 2000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust9_id, 'C009', 'Ama Quaye', 'Quaye Beverages', 'Wholesale', '+233 24 100 0009', 'ama.quaye@gmail.com', 'Lapaz, Accra', 'Tue,Thu,Sat', 'Wholesaler', 'Akosua Frimpong', 25000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
  (cust10_id, 'C010', 'Kofi Mensah', 'Mensah Hotel & Bar', 'Hotel', '+233 24 100 0010', 'kofi.mensah@mensahhotel.gh', 'Airport Residential, Accra', 'Mon,Wed,Fri', 'Hotel', 'Emmanuel Darko', 30000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),

  -- Tema Branch customers
  (cust11_id, 'C011', 'Adwoa Asare', 'Asare Provisions', 'Retail', '+233 24 100 0011', NULL, 'Community 5, Tema', 'Mon,Wed,Fri', 'Retailer', 'Patricia Agyemang', 3500, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
  (cust12_id, 'C012', 'Kwabena Acheampong', 'Acheampong Cold Store', 'Wholesale', '+233 24 100 0012', 'kwabena.ach@gmail.com', 'Community 1, Tema', 'Tue,Thu', 'Wholesaler', 'Ama Serwaa', 18000, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
  (cust13_id, 'C013', 'Abena Darko', 'Darko Superstore', 'Supermarket', '+233 24 100 0013', 'abena.darko@gmail.com', 'Tema Manhean', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Kofi Boateng', 45000, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
  (cust14_id, 'C014', 'Emmanuel Tetteh', 'Tetteh Bar & Grill', 'Catering', '+233 24 100 0014', NULL, 'Community 3, Tema', 'Wed,Sat', 'Caterer', 'Abena Owusu', 10000, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
  (cust15_id, 'C015', 'Yaa Asantewaa', 'Asantewaa Kiosk', 'Retail', '+233 24 100 0015', NULL, 'Community 7, Tema', 'Mon,Thu', 'Retailer', 'Patricia Agyemang', 1500, 'Tema Branch', 'Active', comp1_id, loc1_2_id),

  -- Kumasi Branch customers
  (cust16_id, 'C016', 'Kwame Boateng', 'Boateng Wholesale', 'Wholesale', '+233 24 100 0016', 'kwame.boateng@gmail.com', 'Adum, Kumasi', 'Mon,Wed,Fri', 'Wholesaler', 'Yaw Mensah', 22000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
  (cust17_id, 'C017', 'Akosua Mensah', 'Mensah Supermarket', 'Supermarket', '+233 24 100 0017', 'akosua.mensah@gmail.com', 'Kejetia, Kumasi', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Akosua Frimpong', 55000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
  (cust18_id, 'C018', 'Nana Kofi Asante', 'Asante Provisions', 'Retail', '+233 24 100 0018', NULL, 'Bantama, Kumasi', 'Tue,Thu', 'Retailer', 'Emmanuel Darko', 4500, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
  (cust19_id, 'C019', 'Ama Owusu', 'Owusu Cold Store', 'Wholesale', '+233 24 100 0019', 'ama.owusu@gmail.com', 'Suame, Kumasi', 'Mon,Wed', 'Wholesaler', 'Yaw Mensah', 16000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
  (cust20_id, 'C020', 'Kofi Frimpong', 'Frimpong Chop Bar', 'Catering', '+233 24 100 0020', NULL, 'Asafo, Kumasi', 'Fri,Sat', 'Caterer', 'Akosua Frimpong', 6000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),

  -- Ghana Beverages Distribution customers
  (cust21_id, 'C021', 'Yaw Acheampong', 'Acheampong Stores', 'Wholesale', '+233 31 100 0021', 'yaw.ach@gmail.com', 'Market Circle, Takoradi', 'Mon,Wed,Fri', 'Wholesaler', 'Daniel Quaye', 20000, 'Main Depot', 'Active', comp2_id, loc2_1_id),
  (cust22_id, 'C022', 'Abena Quaye', 'Quaye Supermarket', 'Supermarket', '+233 31 100 0022', 'abena.quaye@gmail.com', 'Takoradi', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Josephine Mensah', 40000, 'Main Depot', 'Active', comp2_id, loc2_1_id),

  -- Northern Distribution Services customers
  (cust23_id, 'C023', 'Ibrahim Sulemana', 'Sulemana Wholesale', 'Wholesale', '+233 37 100 0023', NULL, 'Central Market, Tamale', 'Mon,Wed,Fri', 'Wholesaler', 'Ibrahim Alhassan', 15000, 'Tamale Depot', 'Active', comp3_id, loc3_1_id),
  (cust24_id, 'C024', 'Fatima Mohammed', 'Mohammed Provisions', 'Retail', '+233 37 100 0024', NULL, 'Tamale', 'Tue,Thu', 'Retailer', 'Fatima Issah', 3000, 'Tamale Depot', 'Active', comp3_id, loc3_1_id),
  (cust25_id, 'C025', 'Alhassan Yakubu', 'Yakubu Cold Store', 'Wholesale', '+233 37 100 0025', 'alhassan.yakubu@gmail.com', 'Bolgatanga', 'Mon,Thu', 'Wholesaler', 'Fatima Issah', 12000, 'Bolgatanga Branch', 'Active', comp3_id, loc3_2_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. RETURNABLE ITEMS MASTER
-- ============================================================
INSERT INTO public.returnable_items (
  id, item_code, item_name, item_type, deposit_amount, stock_level, unit, description, status
) VALUES
  (ret1_id, 'RI001', 'Standard 35cl Bottle', 'Bottle', 0.80, 5000, 'Pcs', 'Standard 35cl glass bottle used for soft drinks', 'active'),
  (ret2_id, 'RI002', 'Standard 60cl Bottle', 'Bottle', 1.20, 3000, 'Pcs', 'Standard 60cl glass bottle used for beer and stout', 'active'),
  (ret3_id, 'RI003', 'Standard 200ml Bottle', 'Bottle', 0.60, 2000, 'Pcs', 'Standard 200ml glass bottle for bitters and spirits', 'active'),
  (ret4_id, 'RI004', '24-Bottle Crate (35cl)', 'Crate', 12.00, 800, 'Pcs', 'Plastic crate holding 24 standard 35cl bottles', 'active'),
  (ret5_id, 'RI005', '12-Bottle Crate (60cl)', 'Crate', 15.00, 500, 'Pcs', 'Plastic crate holding 12 standard 60cl bottles', 'active'),
  (ret6_id, 'RI006', '20L Keg', 'Keg', 45.00, 200, 'Pcs', 'Stainless steel 20L keg for draught beer', 'active')
ON CONFLICT (item_code) DO NOTHING;

-- ============================================================
-- 9. PURCHASE INVOICES (12 invoices)
-- ============================================================
INSERT INTO public.purchase_invoices (
  id, invoice_no, supplier_id, supplier_name,
  location_id, location_name, invoice_date, delivery_date, due_date,
  pallet_qty, notes, transporter, driver_name, vehicle_no,
  supplier_inv_no, empties_inv_no, po_number,
  subtotal, total_tax_amt, total_pre_tax, total_tax_inc_value,
  total_empties_value, total_breakages_value,
  status, posted_ap, posted_stock, company_id
) VALUES
  (
    pi1_id, 'PI-2026-02-10-001', sup1_id, 'Accra Brewery Limited',
    loc1_1_id, 'Main Warehouse', '2026-02-10', '2026-02-11', '2026-03-12',
    5, 'Regular monthly delivery - soft drinks', 'ABL Transport', 'Kwesi Atta', 'GR-1234-26',
    'ABL-INV-2026-0210', 'ABL-EMP-2026-0210', 'PO-2026-02-001',
    4320.00, 518.40, 4320.00, 4838.40, 192.00, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi2_id, 'PI-2026-02-15-002', sup2_id, 'Guinness Ghana Breweries',
    loc1_1_id, 'Main Warehouse', '2026-02-15', '2026-02-16', '2026-03-17',
    8, 'Beer and malt drinks delivery', 'GGB Logistics', 'Ato Mensah', 'GW-5678-26',
    'GGB-INV-2026-0215', 'GGB-EMP-2026-0215', 'PO-2026-02-002',
    8640.00, 1036.80, 8640.00, 9676.80, 360.00, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi3_id, 'PI-2026-02-18-003', sup3_id, 'Fan Milk Ghana Ltd',
    loc1_1_id, 'Main Warehouse', '2026-02-18', '2026-02-18', '2026-03-04',
    2, 'Dairy products delivery - cold chain', 'Fan Milk Delivery', 'Kojo Asante', 'FM-9012-26',
    'FML-INV-2026-0218', NULL, 'PO-2026-02-003',
    1440.00, 0, 1440.00, 1440.00, 0, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi4_id, 'PI-2026-02-20-004', sup4_id, 'Nestlé Ghana Limited',
    loc1_1_id, 'Main Warehouse', '2026-02-20', '2026-02-21', '2026-04-06',
    10, 'Nestlé products monthly delivery', 'Nestlé Logistics', 'Yaw Boateng', 'NL-3456-26',
    'NES-INV-2026-0220', NULL, 'PO-2026-02-004',
    12480.00, 0, 12480.00, 12480.00, 0, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi5_id, 'PI-2026-02-22-005', sup5_id, 'Unilever Ghana Ltd',
    loc1_1_id, 'Main Warehouse', '2026-02-22', '2026-02-23', '2026-03-24',
    6, 'Household and personal care products', 'Unilever Delivery', 'Kwame Tetteh', 'UL-7890-26',
    'UNI-INV-2026-0222', NULL, 'PO-2026-02-005',
    7200.00, 0, 7200.00, 7200.00, 0, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi6_id, 'PI-2026-02-25-006', sup6_id, 'Kasapreko Company Ltd',
    loc1_1_id, 'Main Warehouse', '2026-02-25', '2026-02-26', '2026-03-18',
    3, 'Spirits and bitters delivery', 'Kasapreko Transport', 'Kofi Darko', 'KP-1234-26',
    'KAS-INV-2026-0225', 'KAS-EMP-2026-0225', 'PO-2026-02-006',
    3600.00, 432.00, 3600.00, 4032.00, 144.00, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi7_id, 'PI-2026-02-28-007', sup7_id, 'Voltic Ghana Ltd',
    loc1_2_id, 'Tema Branch', '2026-02-28', '2026-02-28', '2026-03-30',
    4, 'Water products for Tema branch', 'Voltic Delivery', 'Ama Quaye', 'VL-5678-26',
    'VOL-INV-2026-0228', NULL, 'PO-2026-02-007',
    2880.00, 0, 2880.00, 2880.00, 0, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi8_id, 'PI-2026-03-01-008', sup1_id, 'Accra Brewery Limited',
    loc1_2_id, 'Tema Branch', '2026-03-01', '2026-03-02', '2026-04-01',
    6, 'Soft drinks delivery to Tema branch', 'ABL Transport', 'Kwesi Atta', 'GR-1234-26',
    'ABL-INV-2026-0301', 'ABL-EMP-2026-0301', 'PO-2026-03-001',
    5760.00, 691.20, 5760.00, 6451.20, 240.00, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi9_id, 'PI-2026-03-01-009', sup2_id, 'Guinness Ghana Breweries',
    loc1_3_id, 'Kumasi Branch', '2026-03-01', '2026-03-03', '2026-04-01',
    7, 'Beer delivery to Kumasi branch', 'GGB Logistics', 'Ato Mensah', 'GW-5678-26',
    'GGB-INV-2026-0301', 'GGB-EMP-2026-0301', 'PO-2026-03-002',
    7200.00, 864.00, 7200.00, 8064.00, 300.00, 0,
    'posted', true, true, comp1_id
  ),
  (
    pi10_id, 'PI-2026-03-02-010', sup4_id, 'Nestlé Ghana Limited',
    loc1_1_id, 'Main Warehouse', '2026-03-02', '2026-03-03', '2026-04-17',
    12, 'Nestlé products second delivery March', 'Nestlé Logistics', 'Yaw Boateng', 'NL-3456-26',
    'NES-INV-2026-0302', NULL, 'PO-2026-03-003',
    9600.00, 0, 9600.00, 9600.00, 0, 0,
    'draft', false, false, comp1_id
  ),
  (
    pi11_id, 'PI-2026-03-02-011', sup5_id, 'Unilever Ghana Ltd',
    loc1_3_id, 'Kumasi Branch', '2026-03-02', '2026-03-04', '2026-04-02',
    5, 'Household products for Kumasi branch', 'Unilever Delivery', 'Kwame Tetteh', 'UL-7890-26',
    'UNI-INV-2026-0302', NULL, 'PO-2026-03-004',
    4800.00, 0, 4800.00, 4800.00, 0, 0,
    'draft', false, false, comp1_id
  ),
  (
    pi12_id, 'PI-2026-03-03-012', sup3_id, 'Fan Milk Ghana Ltd',
    loc1_1_id, 'Main Warehouse', '2026-03-03', '2026-03-03', '2026-03-17',
    1, 'Fan Milk daily delivery', 'Fan Milk Delivery', 'Kojo Asante', 'FM-9012-26',
    'FML-INV-2026-0303', NULL, 'PO-2026-03-005',
    720.00, 0, 720.00, 720.00, 0, 0,
    'draft', false, false, comp1_id
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. PURCHASE INVOICE ITEMS
-- ============================================================
-- PI1: ABL Soft Drinks - Main Warehouse
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi1_id, 'BEV001', 'Coca-Cola 35cl Bottle', 24, 2400, 100, 0, 0, 28.50, 2850.00, 342.00, 31.92, 3192.00, 80.00, prod_bev1, 1),
  (pi1_id, 'BEV003', 'Fanta Orange 35cl Bottle', 24, 720, 30, 0, 0, 28.50, 855.00, 102.60, 31.92, 957.60, 24.00, prod_bev3, 2),
  (pi1_id, 'BEV004', 'Sprite 35cl Bottle', 24, 480, 20, 0, 0, 28.50, 570.00, 68.40, 31.92, 638.40, 16.00, prod_bev4, 3),
  (pi1_id, 'BEV005', 'Pepsi 35cl Bottle', 24, 240, 10, 0, 0, 27.00, 270.00, 32.40, 30.24, 302.40, 8.00, prod_bev5, 4),
  (pi1_id, 'BEV006', '7UP 35cl Bottle', 24, 240, 10, 0, 0, 27.00, 270.00, 32.40, 30.24, 302.40, 8.00, prod_bev6, 5),
  (pi1_id, 'BEV002', 'Coca-Cola 50cl PET', 12, 120, 10, 0, 0, 32.00, 320.00, 38.40, 35.84, 358.40, 5.00, prod_bev2, 6);

-- PI2: GGB Beer & Malt - Main Warehouse
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi2_id, 'SPR001', 'Guinness Stout 60cl Bottle', 12, 1440, 120, 0, 0, 72.00, 8640.00, 1036.80, 80.64, 9676.80, 172.80, prod_spr1, 1),
  (pi2_id, 'BEV007', 'Malta Guinness 33cl Can', 24, 960, 40, 0, 0, 45.00, 1800.00, 216.00, 50.40, 2016.00, 0, prod_bev7, 2),
  (pi2_id, 'BEV008', 'Alvaro Pineapple 33cl', 24, 480, 20, 0, 0, 42.00, 840.00, 100.80, 47.04, 940.80, 0, prod_bev8, 3),
  (pi2_id, 'BEV009', 'Lucozade Boost 330ml', 24, 240, 10, 0, 0, 55.00, 550.00, 66.00, 61.60, 616.00, 0, prod_bev9, 4);

-- PI3: Fan Milk Dairy - Main Warehouse
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi3_id, 'DAI001', 'Fan Ice Vanilla 120ml', 1, 600, 600, 0, 0, 1.20, 720.00, 0, 1.20, 720.00, 0, prod_dai1, 1),
  (pi3_id, 'DAI002', 'Fan Choco 120ml', 1, 600, 600, 0, 0, 1.20, 720.00, 0, 1.20, 720.00, 0, prod_dai2, 2);

-- PI4: Nestlé Products - Main Warehouse
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi4_id, 'SNK001', 'Pringles Original 165g', 1, 200, 200, 0, 0, 18.00, 3600.00, 0, 18.00, 3600.00, 0, prod_snk1, 1),
  (pi4_id, 'SNK002', 'Lays Classic 100g', 1, 240, 240, 0, 0, 12.00, 2880.00, 0, 12.00, 2880.00, 0, prod_snk2, 2),
  (pi4_id, 'CON001', 'Kit Kat 4-Finger 45g', 24, 480, 20, 0, 0, 22.00, 440.00, 0, 22.00, 440.00, 0, prod_con1, 3),
  (pi4_id, 'CON002', 'Milo Chocolate Drink 400g', 12, 240, 20, 0, 0, 68.00, 1360.00, 0, 68.00, 1360.00, 0, prod_con2, 4),
  (pi4_id, 'SNK006', 'Indomie Instant Noodles 70g', 40, 1600, 40, 0, 0, 48.00, 1920.00, 0, 48.00, 1920.00, 0, prod_snk6, 5),
  (pi4_id, 'CK003', 'Maggi Chicken Cubes 100g', 24, 480, 20, 0, 0, 8.50, 170.00, 0, 8.50, 170.00, 0, prod_ck3, 6),
  (pi4_id, 'CER001', 'Quaker Oats 1kg', 12, 120, 10, 0, 0, 45.00, 450.00, 0, 45.00, 450.00, 0, prod_cer1, 7),
  (pi4_id, 'CER002', 'Nestlé Corn Flakes 500g', 12, 120, 10, 0, 0, 38.00, 380.00, 0, 38.00, 380.00, 0, prod_cer2, 8),
  (pi4_id, 'TOB001', 'Rothmans King Size 20s', 10, 500, 50, 0, 0, 28.00, 1400.00, 0, 28.00, 1400.00, 0, prod_tob1, 9);

-- PI5: Unilever Household - Main Warehouse
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi5_id, 'HH001', 'Omo Detergent 1kg', 12, 240, 20, 0, 0, 42.00, 840.00, 0, 42.00, 840.00, 0, prod_hh1, 1),
  (pi5_id, 'HH002', 'Sunlight Dish Liquid 500ml', 12, 240, 20, 0, 0, 28.00, 560.00, 0, 28.00, 560.00, 0, prod_hh2, 2),
  (pi5_id, 'HH003', 'Jik Bleach 1L', 12, 240, 20, 0, 0, 32.00, 640.00, 0, 32.00, 640.00, 0, prod_hh3, 3),
  (pi5_id, 'HH004', 'Dettol Antiseptic 500ml', 12, 120, 10, 0, 0, 55.00, 550.00, 0, 55.00, 550.00, 0, prod_hh4, 4),
  (pi5_id, 'PC001', 'Dove Body Wash 250ml', 12, 120, 10, 0, 0, 38.00, 380.00, 0, 38.00, 380.00, 0, prod_pc1, 5),
  (pi5_id, 'PC002', 'Rexona Deodorant 150ml', 12, 120, 10, 0, 0, 32.00, 320.00, 0, 32.00, 320.00, 0, prod_pc2, 6),
  (pi5_id, 'CK001', 'Frytol Vegetable Oil 5L', 4, 80, 20, 0, 0, 95.00, 1900.00, 0, 95.00, 1900.00, 0, prod_ck1, 7),
  (pi5_id, 'CK002', 'Frytol Vegetable Oil 2L', 6, 120, 20, 0, 0, 42.00, 840.00, 0, 42.00, 840.00, 0, prod_ck2, 8),
  (pi5_id, 'PC003', 'Vaseline Petroleum Jelly 250ml', 12, 120, 10, 0, 0, 28.00, 280.00, 0, 28.00, 280.00, 0, prod_pc3, 9);

-- PI6: Kasapreko Spirits - Main Warehouse
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi6_id, 'SPR004', 'Kasapreko Alomo Bitters 200ml', 24, 1440, 60, 0, 0, 38.00, 2280.00, 273.60, 42.56, 2553.60, 86.40, prod_spr4, 1),
  (pi6_id, 'SPR005', 'Kasapreko Apeteshie 750ml', 12, 360, 30, 0, 0, 55.00, 1650.00, 198.00, 61.60, 1848.00, 36.00, prod_spr5, 2);

-- PI7: Voltic Water - Tema Branch
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi7_id, 'WAT001', 'Voltic Still Water 500ml', 24, 2400, 100, 0, 0, 14.00, 1400.00, 0, 14.00, 1400.00, 0, prod_wat1, 1),
  (pi7_id, 'WAT002', 'Voltic Still Water 1.5L', 12, 960, 80, 0, 0, 18.00, 1440.00, 0, 18.00, 1440.00, 0, prod_wat2, 2),
  (pi7_id, 'WAT003', 'Voltic Sparkling Water 500ml', 24, 240, 10, 0, 0, 16.00, 160.00, 0, 16.00, 160.00, 0, prod_wat3, 3);

-- PI8: ABL Soft Drinks - Tema Branch
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi8_id, 'BEV001', 'Coca-Cola 35cl Bottle', 24, 3600, 150, 0, 0, 28.50, 4275.00, 513.00, 31.92, 4788.00, 120.00, prod_bev1, 1),
  (pi8_id, 'BEV003', 'Fanta Orange 35cl Bottle', 24, 960, 40, 0, 0, 28.50, 1140.00, 136.80, 31.92, 1276.80, 32.00, prod_bev3, 2),
  (pi8_id, 'SPR002', 'Star Beer 60cl Bottle', 12, 480, 40, 0, 0, 68.00, 2720.00, 326.40, 76.16, 3046.40, 57.60, prod_spr2, 3),
  (pi8_id, 'SPR003', 'Club Beer 33cl Can', 24, 480, 20, 0, 0, 55.00, 1100.00, 132.00, 61.60, 1232.00, 0, prod_spr3, 4);

-- PI9: GGB Beer - Kumasi Branch
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi9_id, 'SPR001', 'Guinness Stout 60cl Bottle', 12, 1200, 100, 0, 0, 72.00, 7200.00, 864.00, 80.64, 8064.00, 144.00, prod_spr1, 1),
  (pi9_id, 'SPR006', 'Guinness Stout 33cl Can', 24, 480, 20, 0, 0, 60.00, 1200.00, 144.00, 67.20, 1344.00, 0, prod_spr6, 2),
  (pi9_id, 'BEV007', 'Malta Guinness 33cl Can', 24, 480, 20, 0, 0, 45.00, 900.00, 108.00, 50.40, 1008.00, 0, prod_bev7, 3);

-- PI10: Nestlé - Main Warehouse (draft)
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi10_id, 'SNK005', 'Nido Fortified 400g', 1, 300, 300, 0, 0, 38.00, 11400.00, 0, 38.00, 11400.00, 0, prod_snk5, 1),
  (pi10_id, 'CON002', 'Milo Chocolate Drink 400g', 12, 240, 20, 0, 0, 68.00, 1360.00, 0, 68.00, 1360.00, 0, prod_con2, 2),
  (pi10_id, 'CER003', 'Tom Brown Porridge Mix 500g', 12, 120, 10, 0, 0, 22.00, 220.00, 0, 22.00, 220.00, 0, prod_cer3, 3);

-- PI11: Unilever - Kumasi Branch (draft)
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi11_id, 'HH001', 'Omo Detergent 1kg', 12, 120, 10, 0, 0, 42.00, 420.00, 0, 42.00, 420.00, 0, prod_hh1, 1),
  (pi11_id, 'CK001', 'Frytol Vegetable Oil 5L', 4, 80, 20, 0, 0, 95.00, 1900.00, 0, 95.00, 1900.00, 0, prod_ck1, 2),
  (pi11_id, 'CK002', 'Frytol Vegetable Oil 2L', 6, 120, 20, 0, 0, 42.00, 840.00, 0, 42.00, 840.00, 0, prod_ck2, 3),
  (pi11_id, 'HH004', 'Dettol Antiseptic 500ml', 12, 120, 10, 0, 0, 55.00, 550.00, 0, 55.00, 550.00, 0, prod_hh4, 4),
  (pi11_id, 'PC001', 'Dove Body Wash 250ml', 12, 60, 5, 0, 0, 38.00, 190.00, 0, 38.00, 190.00, 0, prod_pc1, 5);

-- PI12: Fan Milk - Main Warehouse (draft)
INSERT INTO public.purchase_invoice_items (
  purchase_invoice_id, item_code, item_name, pack_unit, btl_qty, ctn_qty,
  breakages_btl, breakages_value, price_ex_tax, pre_tax, tax_amt,
  price_tax_inc, tax_inc_value, empties_value, product_id, sort_order
) VALUES
  (pi12_id, 'DAI001', 'Fan Ice Vanilla 120ml', 1, 300, 300, 0, 0, 1.20, 360.00, 0, 1.20, 360.00, 0, prod_dai1, 1),
  (pi12_id, 'DAI003', 'Fan Yogo Strawberry 100ml', 1, 300, 300, 0, 0, 1.50, 450.00, 0, 1.50, 450.00, 0, prod_dai3, 2);

-- ============================================================
-- 11. RETURNABLE GLASS TRANSACTIONS
-- ============================================================
INSERT INTO public.returnable_transactions (
  customer_id, customer_name, item_id, item_name, item_type,
  quantity_given, quantity_returned, balance, deposit_amount,
  transaction_date, notes, status
) VALUES
  -- Kofi Agyeman - Agyeman General Store
  (cust1_id, 'Kofi Agyeman - Agyeman General Store', ret1_id, 'Standard 35cl Bottle', 'Bottle', 240, 200, 40, 0.80, '2026-02-10', 'Bottles given with Coca-Cola delivery', 'partial_return'),
  (cust1_id, 'Kofi Agyeman - Agyeman General Store', ret4_id, '24-Bottle Crate (35cl)', 'Crate', 10, 8, 2, 12.00, '2026-02-10', 'Crates given with delivery', 'partial_return'),

  -- Abena Mensah - Mensah Cold Store
  (cust2_id, 'Abena Mensah - Mensah Cold Store', ret1_id, 'Standard 35cl Bottle', 'Bottle', 480, 480, 0, 0.80, '2026-02-15', 'Bottles fully returned', 'fully_returned'),
  (cust2_id, 'Abena Mensah - Mensah Cold Store', ret2_id, 'Standard 60cl Bottle', 'Bottle', 120, 60, 60, 1.20, '2026-02-15', 'Beer bottles partially returned', 'partial_return'),

  -- Yaw Darko - Darko Supermarket
  (cust3_id, 'Yaw Darko - Darko Supermarket', ret1_id, 'Standard 35cl Bottle', 'Bottle', 960, 720, 240, 0.80, '2026-02-20', 'Large supermarket delivery bottles', 'partial_return'),
  (cust3_id, 'Yaw Darko - Darko Supermarket', ret2_id, 'Standard 60cl Bottle', 'Bottle', 240, 120, 120, 1.20, '2026-02-20', 'Beer bottles outstanding', 'partial_return'),
  (cust3_id, 'Yaw Darko - Darko Supermarket', ret4_id, '24-Bottle Crate (35cl)', 'Crate', 40, 30, 10, 12.00, '2026-02-20', 'Crates outstanding', 'partial_return'),
  (cust3_id, 'Yaw Darko - Darko Supermarket', ret5_id, '12-Bottle Crate (60cl)', 'Crate', 20, 10, 10, 15.00, '2026-02-20', 'Beer crates outstanding', 'partial_return'),

  -- Ama Quaye - Quaye Beverages
  (cust9_id, 'Ama Quaye - Quaye Beverages', ret1_id, 'Standard 35cl Bottle', 'Bottle', 720, 0, 720, 0.80, '2026-02-22', 'New delivery - no returns yet', 'outstanding'),
  (cust9_id, 'Ama Quaye - Quaye Beverages', ret4_id, '24-Bottle Crate (35cl)', 'Crate', 30, 0, 30, 12.00, '2026-02-22', 'Crates outstanding', 'outstanding'),

  -- Kofi Mensah - Mensah Hotel & Bar
  (cust10_id, 'Kofi Mensah - Mensah Hotel & Bar', ret2_id, 'Standard 60cl Bottle', 'Bottle', 360, 300, 60, 1.20, '2026-02-25', 'Hotel bar bottles', 'partial_return'),
  (cust10_id, 'Kofi Mensah - Mensah Hotel & Bar', ret5_id, '12-Bottle Crate (60cl)', 'Crate', 30, 25, 5, 15.00, '2026-02-25', 'Beer crates partially returned', 'partial_return'),
  (cust10_id, 'Kofi Mensah - Mensah Hotel & Bar', ret6_id, '20L Keg', 'Keg', 5, 3, 2, 45.00, '2026-02-25', 'Draught beer kegs outstanding', 'partial_return'),

  -- Kwabena Acheampong - Acheampong Cold Store (Tema)
  (cust12_id, 'Kwabena Acheampong - Acheampong Cold Store', ret1_id, 'Standard 35cl Bottle', 'Bottle', 480, 480, 0, 0.80, '2026-03-01', 'Bottles fully returned', 'fully_returned'),
  (cust12_id, 'Kwabena Acheampong - Acheampong Cold Store', ret2_id, 'Standard 60cl Bottle', 'Bottle', 240, 180, 60, 1.20, '2026-03-01', 'Beer bottles partially returned', 'partial_return'),

  -- Kwame Boateng - Boateng Wholesale (Kumasi)
  (cust16_id, 'Kwame Boateng - Boateng Wholesale', ret1_id, 'Standard 35cl Bottle', 'Bottle', 600, 400, 200, 0.80, '2026-03-01', 'Kumasi wholesale delivery', 'partial_return'),
  (cust16_id, 'Kwame Boateng - Boateng Wholesale', ret4_id, '24-Bottle Crate (35cl)', 'Crate', 25, 15, 10, 12.00, '2026-03-01', 'Crates outstanding', 'partial_return'),

  -- Kasapreko bitters bottles
  (cust5_id, 'Kweku Asante - Asante Chop Bar', ret3_id, 'Standard 200ml Bottle', 'Bottle', 240, 120, 120, 0.60, '2026-02-25', 'Bitters bottles outstanding', 'partial_return');

-- ============================================================
-- 12. STOCK MOVEMENTS
-- ============================================================
INSERT INTO public.stock_movements (
  movement_date, product_id, product_code, product_name,
  location, transaction_type, quantity, unit_cost,
  reference_no, reason, created_by
) VALUES
  -- Receipts from purchase invoices
  ('2026-02-11', prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Main Warehouse', 'receipt', 2400, 28.50, 'PI-2026-02-10-001', 'Purchase Invoice PI-2026-02-10-001', 'System'),
  ('2026-02-11', prod_bev3, 'BEV003', 'Fanta Orange 35cl Bottle', 'Main Warehouse', 'receipt', 720, 28.50, 'PI-2026-02-10-001', 'Purchase Invoice PI-2026-02-10-001', 'System'),
  ('2026-02-11', prod_bev4, 'BEV004', 'Sprite 35cl Bottle', 'Main Warehouse', 'receipt', 480, 28.50, 'PI-2026-02-10-001', 'Purchase Invoice PI-2026-02-10-001', 'System'),
  ('2026-02-11', prod_bev5, 'BEV005', 'Pepsi 35cl Bottle', 'Main Warehouse', 'receipt', 240, 27.00, 'PI-2026-02-10-001', 'Purchase Invoice PI-2026-02-10-001', 'System'),
  ('2026-02-16', prod_spr1, 'SPR001', 'Guinness Stout 60cl Bottle', 'Main Warehouse', 'receipt', 1440, 72.00, 'PI-2026-02-15-002', 'Purchase Invoice PI-2026-02-15-002', 'System'),
  ('2026-02-16', prod_bev7, 'BEV007', 'Malta Guinness 33cl Can', 'Main Warehouse', 'receipt', 960, 45.00, 'PI-2026-02-15-002', 'Purchase Invoice PI-2026-02-15-002', 'System'),
  ('2026-02-18', prod_dai1, 'DAI001', 'Fan Ice Vanilla 120ml', 'Main Warehouse', 'receipt', 600, 1.20, 'PI-2026-02-18-003', 'Purchase Invoice PI-2026-02-18-003', 'System'),
  ('2026-02-18', prod_dai2, 'DAI002', 'Fan Choco 120ml', 'Main Warehouse', 'receipt', 600, 1.20, 'PI-2026-02-18-003', 'Purchase Invoice PI-2026-02-18-003', 'System'),
  ('2026-02-21', prod_snk1, 'SNK001', 'Pringles Original 165g', 'Main Warehouse', 'receipt', 200, 18.00, 'PI-2026-02-20-004', 'Purchase Invoice PI-2026-02-20-004', 'System'),
  ('2026-02-21', prod_snk2, 'SNK002', 'Lays Classic 100g', 'Main Warehouse', 'receipt', 240, 12.00, 'PI-2026-02-20-004', 'Purchase Invoice PI-2026-02-20-004', 'System'),
  ('2026-02-21', prod_con2, 'CON002', 'Milo Chocolate Drink 400g', 'Main Warehouse', 'receipt', 240, 68.00, 'PI-2026-02-20-004', 'Purchase Invoice PI-2026-02-20-004', 'System'),
  ('2026-02-23', prod_hh1, 'HH001', 'Omo Detergent 1kg', 'Main Warehouse', 'receipt', 240, 42.00, 'PI-2026-02-22-005', 'Purchase Invoice PI-2026-02-22-005', 'System'),
  ('2026-02-23', prod_ck1, 'CK001', 'Frytol Vegetable Oil 5L', 'Main Warehouse', 'receipt', 80, 95.00, 'PI-2026-02-22-005', 'Purchase Invoice PI-2026-02-22-005', 'System'),
  ('2026-02-26', prod_spr4, 'SPR004', 'Kasapreko Alomo Bitters 200ml', 'Main Warehouse', 'receipt', 1440, 38.00, 'PI-2026-02-25-006', 'Purchase Invoice PI-2026-02-25-006', 'System'),
  ('2026-02-26', prod_spr5, 'SPR005', 'Kasapreko Apeteshie 750ml', 'Main Warehouse', 'receipt', 360, 55.00, 'PI-2026-02-25-006', 'Purchase Invoice PI-2026-02-25-006', 'System'),
  ('2026-02-28', prod_wat1, 'WAT001', 'Voltic Still Water 500ml', 'Tema Branch', 'receipt', 2400, 14.00, 'PI-2026-02-28-007', 'Purchase Invoice PI-2026-02-28-007', 'System'),
  ('2026-02-28', prod_wat2, 'WAT002', 'Voltic Still Water 1.5L', 'Tema Branch', 'receipt', 960, 18.00, 'PI-2026-02-28-007', 'Purchase Invoice PI-2026-02-28-007', 'System'),
  ('2026-03-02', prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Tema Branch', 'receipt', 3600, 28.50, 'PI-2026-03-01-008', 'Purchase Invoice PI-2026-03-01-008', 'System'),
  ('2026-03-02', prod_spr2, 'SPR002', 'Star Beer 60cl Bottle', 'Tema Branch', 'receipt', 480, 68.00, 'PI-2026-03-01-008', 'Purchase Invoice PI-2026-03-01-008', 'System'),
  ('2026-03-03', prod_spr1, 'SPR001', 'Guinness Stout 60cl Bottle', 'Kumasi Branch', 'receipt', 1200, 72.00, 'PI-2026-03-01-009', 'Purchase Invoice PI-2026-03-01-009', 'System'),
  -- Issues (sales)
  ('2026-02-12', prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Main Warehouse', 'issue', -480, 28.50, 'SI-2026-02-12-001', 'Sales to Kofi Agyeman', 'Kwame Asante'),
  ('2026-02-13', prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Main Warehouse', 'issue', -960, 28.50, 'SI-2026-02-13-002', 'Sales to Abena Mensah', 'Ama Serwaa'),
  ('2026-02-14', prod_spr1, 'SPR001', 'Guinness Stout 60cl Bottle', 'Main Warehouse', 'issue', -240, 72.00, 'SI-2026-02-14-003', 'Sales to Kofi Mensah Hotel', 'Emmanuel Darko'),
  ('2026-02-17', prod_bev7, 'BEV007', 'Malta Guinness 33cl Can', 'Main Warehouse', 'issue', -240, 45.00, 'SI-2026-02-17-004', 'Sales to Yaw Darko Supermarket', 'Kofi Boateng'),
  ('2026-02-19', prod_dai1, 'DAI001', 'Fan Ice Vanilla 120ml', 'Main Warehouse', 'issue', -200, 1.20, 'SI-2026-02-19-005', 'Sales to Kweku Asante', 'Ama Serwaa'),
  ('2026-02-22', prod_snk1, 'SNK001', 'Pringles Original 165g', 'Main Warehouse', 'issue', -80, 18.00, 'SI-2026-02-22-006', 'Sales to Darko Supermarket', 'Kofi Boateng'),
  ('2026-02-24', prod_hh1, 'HH001', 'Omo Detergent 1kg', 'Main Warehouse', 'issue', -60, 42.00, 'SI-2026-02-24-007', 'Sales to Nana Ama Frimpong', 'Yaw Mensah'),
  ('2026-02-27', prod_spr4, 'SPR004', 'Kasapreko Alomo Bitters 200ml', 'Main Warehouse', 'issue', -480, 38.00, 'SI-2026-02-27-008', 'Sales to Kweku Asante Chop Bar', 'Ama Serwaa'),
  -- Transfers
  ('2026-02-20', prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Main Warehouse', 'transfer', -480, 28.50, 'TR-2026-02-20-001', 'Transfer to Tema Branch', 'Kwame Asante'),
  ('2026-02-20', prod_bev1, 'BEV001', 'Coca-Cola 35cl Bottle', 'Tema Branch', 'transfer', 480, 28.50, 'TR-2026-02-20-001', 'Transfer from Main Warehouse', 'Kwame Asante'),
  ('2026-02-21', prod_bev3, 'BEV003', 'Fanta Orange 35cl Bottle', 'Main Warehouse', 'transfer', -240, 28.50, 'TR-2026-02-21-002', 'Transfer to Kumasi Branch', 'Kwame Asante'),
  ('2026-02-21', prod_bev3, 'BEV003', 'Fanta Orange 35cl Bottle', 'Kumasi Branch', 'transfer', 240, 28.50, 'TR-2026-02-21-002', 'Transfer from Main Warehouse', 'Kwame Asante'),
  -- Adjustments
  ('2026-02-28', prod_dai1, 'DAI001', 'Fan Ice Vanilla 120ml', 'Main Warehouse', 'adjustment', -15, 1.20, 'ADJ-2026-02-28-001', 'Stock count adjustment - expired items', 'Kwame Asante'),
  ('2026-02-28', prod_bev7, 'BEV007', 'Malta Guinness 33cl Can', 'Main Warehouse', 'adjustment', -8, 45.00, 'ADJ-2026-02-28-002', 'Damaged cans adjustment', 'Kwame Asante'),
  ('2026-03-01', prod_snk2, 'SNK002', 'Lays Classic 100g', 'Main Warehouse', 'adjustment', 12, 12.00, 'ADJ-2026-03-01-003', 'Stock count - found extra units', 'Ama Serwaa');

-- ============================================================
-- 13. STOCK LEVELS BY LOCATION
-- ============================================================
INSERT INTO public.stock_levels_by_location (
  product_id, location_id, stock_on_hand, reorder_level, max_stock_level,
  last_movement_date, company_id
) VALUES
  -- Main Warehouse stock levels
  (prod_bev1, loc1_1_id, 480, 50, 5000, '2026-03-02', comp1_id),
  (prod_bev2, loc1_1_id, 120, 40, 1000, '2026-02-11', comp1_id),
  (prod_bev3, loc1_1_id, 240, 50, 3000, '2026-02-21', comp1_id),
  (prod_bev4, loc1_1_id, 480, 40, 2000, '2026-02-11', comp1_id),
  (prod_bev5, loc1_1_id, 240, 40, 2000, '2026-02-11', comp1_id),
  (prod_bev6, loc1_1_id, 240, 30, 1500, '2026-02-11', comp1_id),
  (prod_bev7, loc1_1_id, 712, 60, 3000, '2026-02-28', comp1_id),
  (prod_bev8, loc1_1_id, 480, 40, 2000, '2026-02-16', comp1_id),
  (prod_bev9, loc1_1_id, 240, 30, 1500, '2026-02-16', comp1_id),
  (prod_bev10, loc1_1_id, 120, 30, 1000, '2026-02-11', comp1_id),
  (prod_dai1, loc1_1_id, 385, 200, 2000, '2026-02-28', comp1_id),
  (prod_dai2, loc1_1_id, 600, 200, 2000, '2026-02-18', comp1_id),
  (prod_dai3, loc1_1_id, 150, 150, 1500, '2026-02-18', comp1_id),
  (prod_snk1, loc1_1_id, 120, 50, 1000, '2026-02-22', comp1_id),
  (prod_snk2, loc1_1_id, 172, 60, 1500, '2026-03-01', comp1_id),
  (prod_snk3, loc1_1_id, 80, 40, 800, '2026-02-21', comp1_id),
  (prod_snk4, loc1_1_id, 60, 40, 800, '2026-02-21', comp1_id),
  (prod_snk5, loc1_1_id, 100, 30, 600, '2026-02-21', comp1_id),
  (prod_snk6, loc1_1_id, 1600, 80, 5000, '2026-02-21', comp1_id),
  (prod_wat1, loc1_1_id, 1200, 100, 5000, '2026-02-23', comp1_id),
  (prod_wat2, loc1_1_id, 480, 80, 2000, '2026-02-23', comp1_id),
  (prod_wat3, loc1_1_id, 240, 60, 1500, '2026-02-23', comp1_id),
  (prod_spr1, loc1_1_id, 1200, 60, 3000, '2026-02-14', comp1_id),
  (prod_spr2, loc1_1_id, 480, 60, 2000, '2026-02-16', comp1_id),
  (prod_spr3, loc1_1_id, 480, 50, 2000, '2026-02-16', comp1_id),
  (prod_spr4, loc1_1_id, 960, 40, 3000, '2026-02-27', comp1_id),
  (prod_spr5, loc1_1_id, 360, 30, 1500, '2026-02-26', comp1_id),
  (prod_spr6, loc1_1_id, 480, 40, 2000, '2026-02-16', comp1_id),
  (prod_hh1, loc1_1_id, 180, 40, 1000, '2026-02-24', comp1_id),
  (prod_hh2, loc1_1_id, 240, 50, 1000, '2026-02-23', comp1_id),
  (prod_hh3, loc1_1_id, 240, 40, 1000, '2026-02-23', comp1_id),
  (prod_hh4, loc1_1_id, 120, 30, 600, '2026-02-23', comp1_id),
  (prod_tob1, loc1_1_id, 500, 100, 2000, '2026-02-21', comp1_id),
  (prod_tob2, loc1_1_id, 200, 80, 1500, '2026-02-21', comp1_id),
  (prod_con1, loc1_1_id, 480, 60, 2000, '2026-02-21', comp1_id),
  (prod_con2, loc1_1_id, 360, 40, 1500, '2026-02-21', comp1_id),
  (prod_con3, loc1_1_id, 500, 100, 3000, '2026-02-21', comp1_id),
  (prod_ck1, loc1_1_id, 60, 30, 400, '2026-02-24', comp1_id),
  (prod_ck2, loc1_1_id, 120, 40, 600, '2026-02-23', comp1_id),
  (prod_ck3, loc1_1_id, 480, 80, 2000, '2026-02-21', comp1_id),
  (prod_pc1, loc1_1_id, 120, 30, 600, '2026-02-23', comp1_id),
  (prod_pc2, loc1_1_id, 120, 30, 600, '2026-02-23', comp1_id),
  (prod_pc3, loc1_1_id, 120, 40, 800, '2026-02-23', comp1_id),
  (prod_cer1, loc1_1_id, 120, 30, 600, '2026-02-21', comp1_id),
  (prod_cer2, loc1_1_id, 120, 30, 600, '2026-02-21', comp1_id),
  (prod_cer3, loc1_1_id, 120, 40, 800, '2026-02-21', comp1_id),

  -- Tema Branch stock levels
  (prod_bev1, loc1_2_id, 4080, 50, 5000, '2026-03-02', comp1_id),
  (prod_bev3, loc1_2_id, 480, 50, 2000, '2026-02-20', comp1_id),
  (prod_spr2, loc1_2_id, 480, 60, 2000, '2026-03-02', comp1_id),
  (prod_spr3, loc1_2_id, 480, 50, 2000, '2026-03-02', comp1_id),
  (prod_wat1, loc1_2_id, 2400, 100, 5000, '2026-02-28', comp1_id),
  (prod_wat2, loc1_2_id, 960, 80, 3000, '2026-02-28', comp1_id),
  (prod_wat3, loc1_2_id, 240, 60, 1500, '2026-02-28', comp1_id),
  (prod_hh1, loc1_2_id, 120, 40, 800, '2026-03-02', comp1_id),
  (prod_ck1, loc1_2_id, 80, 30, 400, '2026-03-02', comp1_id),

  -- Kumasi Branch stock levels
  (prod_bev3, loc1_3_id, 240, 50, 2000, '2026-02-21', comp1_id),
  (prod_spr1, loc1_3_id, 1200, 60, 3000, '2026-03-03', comp1_id),
  (prod_spr6, loc1_3_id, 480, 40, 2000, '2026-03-03', comp1_id),
  (prod_bev7, loc1_3_id, 480, 60, 2000, '2026-03-03', comp1_id),
  (prod_hh1, loc1_3_id, 120, 40, 800, '2026-03-04', comp1_id),
  (prod_ck1, loc1_3_id, 80, 30, 400, '2026-03-04', comp1_id),
  (prod_ck2, loc1_3_id, 120, 40, 600, '2026-03-04', comp1_id),
  (prod_hh4, loc1_3_id, 120, 30, 600, '2026-03-04', comp1_id)
ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
