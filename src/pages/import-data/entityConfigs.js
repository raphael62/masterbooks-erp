import { supabase } from '../../lib/supabase';

export const ENTITY_CONFIGS = [
  {
    key: 'products',
    label: 'Products',
    table: 'products',
    fields: [
      { key: 'product_code', label: 'Product Code', required: true, type: 'text' },
      { key: 'product_name', label: 'Product Name', required: true, type: 'text' },
      { key: 'category', label: 'Category', required: false, type: 'text' },
      { key: 'unit_of_measure', label: 'UOM', required: false, type: 'text' },
      { key: 'pack_unit', label: 'Pack Unit', required: false, type: 'integer' },
      { key: 'empties_type', label: 'Empties Type', required: false, type: 'text' },
      { key: 'plastic_cost', label: 'Plastic Cost', required: false, type: 'number' },
      { key: 'bottle_cost', label: 'Bottle Cost', required: false, type: 'number' },
      { key: 'is_taxable', label: 'Is Taxable (yes/no)', required: false, type: 'boolean' },
      { key: 'is_returnable', label: 'Is Returnable (yes/no)', required: false, type: 'boolean' },
      { key: 'description', label: 'Description', required: false, type: 'text' },
    ],
    sampleRow: {
      product_code: 'PRD-001',
      product_name: 'Mineral Water 500ml',
      category: 'Beverages',
      unit_of_measure: 'CTN',
      pack_unit: '24',
    },
    insertFn: async (record) => {
      const parseBool = (val) => {
        const v = val?.toString()?.trim()?.toLowerCase();
        return v === 'yes' || v === 'true' || v === '1';
      };
      const insertRecord = {
        product_code: record?.product_code || record?.sku || null,
        product_name: record?.product_name || record?.name || null,
        category: record?.category || null,
        unit_of_measure: record?.unit_of_measure || null,
        pack_unit: record?.pack_unit ? parseInt(record?.pack_unit, 10) || null : null,
        empties_type: record?.empties_type || null,
        plastic_cost: record?.plastic_cost ? parseFloat(record?.plastic_cost) || null : null,
        bottle_cost: record?.bottle_cost ? parseFloat(record?.bottle_cost) || null : null,
        is_taxable: parseBool(record?.is_taxable),
        is_returnable: parseBool(record?.is_returnable),
        description: record?.description || null,
      };
      return supabase?.from('products')?.insert(insertRecord);
    },
  },
  {
    key: 'customers',
    label: 'Customers',
    table: 'customers',
    fields: [
      { key: 'customer_code', label: 'Customer Code', required: true, type: 'text' },
      { key: 'customer_name', label: 'Customer Name', required: true, type: 'text' },
      { key: 'business_name', label: 'Business Name', required: false, type: 'text' },
      { key: 'mobile', label: 'Mobile', required: false, type: 'text' },
      { key: 'email', label: 'Email', required: false, type: 'email' },
      { key: 'business_address', label: 'Address', required: false, type: 'text' },
      { key: 'customer_type', label: 'Customer Type', required: false, type: 'text' },
      { key: 'price_type', label: 'Price Type', required: false, type: 'text' },
      { key: 'business_executive', label: 'Sales Rep', required: false, type: 'text' },
      { key: 'credit_limit', label: 'Credit Limit', required: false, type: 'number' },
    ],
    insertFn: async (record) => supabase?.from('customers')?.insert(record),
  },
  {
    key: 'vendors',
    label: 'Vendors',
    table: 'vendors',
    fields: [
      { key: 'vendor_code', label: 'Vendor Code', required: true, type: 'text' },
      { key: 'vendor_name', label: 'Vendor Name', required: true, type: 'text' },
      { key: 'contact_person', label: 'Contact Person', required: false, type: 'text' },
      { key: 'phone', label: 'Phone', required: false, type: 'text' },
      { key: 'email', label: 'Email', required: false, type: 'email' },
      { key: 'address', label: 'Address', required: false, type: 'text' },
    ],
    insertFn: async (record) => supabase?.from('vendors')?.insert(record),
  },
  {
    key: 'business_executives',
    label: 'Sales Reps',
    table: 'business_executives',
    fields: [
      { key: 'exec_code', label: 'Executive Code', required: true, type: 'text' },
      { key: 'first_name', label: 'First Name', required: true, type: 'text' },
      { key: 'last_name', label: 'Last Name', required: true, type: 'text' },
      { key: 'phone', label: 'Phone', required: false, type: 'text' },
      { key: 'email', label: 'Email', required: false, type: 'email' },
      { key: 'sales_rep_type', label: 'Sales Rep Type (VSR/SSR)', required: true, type: 'text' },
    ],
    insertFn: async (record, allRecords, _a, _b, validationData) => {
      const execCode = record?.exec_code?.toString()?.trim();
      if (validationData?.existingExecCodes?.includes(execCode)) {
        return { error: { message: `Executive Code "${execCode}" already exists` } };
      }
      const full_name = [record?.first_name, record?.last_name].filter(Boolean).join(' ');
      const insertRecord = {
        exec_code: execCode,
        first_name: record?.first_name || null,
        last_name: record?.last_name || null,
        full_name,
        phone: record?.phone || null,
        email: record?.email || null,
        sales_rep_type: record?.sales_rep_type?.toString()?.trim()?.toUpperCase() || null,
        status: 'Active',
      };
      return supabase?.from('business_executives')?.insert(insertRecord);
    },
    validateFn: async () => {
      const [execRes, compRes, locRes] = await Promise.all([
        supabase?.from('business_executives')?.select('exec_code'),
        supabase?.from('companies')?.select('id, code'),
        supabase?.from('locations')?.select('id, code'),
      ]);
      return {
        existingExecCodes: (execRes?.data || []).map((e) => e?.exec_code),
        companyCodes: (compRes?.data || []).map((c) => c?.code),
        companies: compRes?.data || [],
        locationCodes: (locRes?.data || []).map((l) => l?.code),
      };
    },
  },
  {
    key: 'price_lists',
    label: 'Product Prices',
    table: 'price_list_headers',
    fields: [
      { key: 'price_list_code', label: 'Price List Code', required: true, type: 'text' },
      { key: 'price_list_name', label: 'Price List Name', required: true, type: 'text' },
      { key: 'price_type', label: 'Price Type', required: false, type: 'text' },
    ],
    insertFn: async (record) => {
      let price_type_id = null;
      if (record?.price_type) {
        const { data } = await supabase
          ?.from('price_types')
          ?.select('id')
          ?.ilike('price_type_name', record?.price_type?.toString()?.trim())
          ?.limit(1);
        price_type_id = data?.[0]?.id || null;
      }
      return supabase?.from('price_list_headers')?.insert({
        price_list_code: record?.price_list_code,
        price_list_name: record?.price_list_name,
        price_type_id,
        status: 'active',
      });
    },
  },
  {
    key: 'vsr_monthly_targets',
    label: 'Van Sales Rep Targets',
    table: 'vsr_monthly_targets',
    fields: [
      { key: 'executive_code', label: 'Executive Code', required: true, type: 'text' },
      { key: 'product_code', label: 'Product Code', required: true, type: 'text' },
      { key: 'year', label: 'Year', required: true, type: 'number' },
      { key: 'month', label: 'Month', required: true, type: 'number' },
    ],
    insertFn: async (record, _all, vsrExecCodes, productCodes) => {
      if (vsrExecCodes && !vsrExecCodes?.includes(record?.executive_code)) {
        return { error: { message: 'Executive not found or not VSR' } };
      }
      if (productCodes && !productCodes?.includes(record?.product_code)) {
        return { error: { message: 'Product code not found' } };
      }
      return supabase?.from('vsr_monthly_targets')?.insert(record);
    },
    validateFn: async () => {
      const [execRes, prodRes] = await Promise.all([
        supabase?.from('business_executives')?.select('exec_code')?.eq('sales_rep_type', 'VSR'),
        supabase?.from('products')?.select('product_code'),
      ]);
      return {
        vsrExecCodes: (execRes?.data || []).map((e) => e?.exec_code),
        productCodes: (prodRes?.data || []).map((p) => p?.product_code),
      };
    },
  },
  {
    key: 'ssr_monthly_targets',
    label: 'Shop Sales Rep Targets',
    table: 'ssr_monthly_targets',
    fields: [
      { key: 'executive_code', label: 'Executive Code', required: true, type: 'text' },
      { key: 'year', label: 'Year', required: true, type: 'number' },
      { key: 'month', label: 'Month', required: true, type: 'number' },
      { key: 'target_value', label: 'Target Value', required: true, type: 'number' },
    ],
    insertFn: async (record, _all, ssrExecCodes) => {
      if (ssrExecCodes && !ssrExecCodes?.includes(record?.executive_code)) {
        return { error: { message: 'Executive not found or not SSR' } };
      }
      return supabase?.from('ssr_monthly_targets')?.insert(record);
    },
    validateFn: async () => {
      const { data } = await supabase?.from('business_executives')?.select('exec_code')?.eq('sales_rep_type', 'SSR');
      return { ssrExecCodes: (data || []).map((e) => e?.exec_code) };
    },
  },
];
