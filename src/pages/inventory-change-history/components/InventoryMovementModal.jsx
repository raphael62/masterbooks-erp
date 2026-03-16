import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const REMARK_STYLE = {
  receipt: 'bg-success/15 text-success border-success/30',
  purchase_invoice: 'bg-success/15 text-success border-success/30',
  sales_dispatch: 'bg-warning/15 text-warning border-warning/30',
  issue: 'bg-warning/15 text-warning border-warning/30',
  sale: 'bg-warning/15 text-warning border-warning/30',
  transfer: 'bg-primary/15 text-primary border-primary/30',
  adjustment: 'bg-muted text-foreground border-border',
  breakage: 'bg-destructive/15 text-destructive border-destructive/30',
};

const REMARK_LABEL = {
  receipt: 'Purchase',
  purchase_invoice: 'Purchase',
  sales_dispatch: 'Sale',
  issue: 'Sale',
  sale: 'Sale',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
  breakage: 'Breakage',
};

const InventoryMovementModal = ({ isOpen, onClose, item, dateFrom, dateTo, movements = [], breakages = [] }) => {
  const rows = useMemo(() => {
    const openingBalance = item?.openingQty ?? 0;
    const list = [];
    let balance = openingBalance;
    list.push({ type: 'beginning', date: dateFrom, party: '', remark: 'Beginning Inventory', increase: null, releaseQty: null, balance: openingBalance });

    const breakageRows = (breakages || []).map(b => ({
      _breakage: true,
      date: b.movement_date || dateFrom,
      party: b.reason || 'Breakage (purchase invoice)',
      remark: b.reference_no ? `Breakage ${b.reference_no}` : 'Breakage',
      quantity: -Math.abs(Number(b.breakages_btl) || 0),
    }));
    const combined = [
      ...(movements || []).map(m => ({ ...m, _breakage: false, quantity: Number(m.quantity) || 0 })),
      ...breakageRows.map(r => ({ movement_date: r.date, reason: r.party, reference_no: r.remark?.replace(/^Breakage /, '') || '', transaction_type: 'breakage', _breakage: true, quantity: r.quantity })),
    ].sort((a, b) => (a.movement_date || a.date || '').localeCompare(b.movement_date || b.date || ''));

    for (const m of combined) {
      const qty = Number(m.quantity) || 0;
      balance += qty;
      const type = (m.transaction_type || m.movement_type || '').toLowerCase();
      const isBreakage = m._breakage || (m.reason || '').toLowerCase().includes('breakage') || (m.reference_no || '').toLowerCase().includes('breakage');
      const remarkType = isBreakage ? 'breakage' : type;
      const label = REMARK_LABEL[remarkType] || type || 'Movement';
      const ref = m.reference_no || m.reference || '';
      list.push({
        type: 'movement',
        date: m.movement_date || m.date || m.created_at?.slice(0, 10),
        party: m.reason || m.location || '',
        remark: ref ? `${label} ${ref}` : label,
        remarkType,
        increase: qty > 0 ? qty : null,
        releaseQty: qty < 0 ? Math.abs(qty) : null,
        balance,
      });
    }
    return list;
  }, [item, movements, breakages, dateFrom]);

  if (!isOpen) return null;

  const code = item?.product_code || item?.itemCode || '';
  const name = item?.product_name || item?.productName || '';
  const label = [code, name].filter(Boolean).join(' \u2014 ') || '\u2014';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/50 rounded-t-xl">
          <h2 className="text-sm font-semibold text-foreground">Inv. Book</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="px-5 py-2 border-b border-border">
          <p className="text-xs font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Period: {dateFrom} to {dateTo}</p>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-success/10">
                <th className="text-left px-2 py-2 font-medium text-foreground w-24">Date</th>
                <th className="text-left px-2 py-2 font-medium text-foreground">Customer / Vendor</th>
                <th className="text-left px-2 py-2 font-medium text-foreground w-48">Remark</th>
                <th className="text-right px-2 py-2 font-medium text-foreground w-24">Increase</th>
                <th className="text-right px-2 py-2 font-medium text-foreground w-24">Release Qty</th>
                <th className="text-right px-2 py-2 font-medium text-foreground w-24">Inventory Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="px-2 py-1.5 text-muted-foreground">{row.date}</td>
                  <td className="px-2 py-1.5 text-foreground">{row.party || '—'}</td>
                  <td className="px-2 py-1.5">
                    {row.type === 'beginning' ? (
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Icon name="Info" size={12} />
                        Beginning Inventory
                      </span>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${REMARK_STYLE[row.remarkType] || 'bg-muted'}`}>
                        {row.remark}
                      </span>
                    )}
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${row.increase != null && row.increase < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {row.increase != null ? row.increase.toLocaleString('en-GB') : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-destructive">
                    {row.releaseQty != null ? row.releaseQty.toLocaleString('en-GB') : '—'}
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${row.balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {row.balance.toLocaleString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex-shrink-0 px-5 py-3 border-t border-border flex justify-end">
          <button type="button" onClick={onClose} className="h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryMovementModal;
