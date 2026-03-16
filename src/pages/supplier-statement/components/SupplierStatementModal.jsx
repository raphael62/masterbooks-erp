import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const TYPE_LABELS = {
  purchase_invoice: 'Purchase Invoice',
  empties_invoice: 'Empties Invoice',
  empties_dispatch: 'Empties Dispatch',
  empties_credit_note: 'Empties Refund',
  empties_purchase_invoice: 'Empties Purchase Invoice',
  payment: 'Payment',
  credit_note: 'Credit Note',
  debit_note: 'Debit Note',
  adjustment: 'Adjustment',
};

const PRODUCT_TYPES = ['purchase_invoice', 'payment', 'credit_note', 'debit_note', 'adjustment'];
const EMPTIES_TYPES = ['empties_invoice', 'empties_dispatch', 'empties_credit_note', 'empties_purchase_invoice'];

const SupplierStatementModal = ({ supplier, dateFrom, dateTo, onClose, onRowClick }) => {
  const [filter, setFilter] = useState('all');
  const [beforePeriod, setBeforePeriod] = useState([]);
  const [inPeriod, setInPeriod] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatement = useCallback(async () => {
    if (!supplier?.id) return;
    setIsLoading(true);
    try {
      const { data: allData } = await supabase
        ?.from('supplier_ledger')
        ?.select('*')
        ?.eq('supplier_id', supplier.id)
        ?.order('transaction_date', { ascending: true })
        ?.order('created_at', { ascending: true });

      const entries = allData || [];
      const piIds = [...new Set(entries.map(e => e?.purchase_invoice_id).filter(Boolean))];
      let piMap = {};
      if (piIds.length > 0) {
        const { data: piData } = await supabase
          ?.from('purchase_invoices')
          ?.select('id, supplier_inv_no, empties_inv_no, po_number')
          ?.in('id', piIds);
        piMap = Object.fromEntries((piData || []).map(p => [p?.id, p]));
      }
      const enriched = entries
        .filter(e => {
          const d = parseFloat(e?.debit_amount) || 0;
          const c = parseFloat(e?.credit_amount) || 0;
          if (e?.transaction_type === 'empties_dispatch') return true;
          return d !== 0 || c !== 0;
        })
        .map(e => {
          const pi = e?.purchase_invoice_id ? piMap[e.purchase_invoice_id] : null;
          let invNo;
          if (e?.transaction_type === 'empties_invoice') {
            invNo = pi?.empties_inv_no || e?.reference_no || '';
          } else if (e?.transaction_type === 'empties_dispatch') {
            invNo = e?.reference_no || '';
          } else if (e?.transaction_type === 'empties_purchase_invoice') {
            const base = pi?.supplier_inv_no || pi?.empties_inv_no || e?.reference_no || '';
            invNo = base ? `${base} (Empties)` : '';
          } else {
            invNo = pi?.supplier_inv_no || pi?.empties_inv_no || e?.reference_no || '';
          }
          const poNumber = pi?.po_number || '';
          return { ...e, _supplier_inv_no: invNo, _po_number: poNumber };
        });

      const before = enriched.filter(e => {
        const d = e?.transaction_date;
        return d && dateFrom && String(d) < String(dateFrom);
      });
      const inRange = enriched.filter(e => {
        const d = e?.transaction_date;
        if (!d) return false;
        if (dateFrom && String(d) < String(dateFrom)) return false;
        if (dateTo && String(d) > String(dateTo)) return false;
        return true;
      });
      setBeforePeriod(before);
      setInPeriod(inRange);
    } catch (err) {
      console.error('SupplierStatementModal fetch error:', err);
      setBeforePeriod([]);
      setInPeriod([]);
    } finally {
      setIsLoading(false);
    }
  }, [supplier?.id, dateFrom, dateTo]);

  useEffect(() => { fetchStatement(); }, [fetchStatement]);

  const { filtered, openingBalance, closingBalance } = React.useMemo(() => {
    const filterEntries = (entries) => {
      if (filter === 'all') return entries;
      if (filter === 'products') return entries.filter(e => PRODUCT_TYPES.includes(e?.transaction_type));
      if (filter === 'empties') return entries.filter(e => EMPTIES_TYPES.includes(e?.transaction_type));
      return entries;
    };
    const beforeFiltered = filterEntries(beforePeriod);
    const inFiltered = filterEntries(inPeriod);
    let opening = 0;
    for (const e of beforeFiltered) {
      opening += (parseFloat(e?.debit_amount) || 0) - (parseFloat(e?.credit_amount) || 0);
    }
    let bal = opening;
    const list = inFiltered.map(e => {
      bal += (parseFloat(e?.debit_amount) || 0) - (parseFloat(e?.credit_amount) || 0);
      return { ...e, running_balance: bal };
    });
    const totalDebits = list?.reduce((s, e) => s + (parseFloat(e?.debit_amount) || 0), 0);
    const totalCredits = list?.reduce((s, e) => s + (parseFloat(e?.credit_amount) || 0), 0);
    const closing = opening + totalDebits - totalCredits;
    return { filtered: list, openingBalance: opening, closingBalance: closing };
  }, [beforePeriod, inPeriod, filter]);

  const totalDebits = filtered?.reduce((s, e) => s + (parseFloat(e?.debit_amount) || 0), 0);
  const totalCredits = filtered?.reduce((s, e) => s + (parseFloat(e?.credit_amount) || 0), 0);

  const fmtAmt = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '';
    return n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtDate = (d) => d ? String(d).slice(0, 10) : '';
  const fmtGhs = (v) => {
    const n = parseFloat(v) || 0;
    return `GHC ${n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => window.print();
  const handleEmail = () => { /* TODO */ };
  const handleExcel = () => { /* TODO */ };

  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {supplier?.vendor_code || ''} - {supplier?.vendor_name || ''}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDate(dateFrom) || '—'} - {fmtDate(dateTo) || '—'} &nbsp;
              Opening ({filter === 'all' ? 'All' : filter === 'products' ? 'Products' : 'Empties'}): {fmtGhs(openingBalance)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <p className="px-4 py-1 text-xs text-muted-foreground border-b border-border">
          Click an invoice or payment row to open it for editing.
        </p>

        <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 border-b border-border">
          {['all', 'products', 'empties'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'products' ? 'Products' : 'Empties'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto px-4 py-2">
          <table className="w-full text-xs border-collapse" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="bg-primary/10 border-b border-border">
                <th className="px-2 py-1.5 text-left font-semibold w-8">#</th>
                <th className="px-2 py-1.5 text-left font-semibold w-8">TYPE</th>
                <th className="px-2 py-1.5 text-left font-semibold w-24">DATE</th>
                <th className="px-2 py-1.5 text-left font-semibold w-28">Invoice No.</th>
                <th className="px-2 py-1.5 text-left font-semibold w-24">PO Number</th>
                <th className="px-2 py-1.5 text-left font-semibold">DESCRIPTION</th>
                <th className="px-2 py-1.5 text-right font-semibold w-28">DEBIT (PURCHASES)</th>
                <th className="px-2 py-1.5 text-right font-semibold w-24">CREDIT</th>
                <th className="px-2 py-1.5 text-right font-semibold w-28">BALANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 bg-muted/20">
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5 font-medium">Beginning Balance</td>
                <td className="px-2 py-1.5 text-right tabular-nums" />
                <td className="px-2 py-1.5 text-right tabular-nums" />
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">{fmtAmt(openingBalance) || '0.00'}</td>
              </tr>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-2 py-2"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={9} className="px-2 py-8 text-center text-muted-foreground">No transactions</td></tr>
              ) : (
                filtered?.map((entry, idx) => (
                  <tr
                    key={entry?.id}
                    onClick={() => onRowClick?.(entry)}
                    className="border-b border-border/50 hover:bg-primary/5 cursor-pointer"
                  >
                    <td className="px-2 py-1.5 text-center text-muted-foreground">{idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <Icon name="FileText" size={14} className="text-muted-foreground" />
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtDate(entry?.transaction_date)}</td>
                    <td className="px-2 py-1.5 font-mono">{entry?._supplier_inv_no || '—'}</td>
                    <td className="px-2 py-1.5 font-mono">{entry?._po_number || '—'}</td>
                    <td className="px-2 py-1.5">{entry?.description || TYPE_LABELS?.[entry?.transaction_type] || entry?.transaction_type || '—'}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmtAmt(entry?.debit_amount)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-600">{fmtAmt(entry?.credit_amount)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium">{fmtAmt(entry?.running_balance)}</td>
                  </tr>
                ))
              )}
              {filtered?.length > 0 && (
                <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
                  <td colSpan={6} className="px-2 py-1.5 text-xs">TOTALS</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-xs">{fmtAmt(totalDebits)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-xs text-emerald-600">{fmtAmt(totalCredits)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-xs font-bold">{fmtAmt(closingBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-border flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button onClick={handlePrint} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Print
            </button>
            <button onClick={handleEmail} className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted">
              Email
            </button>
            <button onClick={handleExcel} className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted">
              Excel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered?.length || 0} transactions</span>
            <button onClick={onClose} className="h-8 px-4 text-xs font-medium border border-border rounded hover:bg-muted">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatementModal;
