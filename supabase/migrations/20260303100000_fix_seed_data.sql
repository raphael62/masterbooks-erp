-- ============================================================
-- FIX SEED DATA - Uses dynamic company/location IDs
-- Resolves foreign key mismatch from previous seed attempt
-- ============================================================

DO $$
DECLARE
  -- Dynamically fetch existing company IDs
  comp1_id UUID;
  comp2_id UUID;
  comp3_id UUID;

  -- Dynamically fetch existing location IDs
  loc1_1_id UUID; -- Main Warehouse
  loc1_2_id UUID; -- Tema Branch
  loc1_3_id UUID; -- Kumasi Branch

  -- Supplier IDs (fixed)
  sup1_id UUID := '33333333-3333-3333-3333-333333333001';
  sup2_id UUID := '33333333-3333-3333-3333-333333333002';
  sup3_id UUID := '33333333-3333-3333-3333-333333333003';
  sup4_id UUID := '33333333-3333-3333-3333-333333333004';
  sup5_id UUID := '33333333-3333-3333-3333-333333333005';
  sup6_id UUID := '33333333-3333-3333-3333-333333333006';
  sup7_id UUID := '33333333-3333-3333-3333-333333333007';

  -- Executive IDs (fixed)
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

  -- Product IDs (fixed)
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
  prod_dai1 UUID := '55555555-5555-5555-5555-555555555011';
  prod_dai2 UUID := '55555555-5555-5555-5555-555555555012';
  prod_dai3 UUID := '55555555-5555-5555-5555-555555555013';
  prod_dai4 UUID := '55555555-5555-5555-5555-555555555014';
  prod_dai5 UUID := '55555555-5555-5555-5555-555555555015';
  prod_snk1 UUID := '55555555-5555-5555-5555-555555555016';
  prod_snk2 UUID := '55555555-5555-5555-5555-555555555017';
  prod_snk3 UUID := '55555555-5555-5555-5555-555555555018';
  prod_snk4 UUID := '55555555-5555-5555-5555-555555555019';
  prod_snk5 UUID := '55555555-5555-5555-5555-555555555020';
  prod_snk6 UUID := '55555555-5555-5555-5555-555555555021';
  prod_wat1 UUID := '55555555-5555-5555-5555-555555555022';
  prod_wat2 UUID := '55555555-5555-5555-5555-555555555023';
  prod_wat3 UUID := '55555555-5555-5555-5555-555555555024';
  prod_spr1 UUID := '55555555-5555-5555-5555-555555555025';
  prod_spr2 UUID := '55555555-5555-5555-5555-555555555026';
  prod_spr3 UUID := '55555555-5555-5555-5555-555555555027';
  prod_spr4 UUID := '55555555-5555-5555-5555-555555555028';
  prod_spr5 UUID := '55555555-5555-5555-5555-555555555029';
  prod_spr6 UUID := '55555555-5555-5555-5555-555555555030';
  prod_hh1 UUID := '55555555-5555-5555-5555-555555555031';
  prod_hh2 UUID := '55555555-5555-5555-5555-555555555032';
  prod_hh3 UUID := '55555555-5555-5555-5555-555555555033';
  prod_hh4 UUID := '55555555-5555-5555-5555-555555555034';
  prod_tob1 UUID := '55555555-5555-5555-5555-555555555035';
  prod_tob2 UUID := '55555555-5555-5555-5555-555555555036';
  prod_con1 UUID := '55555555-5555-5555-5555-555555555037';
  prod_con2 UUID := '55555555-5555-5555-5555-555555555038';
  prod_con3 UUID := '55555555-5555-5555-5555-555555555039';
  prod_ck1 UUID := '55555555-5555-5555-5555-555555555040';
  prod_ck2 UUID := '55555555-5555-5555-5555-555555555041';
  prod_ck3 UUID := '55555555-5555-5555-5555-555555555042';
  prod_pc1 UUID := '55555555-5555-5555-5555-555555555043';
  prod_pc2 UUID := '55555555-5555-5555-5555-555555555044';
  prod_pc3 UUID := '55555555-5555-5555-5555-555555555045';
  prod_cer1 UUID := '55555555-5555-5555-5555-555555555046';
  prod_cer2 UUID := '55555555-5555-5555-5555-555555555047';
  prod_cer3 UUID := '55555555-5555-5555-5555-555555555048';

  -- Customer IDs (fixed)
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

  -- Returnable Item IDs (fixed)
  ret1_id UUID := '77777777-7777-7777-7777-777777777001';
  ret2_id UUID := '77777777-7777-7777-7777-777777777002';
  ret3_id UUID := '77777777-7777-7777-7777-777777777003';
  ret4_id UUID := '77777777-7777-7777-7777-777777777004';
  ret5_id UUID := '77777777-7777-7777-7777-777777777005';
  ret6_id UUID := '77777777-7777-7777-7777-777777777006';

  -- Purchase Invoice IDs (fixed)
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
  -- STEP 1: Get existing company IDs dynamically
  -- ============================================================
  SELECT id INTO comp1_id FROM public.companies WHERE code = 'MBD' LIMIT 1;
  SELECT id INTO comp2_id FROM public.companies WHERE code = 'GBD' LIMIT 1;
  SELECT id INTO comp3_id FROM public.companies WHERE code = 'NDS' LIMIT 1;

  -- If comp2 or comp3 don't exist, insert them
  IF comp2_id IS NULL THEN
    comp2_id := gen_random_uuid();
    INSERT INTO public.companies (id, name, code, registration_number, tin_number, address, city, region, phone, email, is_active, is_default)
    VALUES (comp2_id, 'Ghana Beverages Distribution Co.', 'GBD', 'CS-2015-005678', 'C0098765432109', '12 Harbour Road, Takoradi', 'Takoradi', 'Western', '+233 31 202 3456', 'info@ghanabev.gh', true, false)
    ON CONFLICT (code) DO UPDATE SET id = EXCLUDED.id RETURNING id INTO comp2_id;
    SELECT id INTO comp2_id FROM public.companies WHERE code = 'GBD' LIMIT 1;
  END IF;

  IF comp3_id IS NULL THEN
    comp3_id := gen_random_uuid();
    INSERT INTO public.companies (id, name, code, registration_number, tin_number, address, city, region, phone, email, is_active, is_default)
    VALUES (comp3_id, 'Northern Distribution Services', 'NDS', 'CS-2020-009012', 'C0056789012345', '8 Market Road, Tamale', 'Tamale', 'Northern', '+233 37 201 5678', 'info@northerndist.gh', true, false)
    ON CONFLICT (code) DO UPDATE SET id = EXCLUDED.id RETURNING id INTO comp3_id;
    SELECT id INTO comp3_id FROM public.companies WHERE code = 'NDS' LIMIT 1;
  END IF;

  -- If comp1 doesn't exist at all, use the first company
  IF comp1_id IS NULL THEN
    SELECT id INTO comp1_id FROM public.companies ORDER BY is_default DESC, created_at ASC LIMIT 1;
  END IF;

  -- ============================================================
  -- STEP 2: Get existing location IDs dynamically
  -- ============================================================
  SELECT id INTO loc1_1_id FROM public.locations WHERE company_id = comp1_id AND code = 'MW001' LIMIT 1;
  SELECT id INTO loc1_2_id FROM public.locations WHERE company_id = comp1_id AND code = 'TB002' LIMIT 1;
  SELECT id INTO loc1_3_id FROM public.locations WHERE company_id = comp1_id AND code = 'KB003' LIMIT 1;

  -- Insert missing locations for comp1
  IF loc1_1_id IS NULL THEN
    SELECT id INTO loc1_1_id FROM public.locations WHERE company_id = comp1_id AND is_default = true LIMIT 1;
    IF loc1_1_id IS NULL THEN
      SELECT id INTO loc1_1_id FROM public.locations WHERE company_id = comp1_id LIMIT 1;
    END IF;
  END IF;

  IF loc1_2_id IS NULL THEN
    loc1_2_id := gen_random_uuid();
    INSERT INTO public.locations (id, company_id, name, code, location_type, address, city, phone, manager, is_active, is_default, inventory_enabled)
    VALUES (loc1_2_id, comp1_id, 'Tema Branch', 'TB002', 'branch', 'Community 1, Tema', 'Tema', '+233 24 234 5678', 'Ama Serwaa', true, false, true)
    ON CONFLICT DO NOTHING;
    SELECT id INTO loc1_2_id FROM public.locations WHERE company_id = comp1_id AND code = 'TB002' LIMIT 1;
    IF loc1_2_id IS NULL THEN SELECT id INTO loc1_2_id FROM public.locations WHERE company_id = comp1_id LIMIT 1; END IF;
  END IF;

  IF loc1_3_id IS NULL THEN
    loc1_3_id := gen_random_uuid();
    INSERT INTO public.locations (id, company_id, name, code, location_type, address, city, phone, manager, is_active, is_default, inventory_enabled)
    VALUES (loc1_3_id, comp1_id, 'Kumasi Branch', 'KB003', 'branch', 'Adum, Kumasi', 'Kumasi', '+233 24 345 6789', 'Kofi Boateng', true, false, true)
    ON CONFLICT DO NOTHING;
    SELECT id INTO loc1_3_id FROM public.locations WHERE company_id = comp1_id AND code = 'KB003' LIMIT 1;
    IF loc1_3_id IS NULL THEN SELECT id INTO loc1_3_id FROM public.locations WHERE company_id = comp1_id LIMIT 1; END IF;
  END IF;

  -- ============================================================
  -- STEP 3: SUPPLIERS
  -- ============================================================
  INSERT INTO public.suppliers (id, supplier_code, supplier_name, contact_person, phone, email, address, payment_terms, status)
  VALUES
    (sup1_id, 'SUP001', 'Accra Brewery Limited', 'Emmanuel Asare', '+233 30 277 1234', 'procurement@abl.gh', 'Abeka, Accra', 'net30', 'Active'),
    (sup2_id, 'SUP002', 'Guinness Ghana Breweries', 'Patricia Agyemang', '+233 30 277 5678', 'orders@ggb.gh', 'Kaase, Kumasi', 'net30', 'Active'),
    (sup3_id, 'SUP003', 'Fan Milk Ghana Ltd', 'Nana Ama Darko', '+233 30 222 3456', 'supply@fanmilk.gh', 'North Industrial Area, Accra', 'net14', 'Active'),
    (sup4_id, 'SUP004', 'Nestlé Ghana Limited', 'Richard Osei', '+233 30 277 8901', 'trade@nestle.gh', 'Tema Industrial Area', 'net45', 'Active'),
    (sup5_id, 'SUP005', 'Unilever Ghana Ltd', 'Josephine Mensah', '+233 30 277 2345', 'orders@unilever.gh', 'Tema Free Zone', 'net30', 'Active'),
    (sup6_id, 'SUP006', 'Kasapreko Company Ltd', 'Daniel Quaye', '+233 30 277 6789', 'sales@kasapreko.gh', 'Spintex Road, Accra', 'net21', 'Active'),
    (sup7_id, 'SUP007', 'Voltic Ghana Ltd', 'Akosua Frimpong', '+233 30 277 3456', 'orders@voltic.gh', 'Tema, Greater Accra', 'net30', 'Active')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- STEP 4: VENDORS (15 vendors linked to real company IDs)
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
  -- STEP 5: BUSINESS EXECUTIVES
  -- ============================================================
  INSERT INTO public.business_executives (id, exec_code, full_name, phone, mobile, email, company_id, status)
  VALUES
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
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- STEP 6: PRODUCTS (48 products)
  -- ============================================================
  INSERT INTO public.products (
    id, product_code, product_name, description, category,
    unit_of_measure, pack_unit, cost_price, selling_price,
    reorder_level, reorder_quantity, supplier_id, supplier_name,
    empties_type, is_taxable, is_returnable, plastic_cost, bottle_cost,
    status, company_id
  ) VALUES
    -- BEVERAGES
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
    (prod_dai4, 'DAI004', 'Cowbell Milk Powder 400g', 'Cowbell full cream milk powder 400g tin', 'Dairy', 'Pcs', 1, 28.00, 36.00, 50, 200, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
    (prod_dai5, 'DAI005', 'Peak Milk Evaporated 410g', 'Peak full cream evaporated milk 410g tin', 'Dairy', 'Ctn', 24, 85.00, 108.00, 40, 160, sup4_id, 'Nestlé Ghana Limited', 'None', false, false, 0, 0, 'active', comp1_id),
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
    -- BEER & SPIRITS
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
  -- STEP 7: CUSTOMERS (25 customers)
  -- ============================================================
  INSERT INTO public.customers (
    id, customer_code, customer_name, business_name, price_type,
    mobile, email, business_address, call_days, customer_type,
    business_executive, credit_limit, location, status,
    company_id, location_id
  ) VALUES
    (cust1_id, 'C001', 'Kofi Agyeman', 'Agyeman General Store', 'Retail', '+233 24 100 0001', 'kofi.agyeman@gmail.com', 'Madina Market, Accra', 'Mon,Wed,Fri', 'Retailer', 'Kwame Asante', 5000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
    (cust2_id, 'C002', 'Ama Boateng', 'Boateng Provisions', 'Retail', '+233 24 100 0002', 'ama.boateng@gmail.com', 'Osu, Accra', 'Tue,Thu,Sat', 'Retailer', 'Ama Serwaa', 3000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
    (cust3_id, 'C003', 'Kweku Mensah', 'Mensah Supermarket', 'Supermarket', '+233 24 100 0003', 'kweku.mensah@gmail.com', 'East Legon, Accra', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Kofi Boateng', 25000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
    (cust4_id, 'C004', 'Abena Asante', 'Asante Wholesale', 'Wholesale', '+233 24 100 0004', 'abena.asante@gmail.com', 'Kaneshie Market, Accra', 'Mon,Wed,Fri', 'Wholesaler', 'Abena Owusu', 15000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
    (cust5_id, 'C005', 'Yaw Darko', 'Darko Hotel & Restaurant', 'Hotel', '+233 24 100 0005', 'yaw.darko@gmail.com', 'Airport Residential, Accra', 'Mon,Thu', 'Hotel', 'Yaw Mensah', 20000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
    (cust6_id, 'C006', 'Akosua Owusu', 'Owusu Catering Services', 'Catering', '+233 24 100 0006', 'akosua.owusu@gmail.com', 'Labone, Accra', 'Tue,Fri', 'Caterer', 'Akosua Frimpong', 8000, 'Main Warehouse', 'Active', comp1_id, loc1_1_id),
    (cust7_id, 'C007', 'Emmanuel Quaye', 'Quaye Mini Mart', 'Retail', '+233 24 100 0007', 'emmanuel.quaye@gmail.com', 'Tema Community 5', 'Mon,Wed,Fri', 'Retailer', 'Emmanuel Darko', 4000, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
    (cust8_id, 'C008', 'Patricia Frimpong', 'Frimpong Beverages', 'Wholesale', '+233 24 100 0008', 'patricia.frimpong@gmail.com', 'Tema Community 1', 'Tue,Thu', 'Wholesaler', 'Patricia Agyemang', 12000, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
    (cust9_id, 'C009', 'Daniel Asare', 'Asare Superstore', 'Supermarket', '+233 24 100 0009', 'daniel.asare@gmail.com', 'Tema Community 9', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Emmanuel Darko', 30000, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
    (cust10_id, 'C010', 'Josephine Acheampong', 'Acheampong Provisions', 'Retail', '+233 24 100 0010', 'josephine.acheampong@gmail.com', 'Tema Community 3', 'Mon,Wed', 'Retailer', 'Patricia Agyemang', 2500, 'Tema Branch', 'Active', comp1_id, loc1_2_id),
    (cust11_id, 'C011', 'Richard Boateng', 'Boateng Wholesale', 'Wholesale', '+233 24 100 0011', 'richard.boateng@gmail.com', 'Adum, Kumasi', 'Tue,Thu,Sat', 'Wholesaler', 'Kofi Boateng', 18000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
    (cust12_id, 'C012', 'Nana Ama Osei', 'Osei Supermarket', 'Supermarket', '+233 24 100 0012', 'nana.osei@gmail.com', 'Kejetia, Kumasi', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Kofi Boateng', 35000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
    (cust13_id, 'C013', 'Kwame Ofori', 'Ofori General Goods', 'Retail', '+233 24 100 0013', 'kwame.ofori@gmail.com', 'Bantama, Kumasi', 'Mon,Wed,Fri', 'Retailer', 'Kofi Boateng', 3500, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
    (cust14_id, 'C014', 'Ama Sarpong', 'Sarpong Hotel', 'Hotel', '+233 24 100 0014', 'ama.sarpong@gmail.com', 'Nhyiaeso, Kumasi', 'Mon,Thu', 'Hotel', 'Kofi Boateng', 22000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
    (cust15_id, 'C015', 'Kofi Amponsah', 'Amponsah Catering', 'Catering', '+233 24 100 0015', 'kofi.amponsah@gmail.com', 'Asokwa, Kumasi', 'Tue,Fri', 'Caterer', 'Kofi Boateng', 7000, 'Kumasi Branch', 'Active', comp1_id, loc1_3_id),
    (cust16_id, 'C016', 'Abena Mensah', 'Mensah Provisions', 'Retail', '+233 24 100 0016', 'abena.mensah@gmail.com', 'Takoradi Market', 'Mon,Wed,Fri', 'Retailer', 'Daniel Quaye', 4500, 'Main Warehouse', 'Active', comp2_id, loc1_1_id),
    (cust17_id, 'C017', 'Yaw Acheampong', 'Acheampong Wholesale', 'Wholesale', '+233 24 100 0017', 'yaw.acheampong@gmail.com', 'Takoradi', 'Tue,Thu', 'Wholesaler', 'Josephine Mensah', 14000, 'Main Warehouse', 'Active', comp2_id, loc1_1_id),
    (cust18_id, 'C018', 'Akosua Darko', 'Darko Supermarket', 'Supermarket', '+233 24 100 0018', 'akosua.darko@gmail.com', 'Sekondi, Western', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Daniel Quaye', 28000, 'Main Warehouse', 'Active', comp2_id, loc1_1_id),
    (cust19_id, 'C019', 'Emmanuel Asante', 'Asante Beverages', 'Wholesale', '+233 24 100 0019', 'emmanuel.asante@gmail.com', 'Effia, Takoradi', 'Mon,Wed', 'Wholesaler', 'Josephine Mensah', 16000, 'Main Warehouse', 'Active', comp2_id, loc1_1_id),
    (cust20_id, 'C020', 'Patricia Owusu', 'Owusu Mini Mart', 'Retail', '+233 24 100 0020', 'patricia.owusu@gmail.com', 'Takoradi', 'Tue,Thu,Sat', 'Retailer', 'Daniel Quaye', 2000, 'Main Warehouse', 'Active', comp2_id, loc1_1_id),
    (cust21_id, 'C021', 'Ibrahim Sulemana', 'Sulemana General Store', 'Retail', '+233 37 100 0021', 'ibrahim.sulemana@gmail.com', 'Tamale Central', 'Mon,Wed,Fri', 'Retailer', 'Ibrahim Alhassan', 3000, 'Main Warehouse', 'Active', comp3_id, loc1_1_id),
    (cust22_id, 'C022', 'Fatima Mohammed', 'Mohammed Provisions', 'Retail', '+233 37 100 0022', 'fatima.mohammed@gmail.com', 'Tamale', 'Tue,Thu', 'Retailer', 'Fatima Issah', 2500, 'Main Warehouse', 'Active', comp3_id, loc1_1_id),
    (cust23_id, 'C023', 'Alhassan Yakubu', 'Yakubu Wholesale', 'Wholesale', '+233 37 100 0023', 'alhassan.yakubu@gmail.com', 'Tamale', 'Mon,Thu', 'Wholesaler', 'Ibrahim Alhassan', 10000, 'Main Warehouse', 'Active', comp3_id, loc1_1_id),
    (cust24_id, 'C024', 'Issah Fuseini', 'Fuseini Supermarket', 'Supermarket', '+233 37 100 0024', 'issah.fuseini@gmail.com', 'Bolgatanga', 'Mon,Tue,Wed,Thu,Fri', 'Supermarket', 'Fatima Issah', 20000, 'Main Warehouse', 'Active', comp3_id, loc1_1_id),
    (cust25_id, 'C025', 'Mariama Abdulai', 'Abdulai Hotel', 'Hotel', '+233 37 100 0025', 'mariama.abdulai@gmail.com', 'Tamale', 'Mon,Thu', 'Hotel', 'Ibrahim Alhassan', 15000, 'Main Warehouse', 'Active', comp3_id, loc1_1_id)
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- STEP 8: RETURNABLE ITEMS
  -- ============================================================
  INSERT INTO public.returnable_items (id, item_code, item_name, item_type, deposit_amount, stock_level, unit, description, status)
  VALUES
    (ret1_id, 'RI001', '35cl Glass Bottle', 'Bottle', 0.80, 5000, 'Pcs', 'Standard 35cl glass bottle for soft drinks', 'active'),
    (ret2_id, 'RI002', '60cl Glass Bottle', 'Bottle', 1.20, 3000, 'Pcs', 'Standard 60cl glass bottle for beer/stout', 'active'),
    (ret3_id, 'RI003', '200ml Glass Bottle', 'Bottle', 0.60, 2000, 'Pcs', 'Small 200ml glass bottle for bitters', 'active'),
    (ret4_id, 'RI004', '24-Bottle Crate', 'Crate', 15.00, 800, 'Pcs', 'Standard 24-bottle plastic crate', 'active'),
    (ret5_id, 'RI005', '12-Bottle Crate', 'Crate', 10.00, 600, 'Pcs', 'Standard 12-bottle plastic crate for beer', 'active'),
    (ret6_id, 'RI006', '20L Keg', 'Keg', 50.00, 200, 'Pcs', '20 litre stainless steel keg', 'active')
  ON CONFLICT (item_code) DO NOTHING;

  -- ============================================================
  -- STEP 9: PURCHASE INVOICES (12 invoices)
  -- ============================================================
  INSERT INTO public.purchase_invoices (
    id, invoice_no, supplier_id, supplier_name, location_id, location_name,
    invoice_date, delivery_date, due_date, pallet_qty, notes,
    subtotal, total_tax_amt, total_pre_tax, total_tax_inc_value,
    total_empties_value, total_breakages_value, status, posted_ap, posted_stock, company_id
  ) VALUES
    (pi1_id, 'PI-2026-02-10-001', sup1_id, 'Accra Brewery Limited', loc1_1_id, 'Main Warehouse', '2026-02-10', '2026-02-11', '2026-03-12', 5, 'Regular delivery', 28500.00, 3420.00, 25080.00, 28500.00, 1200.00, 0, 'posted', true, true, comp1_id),
    (pi2_id, 'PI-2026-02-14-002', sup2_id, 'Guinness Ghana Breweries', loc1_1_id, 'Main Warehouse', '2026-02-14', '2026-02-15', '2026-03-16', 4, 'Stout and malt delivery', 22000.00, 2640.00, 19360.00, 22000.00, 960.00, 0, 'posted', true, true, comp1_id),
    (pi3_id, 'PI-2026-02-17-003', sup3_id, 'Fan Milk Ghana Ltd', loc1_1_id, 'Main Warehouse', '2026-02-17', '2026-02-17', '2026-03-03', 2, 'Dairy products delivery', 8400.00, 0, 8400.00, 8400.00, 0, 0, 'posted', true, true, comp1_id),
    (pi4_id, 'PI-2026-02-20-004', sup4_id, 'Nestlé Ghana Limited', loc1_2_id, 'Tema Branch', '2026-02-20', '2026-02-21', '2026-04-06', 6, 'Nestle products for Tema branch', 35000.00, 0, 35000.00, 35000.00, 0, 0, 'posted', true, true, comp1_id),
    (pi5_id, 'PI-2026-02-22-005', sup5_id, 'Unilever Ghana Ltd', loc1_1_id, 'Main Warehouse', '2026-02-22', '2026-02-23', '2026-03-24', 3, 'Household products delivery', 18500.00, 0, 18500.00, 18500.00, 0, 0, 'posted', true, true, comp1_id),
    (pi6_id, 'PI-2026-02-24-006', sup6_id, 'Kasapreko Company Ltd', loc1_1_id, 'Main Warehouse', '2026-02-24', '2026-02-25', '2026-03-17', 3, 'Spirits delivery', 15000.00, 1800.00, 13200.00, 15000.00, 720.00, 0, 'posted', true, true, comp1_id),
    (pi7_id, 'PI-2026-02-26-007', sup7_id, 'Voltic Ghana Ltd', loc1_3_id, 'Kumasi Branch', '2026-02-26', '2026-02-27', '2026-03-28', 4, 'Water products for Kumasi', 12000.00, 0, 12000.00, 12000.00, 0, 0, 'posted', true, true, comp1_id),
    (pi8_id, 'PI-2026-02-28-008', sup1_id, 'Accra Brewery Limited', loc1_2_id, 'Tema Branch', '2026-02-28', '2026-03-01', '2026-03-31', 5, 'Beverages for Tema branch', 26000.00, 3120.00, 22880.00, 26000.00, 1080.00, 240.00, 'posted', true, true, comp1_id),
    (pi9_id, 'PI-2026-03-01-009', sup2_id, 'Guinness Ghana Breweries', loc1_3_id, 'Kumasi Branch', '2026-03-01', '2026-03-02', '2026-04-01', 3, 'Beer delivery to Kumasi', 19500.00, 2340.00, 17160.00, 19500.00, 840.00, 0, 'posted', true, true, comp1_id),
    (pi10_id, 'PI-2026-03-02-010', sup4_id, 'Nestlé Ghana Limited', loc1_1_id, 'Main Warehouse', '2026-03-02', '2026-03-03', '2026-04-17', 4, 'Nestle restock', 28000.00, 0, 28000.00, 28000.00, 0, 0, 'draft', false, false, comp1_id),
    (pi11_id, 'PI-2026-03-02-011', sup5_id, 'Unilever Ghana Ltd', loc1_2_id, 'Tema Branch', '2026-03-02', '2026-03-03', '2026-04-02', 2, 'Household restock Tema', 14000.00, 0, 14000.00, 14000.00, 0, 0, 'draft', false, false, comp1_id),
    (pi12_id, 'PI-2026-03-03-012', sup6_id, 'Kasapreko Company Ltd', loc1_3_id, 'Kumasi Branch', '2026-03-03', '2026-03-04', '2026-03-24', 2, 'Spirits for Kumasi', 11000.00, 1320.00, 9680.00, 11000.00, 480.00, 0, 'draft', false, false, comp1_id)
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Fix seed data error: %', SQLERRM;
END $$;
