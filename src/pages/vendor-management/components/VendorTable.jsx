import React, { useState, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const COLUMNS = [
  { key: 'vendor_code', label: 'Vendor Code', width: 'w-28' },
  { key: 'vendor_name', label: 'Vendor Name', width: 'w-52' },
  { key: 'contact_person', label: 'Contact Person', width: 'w-40' },
  { key: 'phone', label: 'Phone', width: 'w-32' },
  { key: 'email', label: 'Email', width: 'w-44' },
  { key: 'payment_terms', label: 'Payment Terms', width: 'w-32' },
  { key: 'credit_limit', label: 'Credit Limit', width: 'w-32' },
  { key: 'outstanding_balance', label: 'Outstanding', width: 'w-32' },
  { key: 'status', label: 'Status', width: 'w-24' },
];

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

const VendorTable = ({ vendors, isLoading, onEdit, onDuplicate, onDeactivate, selectedRows, onRowSelect, onSelectAll, selectAll }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const tableRef = useRef(null);

  const formatGHS = (val) =>
    val ? `GHS ${parseFloat(val)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

  const handleContextMenu = useCallback((e, vendor) => {
    e?.preventDefault();
    setContextMenu({ x: e?.clientX, y: e?.clientY, vendor });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleKeyDown = useCallback((e, rowIdx, colIdx) => {
    const rows = vendors?.length;
    const cols = COLUMNS?.length;
    if (e?.key === 'ArrowDown' && rowIdx < rows - 1) {
      setSelectedCell({ row: rowIdx + 1, col: colIdx });
    } else if (e?.key === 'ArrowUp' && rowIdx > 0) {
      setSelectedCell({ row: rowIdx - 1, col: colIdx });
    } else if (e?.key === 'ArrowRight' && colIdx < cols - 1) {
      setSelectedCell({ row: rowIdx, col: colIdx + 1 });
    } else if (e?.key === 'ArrowLeft' && colIdx > 0) {
      setSelectedCell({ row: rowIdx, col: colIdx - 1 });
    }
  }, [vendors]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8 text-center">
          <Icon name="Loader2" size={24} className="animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative" onClick={closeContextMenu}>
      <table ref={tableRef} className="w-full border-collapse text-sm" style={{ minWidth: '900px' }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted border-b-2 border-border">
            <th className="w-10 px-3 py-2.5 text-left">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={onSelectAll}
                className="rounded border-border"
              />
            </th>
            <th className="w-8 px-2 py-2.5 text-xs font-semibold text-muted-foreground text-center">#</th>
            {COLUMNS?.map((col) => (
              <th key={col?.key} className={`${col?.width} px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border last:border-r-0`}>
                {col?.label}
              </th>
            ))}
            <th className="w-20 px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors?.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS?.length + 3} className="py-16 text-center">
                <Icon name="Building2" size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No vendors found</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first vendor to get started</p>
              </td>
            </tr>
          ) : (
            vendors?.map((vendor, rowIdx) => {
              const isSelected = selectedRows?.includes(vendor?.id);
              const statusColor = STATUS_COLORS?.[vendor?.status] || STATUS_COLORS?.active;
              return (
                <tr
                  key={vendor?.id}
                  onContextMenu={(e) => handleContextMenu(e, vendor)}
                  className={`border-b border-border transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onRowSelect?.(vendor?.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground text-center">{rowIdx + 1}</td>
                  {COLUMNS?.map((col, colIdx) => (
                    <td
                      key={col?.key}
                      tabIndex={0}
                      onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                      onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                      className={`px-3 py-2 border-r border-border last:border-r-0 cursor-cell outline-none ${
                        selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                          ? 'ring-2 ring-inset ring-primary/40 bg-primary/5' :''
                      }`}
                    >
                      {col?.key === 'status' ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {vendor?.status || 'active'}
                        </span>
                      ) : col?.key === 'credit_limit' || col?.key === 'outstanding_balance' ? (
                        <span className="text-xs font-mono">{formatGHS(vendor?.[col?.key])}</span>
                      ) : (
                        <span className="text-xs text-foreground">{vendor?.[col?.key] || '-'}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onEdit?.(vendor)}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title="Edit vendor"
                    >
                      <Icon name="Edit2" size={13} className="text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ top: contextMenu?.y, left: contextMenu?.x }}
          onClick={(e) => e?.stopPropagation()}
        >
          <button onClick={() => { onEdit?.(contextMenu?.vendor); closeContextMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">
            <Icon name="Edit2" size={14} />
            Edit
          </button>
          <button onClick={() => { onDuplicate?.(contextMenu?.vendor); closeContextMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">
            <Icon name="Copy" size={14} />
            Duplicate
          </button>
          <div className="border-t border-border my-1" />
          <button onClick={() => { onDeactivate?.(contextMenu?.vendor); closeContextMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Icon name="UserX" size={14} />
            Deactivate
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorTable;
