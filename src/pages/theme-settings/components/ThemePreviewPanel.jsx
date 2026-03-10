import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const ThemePreviewPanel = ({ previewThemeId }) => {
  const { themes } = useTheme();
  const theme = themes?.[previewThemeId];
  const primaryColor = theme?.primary || '#6D28D9';

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Preview Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">See how your theme looks across the application</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Mini Navigation Bar */}
        <div className="rounded-lg overflow-hidden border border-border">
          <div style={{ backgroundColor: primaryColor }} className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-white rounded-sm" />
              </div>
              <span className="text-white text-xs font-semibold">MasterBooks ERP</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-white/20 rounded-full" />
              <div className="w-5 h-5 bg-white/20 rounded-full" />
            </div>
          </div>
          <div className="bg-muted/50 px-4 py-1.5 flex items-center space-x-1">
            {['Dashboard', 'Sales', 'Purchases', 'Inventory']?.map((item, i) => (
              <div
                key={item}
                style={i === 1 ? { backgroundColor: primaryColor } : {}}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  i === 1 ? 'text-white' : 'text-muted-foreground'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Revenue', value: '$48.2K' },
            { label: 'Orders', value: '1,284' },
            { label: 'Customers', value: '342' },
          ]?.map((card) => (
            <div key={card?.label} className="bg-muted rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">{card?.label}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{card?.value}</p>
              <div style={{ backgroundColor: primaryColor }} className="mt-1.5 h-1 rounded-full w-3/4 opacity-70" />
            </div>
          ))}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            style={{ backgroundColor: primaryColor }}
            className="px-3 py-1.5 rounded-md text-white text-xs font-medium"
          >
            Primary Button
          </button>
          <button
            style={{ borderColor: primaryColor, color: primaryColor }}
            className="px-3 py-1.5 rounded-md border text-xs font-medium bg-transparent"
          >
            Outline
          </button>
          <span
            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            className="px-2 py-0.5 rounded-full text-xs font-medium"
          >
            Badge
          </span>
          <span
            style={{ color: primaryColor }}
            className="text-xs font-medium underline cursor-pointer"
          >
            Link
          </span>
        </div>

        {/* Mini Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div style={{ backgroundColor: `${primaryColor}10` }} className="px-3 py-2 flex items-center space-x-4">
            <span className="text-xs font-semibold text-foreground flex-1">Order #</span>
            <span className="text-xs font-semibold text-foreground flex-1">Customer</span>
            <span className="text-xs font-semibold text-foreground">Status</span>
          </div>
          {[
            { order: 'SO-001', customer: 'Acme Corp', status: 'Active' },
            { order: 'SO-002', customer: 'Beta Ltd', status: 'Pending' },
          ]?.map((row) => (
            <div key={row?.order} className="px-3 py-2 flex items-center space-x-4 border-t border-border">
              <span style={{ color: primaryColor }} className="text-xs font-medium flex-1">{row?.order}</span>
              <span className="text-xs text-foreground flex-1">{row?.customer}</span>
              <span
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              >
                {row?.status}
              </span>
            </div>
          ))}
        </div>

        {/* Chart Bar Preview */}
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-foreground mb-2">Sales Trend</p>
          <div className="flex items-end space-x-1.5 h-12">
            {[40, 65, 50, 80, 55, 90, 70]?.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%`, backgroundColor: i === 5 ? primaryColor : `${primaryColor}50` }}
                className="flex-1 rounded-t-sm transition-all duration-300"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S']?.map((d, i) => (
              <span key={i} className="text-xs text-muted-foreground flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>

        {/* Form Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Search Orders</label>
          <div
            style={{ borderColor: primaryColor }}
            className="flex items-center border rounded-md px-2.5 py-1.5 bg-background"
          >
            <div style={{ color: primaryColor }} className="w-3 h-3 mr-2 opacity-70">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground">Search...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreviewPanel;
