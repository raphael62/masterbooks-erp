import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import SupplierStatementModal from './components/SupplierStatementModal';

const DEFAULT_COL_WIDTHS = [48, 90, 90, 80, 120, 110, 110, 90, 110, 110];
const COL_KEYS = ['SEQ', 'PHONE', 'CONTACT', 'SUPPLIERCODE', 'SUPPLIER NAME', 'OPENING BAL', 'PURCHASE VALUE', 'PAYMENT', 'OUTSTANDING', 'BALANCE'];

const SupplierStatement = () => {
  const navigate = useNavigate();
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('supplier-statement-column-widths');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [...DEFAULT_COL_WIDTHS];
  });
  const [resizingCol, setResizingCol] = useState(null);
  const [layoutSavedMsg, setLayoutSavedMsg] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const saveColumnLayout = useCallback(() => {
    localStorage.setItem('supplier-statement-column-widths', JSON.stringify(columnWidths));
    setLayoutSavedMsg(true);
    setTimeout(() => setLayoutSavedMsg(false), 2000);
  }, [columnWidths]);

  const [suppliers, setSuppliers] = useState([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d?.setMonth(d?.getMonth() - 1);
    return d?.toISOString()?.split('T')?.[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date()?.toISOString()?.split('T')?.[0]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalSupplier, setModalSupplier] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    const { data } = await supabase
      ?.from('vendors')
      ?.select('id, vendor_code, vendor_name, contact_person, phone')
      ?.order('vendor_name');
    setSuppliers(data || []);
  }, []);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: ledgerData } = await supabase
        ?.from('supplier_ledger')
        ?.select('supplier_id, transaction_date, transaction_type, debit_amount, credit_amount')
        ?.order('transaction_date', { ascending: true });

      const bySupplier = {};
      for (const e of ledgerData || []) {
        const sid = e?.supplier_id;
        if (!sid) continue;
        if (!bySupplier[sid]) bySupplier[sid] = { debits: 0, credits: 0, purchaseValue: 0, opening: 0 };
        const d = e?.transaction_date;
        const debit = parseFloat(e?.debit_amount) || 0;
        const credit = parseFloat(e?.credit_amount) || 0;
        const isProducts = e?.transaction_type === 'purchase_invoice';
        if (dateFrom && d && String(d) < String(dateFrom)) {
          bySupplier[sid].opening += debit - credit;
        } else if ((!dateFrom || !d || String(d) >= String(dateFrom)) && (!dateTo || !d || String(d) <= String(dateTo))) {
          bySupplier[sid].debits += debit;
          bySupplier[sid].credits += credit;
          if (isProducts) bySupplier[sid].purchaseValue += debit;
        }
      }

      const vendorMap = Object.fromEntries((suppliers || []).map(v => [v?.id, v]));
      const rows = (suppliers || []).map((v, i) => {
        const agg = bySupplier[v?.id] || { debits: 0, credits: 0, purchaseValue: 0, opening: 0 };
        const purchaseValue = agg.purchaseValue;
        const payment = agg.credits;
        const balance = agg.opening + purchaseValue - payment;
        return {
          seq: i + 1,
          supplier: v,
          openingBal: agg.opening,
          purchaseValue,
          payment,
          outstanding: balance,
          balance,
        };
      });
      setSummaryRows(rows);
    } catch (err) {
      console.error('Error fetching supplier summary:', err);
      setSummaryRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [suppliers, dateFrom, dateTo]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleResizeStart = (colIdx, e) => {
    e.preventDefault();
    setResizingCol(colIdx);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[colIdx];
  };

  useEffect(() => {
    if (resizingCol === null) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const minW = 40;
      setColumnWidths(prev => {
        const next = [...prev];
        next[resizingCol] = Math.max(minW, startWidthRef.current + dx);
        return next;
      });
    };
    const handleUp = () => setResizingCol(null);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingCol]);

  useEffect(() => {
    if (resizingCol === null) {
      localStorage.setItem('supplier-statement-column-widths', JSON.stringify(columnWidths));
    }
  }, [resizingCol, columnWidths]);

  const fmtAmt = (v) => {
    const n = parseFloat(v) || 0;
    return n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const grandTotals = summaryRows.reduce(
    (acc, row) => ({
      openingBal: acc.openingBal + (row?.openingBal || 0),
      purchaseValue: acc.purchaseValue + (row?.purchaseValue || 0),
      payment: acc.payment + (row?.payment || 0),
      outstanding: acc.outstanding + (row?.outstanding || 0),
      balance: acc.balance + (row?.balance || 0),
    }),
    { openingBal: 0, purchaseValue: 0, payment: 0, outstanding: 0, balance: 0 }
  );

  const thCls = 'px-3 py-2 text-left text-xs font-semibold bg-primary/10 border border-border';
  const tdCls = 'px-3 py-1.5 text-xs border border-border';

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Supplier Statement</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Supplier ledger summary — click a row to view detailed statement</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveColumnLayout}
                className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent"
              >
                Save layout
              </button>
              {layoutSavedMsg && <span className="text-xs text-emerald-600">Saved</span>}
              <button
                onClick={() => { setColumnWidths([...DEFAULT_COL_WIDTHS]); localStorage.removeItem('supplier-statement-column-widths'); }}
                className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent"
              >
                Reset columns
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-3 flex-shrink-0">
          <div className="flex flex-wrap items-end gap-3 p-3 bg-card border border-border rounded-lg">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">Date From</label>
              <input
                type="date"
                className="h-7 px-2 text-xs border border-border rounded bg-background text-foreground"
                value={dateFrom}
                onChange={e => setDateFrom(e?.target?.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">Date To</label>
              <input
                type="date"
                className="h-7 px-2 text-xs border border-border rounded bg-background text-foreground"
                value={dateTo}
                onChange={e => setDateTo(e?.target?.value)}
              />
            </div>
            <button
              onClick={fetchSummary}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              <Icon name="RefreshCw" size={13} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="bg-card border border-border rounded-lg overflow-auto max-w-[50vw]">
            <table className="text-xs border-collapse border border-border" style={{ tableLayout: 'fixed', width: columnWidths.reduce((a, b) => a + b, 0) }}>
              <colgroup>
                {columnWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
              </colgroup>
              <thead>
                <tr>
                  {COL_KEYS.map((label, i) => (
                    <th
                      key={i}
                      className={`${thCls} relative select-none ${i === 0 ? 'text-center' : [5, 6, 7, 8, 9].includes(i) ? 'text-right' : ''}`}
                      style={{ width: columnWidths[i], minWidth: 40 }}
                    >
                      {label}
                      <div
                        onMouseDown={e => handleResizeStart(i, e)}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30"
                        style={{ touchAction: 'none' }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10} className={tdCls}><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    </tr>
                  ))
                ) : summaryRows?.length === 0 ? (
                  <tr><td colSpan={10} className={`${tdCls} py-8 text-center text-muted-foreground`}>No suppliers found</td></tr>
                ) : (
                  summaryRows?.map((row, idx) => (
                    <tr
                      key={row?.supplier?.id}
                      onClick={() => setModalSupplier(row?.supplier)}
                      className={`cursor-pointer hover:bg-primary/5 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    >
                      <td className={`${tdCls} text-center`}>{row?.seq}</td>
                      <td className={tdCls}>{row?.supplier?.phone || ''}</td>
                      <td className={tdCls}>{row?.supplier?.contact_person || ''}</td>
                      <td className={`${tdCls} font-mono`}>{row?.supplier?.vendor_code || ''}</td>
                      <td className={tdCls}>{row?.supplier?.vendor_name || ''}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row?.openingBal)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row?.purchaseValue)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row?.payment)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row?.outstanding)}</td>
                      <td className={`${tdCls} text-right tabular-nums font-medium`}>{fmtAmt(row?.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-primary/20 font-semibold">
                  <td className={`${tdCls}`} colSpan={5}>Grand Total</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.openingBal)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.purchaseValue)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.payment)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.outstanding)}</td>
                  <td className={`${tdCls} text-right tabular-nums font-bold`}>{fmtAmt(grandTotals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {modalSupplier && (
        <SupplierStatementModal
          supplier={modalSupplier}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setModalSupplier(null)}
          onRowClick={(entry) => {
            if (entry?.purchase_invoice_id) {
              setModalSupplier(null);
              navigate('/purchase-invoice-management', { state: { openInvoiceId: entry.purchase_invoice_id, returnTo: '/supplier-statement' } });
            }
          }}
        />
      )}
    </AppLayout>
  );
};

export default SupplierStatement;
