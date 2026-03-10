import React from 'react';
import Icon from '../../../components/AppIcon';

const IMPORT_ENTITIES = [
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'business_executives', label: 'Sales Reps' },
  { key: 'price_lists', label: 'Product Prices' },
  { key: 'opening_stocks', label: 'Opening Stocks' },
  { key: 'ssr_monthly_targets', label: 'Shop Sales Rep Targets' },
  { key: 'vsr_monthly_targets', label: 'Van Sales Rep Targets' },
  { key: 'sales_invoices', label: 'Sales Invoices' },
  { key: 'purchase_invoices', label: 'Purchase Invoices' },
];

const ImportSidebar = ({ activeKey, onSelect }) => {
  return (
    <div className="w-56 flex-shrink-0 bg-card border-r border-border">
      <div className="p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Imports</h3>
        <nav className="space-y-0.5">
          {IMPORT_ENTITIES.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                activeKey === item.key
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon name="FileUp" size={14} className="flex-shrink-0 opacity-70" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ImportSidebar;
export { IMPORT_ENTITIES };
