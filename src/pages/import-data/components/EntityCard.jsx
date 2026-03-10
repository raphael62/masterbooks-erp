import React from 'react';
import Icon from '../../../components/AppIcon';

const SAMPLE_ROWS = {
  companies: {
    code: 'COMP001',
    name: 'Acme Corporation',
    address: '123 Main Street',
    city: 'Nairobi',
    phone: '+254700000001',
    email: 'info@acme.com',
    vat_number: 'P051234567A',
    registration_number: 'CPR/2020/001',
  },
  locations: {
    code: 'LOC001',
    name: 'Main Warehouse',
    location_type: 'warehouse',
    address: '456 Industrial Road',
    city: 'Nairobi',
    phone: '+254700000002',
    manager: 'John Doe',
  },
  products: {
    product_code: 'PRD001',
    product_name: 'Mineral Water 500ml',
    category: 'Beverages',
    unit_of_measure: 'Bottle',
    cost_price: '25.00',
    selling_price: '40.00',
    barcode: '6001234567890',
    description: 'Still mineral water 500ml bottle',
  },
  customers: {
    customer_code: 'CUST001',
    customer_name: 'Jane Smith',
    business_name: 'Smith Enterprises',
    mobile: '+254711000001',
    email: 'jane@smithenterprises.com',
    business_address: '789 Commerce Ave, Nairobi',
    customer_type: 'wholesale',
    credit_limit: '50000',
  },
  vendors: {
    vendor_code: 'VND001',
    vendor_name: 'Global Supplies Ltd',
    contact_person: 'Michael Osei',
    phone: '+233244000001',
    email: 'procurement@globalsupplies.com',
    address: '12 Industrial Lane',
    city: 'Accra',
    country: 'Greater Accra',
    payment_terms: 'net30',
    credit_limit: '100000',
    tax_id: 'GH-VAT-123456',
    bank_name: 'Ghana Commercial Bank',
    bank_account: '1234567890',
    category: 'supplier',
    status: 'active',
  },
  price_lists: {
    price_list_code: 'PL001',
    price_list_name: 'Wholesale Price List 2025',
    customer_type: 'wholesale',
    product_code: 'PRD001',
    product_name: 'Mineral Water 500ml',
    unit_price: '35.00',
    min_quantity: '50',
    max_quantity: '500',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    status: 'active',
  },
  vsr_monthly_targets: {
    executive_code: 'VSR001',
    executive_name: 'John Doe',
    year: '2025',
    month: '1',
    product_code: 'PRD001',
    product_name: 'Mineral Water 500ml',
    target_qty_cases: '100',
    target_qty_bottles: '1200',
    target_value: '5000.00',
  },
  ssr_monthly_targets: {
    executive_code: 'SSR001',
    executive_name: 'Jane Smith',
    year: '2025',
    month: '1',
    target_value: '15000.00',
  },
  business_executives: {
    exec_code: 'EXEC001',
    first_name: 'Kwame',
    last_name: 'Mensah',
    phone: '+233244000001',
    email: 'kwame.mensah@company.com',
    company_code: 'COMP001',
    location_code: 'LOC001',
    sales_rep_type: 'VSR',
    target_amount: '50000.00',
    commission_rate: '5.00',
    status: 'Active',
  },
};

const EntityCard = ({ config, stats, onUpload }) => {
  const downloadTemplate = () => {
    const headers = config?.fields?.map(f => f?.key);
    const sampleRow = SAMPLE_ROWS?.[config?.key] || {};
    const sampleValues = headers?.map(h => {
      const val = sampleRow?.[h] ?? '';
      // Wrap in quotes if value contains comma
      return String(val)?.includes(',') ? `"${val}"` : val;
    });

    // Build header comment row with labels and required markers
    const labelRow = config?.fields?.map(f => `${f?.label}${f?.required ? ' (required)' : ''} [${f?.type}]`);
    const labelRowEscaped = labelRow?.map(l => l?.includes(',') ? `"${l}"` : l);

    const csvContent = [
      labelRowEscaped?.join(','),
      headers?.join(','),
      sampleValues?.join(','),
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL?.createObjectURL(blob);
    const link = document?.createElement('a');
    link.href = url;
    link.download = `${config?.key}_import_template.csv`;
    document?.body?.appendChild(link);
    link?.click();
    document?.body?.removeChild(link);
    URL?.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config?.bgColor}`}>
            <Icon name={config?.icon} size={22} className={config?.iconColor} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{config?.label}</h3>
            <p className="text-xs text-muted-foreground">{config?.description}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Last Import</p>
          <p className="text-sm font-semibold text-foreground">{stats?.lastImport || 'Never'}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Total Records</p>
          <p className="text-sm font-semibold text-foreground">{stats?.totalRecords ?? '—'}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">Required fields:</p>
        <div className="flex flex-wrap gap-1">
          {config?.fields?.filter(f => f?.required)?.map(f => (
            <span key={f?.key} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{f?.label}</span>
          ))}
        </div>
      </div>
      <button
        onClick={onUpload}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Icon name="Upload" size={15} />
        Upload CSV / Excel
      </button>
      <button
        onClick={downloadTemplate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
      >
        <Icon name="Download" size={15} />
        Download Template
      </button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="FileText" size={12} />
        <span>CSV, XLSX, XLS · Max 10MB</span>
      </div>
    </div>
  );
};

export default EntityCard;
