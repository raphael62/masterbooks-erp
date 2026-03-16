import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useCompanyLocation } from '../../contexts/CompanyLocationContext';
import CustomerStatementModal from './components/CustomerStatementModal';

const DEFAULT_COL_WIDTHS = [48, 90, 90, 80, 120, 110, 110, 90, 110, 110];
const COL_KEYS = ['SEQ', 'PHONE', 'PIC NAME', 'CUSTCODE', 'CUSTOMER NAME', 'OPENING BALANCE', 'SALES VALUE', 'PAYMENT', 'OUTSTANDING', 'BALANCE'];

const CustomerStatement = () => {
  const navigate = useNavigate();
  const { selectedCompany } = useCompanyLocation();
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('customer-statement-column-widths');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [...DEFAULT_COL_WIDTHS];
  });
  const [resizingCol, setResizingCol] = useState(null);
  const [layoutSavedMsg, setLayoutSavedMsg] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const saveColumnLayout = useCallback(() => {
    localStorage.setItem('customer-statement-column-widths', JSON.stringify(columnWidths));
    setLayoutSavedMsg(true);
    setTimeout(() => setLayoutSavedMsg(false), 2000);
  }, [columnWidths]);
  const [customers, setCustomers] = useState([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(0);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, customer_code, customer_name, business_executive, mobile, status')
      .eq('status', 'Active')
      .order('customer_name');
    setCustomers(data || []);
  }, []);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, customer_id, invoice_date, total_tax_inc_value')
        .order('invoice_date', { ascending: true });

      const byCustomer = {};
      for (const inv of invData || []) {
        const cid = inv.customer_id;
        if (!cid) continue;
        if (!byCustomer[cid]) byCustomer[cid] = { opening: 0, salesValue: 0, payment: 0 };
        const d = inv.invoice_date;
        const amt = parseFloat(inv.total_tax_inc_value) || 0;
        if (dateFrom && d && String(d) < String(dateFrom)) {
          byCustomer[cid].opening += amt;
        } else if ((!dateFrom || !d || String(d) >= String(dateFrom)) && (!dateTo || !d || String(d) <= String(dateTo))) {
          byCustomer[cid].salesValue += amt;
        }
      }

      const custMap = Object.fromEntries((customers || []).map(c => [c.id, c]));
      const rows = (customers || []).map((c, i) => {
        const agg = byCustomer[c.id] || { opening: 0, salesValue: 0, payment: 0 };
        const outstanding = agg.salesValue - agg.payment;
        const balance = agg.opening + agg.salesValue - agg.payment;
        return {
          seq: i + 1,
          customer: c,
          openingBal: agg.opening,
          salesValue: agg.salesValue,
          payment: agg.payment,
          outstanding,
          balance,
        };
      });
      setSummaryRows(rows);
    } catch (err) {
      console.error('Error fetching customer summary:', err);
      setSummaryRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [customers, dateFrom, dateTo]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const fmtAmt = (v) => {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
    const handleUp = () => {
      setResizingCol(null);
    };
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
      localStorage.setItem('customer-statement-column-widths', JSON.stringify(columnWidths));
    }
  }, [resizingCol, columnWidths]);

  const companyName = selectedCompany?.name || 'Kwaku Swanzy Ltd';

  const getSortValue = (row, colIdx) => {
    switch (colIdx) {
      case 0: return row.seq;
      case 1: return (row.customer?.mobile || '').toLowerCase();
      case 2: return (row.customer?.business_executive || '').toLowerCase();
      case 3: return (row.customer?.customer_code || '').toLowerCase();
      case 4: return (row.customer?.customer_name || '').toLowerCase();
      case 5: return parseFloat(row.openingBal) || 0;
      case 6: return parseFloat(row.salesValue) || 0;
      case 7: return parseFloat(row.payment) || 0;
      case 8: return parseFloat(row.outstanding) || 0;
      case 9: return parseFloat(row.balance) || 0;
      default: return null;
    }
  };

  const sortedRows = useMemo(() => {
    if (sortConfig.key == null) return summaryRows;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    return [...summaryRows].sort((a, b) => {
      const va = getSortValue(a, sortConfig.key);
      const vb = getSortValue(b, sortConfig.key);
      if (va === vb) return 0;
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return dir * (cmp < 0 ? -1 : 1);
    });
  }, [summaryRows, sortConfig.key, sortConfig.direction]);

  const handleSort = (colIdx) => {
    setSortConfig(prev =>
      prev.key === colIdx && prev.direction === 'asc'
        ? { key: colIdx, direction: 'desc' }
        : prev.key === colIdx && prev.direction === 'desc'
          ? { key: null, direction: 'asc' }
          : { key: colIdx, direction: 'asc' }
    );
  };

  const grandTotals = summaryRows.reduce(
    (acc, row) => ({
      openingBal: acc.openingBal + (row.openingBal || 0),
      salesValue: acc.salesValue + (row.salesValue || 0),
      payment: acc.payment + (row.payment || 0),
      outstanding: acc.outstanding + (row.outstanding || 0),
      balance: acc.balance + (row.balance || 0),
    }),
    { openingBal: 0, salesValue: 0, payment: 0, outstanding: 0, balance: 0 }
  );

  const thCls = 'px-3 py-2 text-left text-xs font-semibold bg-primary/10 border border-border';
  const tdCls = 'px-3 py-1.5 text-xs border border-border';

  return (
    <AppLayout activeModule="sales">
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Statement</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {companyName} — {dateFrom} - {dateTo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(s => !s)}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent"
              >
                <Icon name="Search" size={14} />
                Search (F3)
              </button>
              <button
                onClick={saveColumnLayout}
                className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent"
              >
                Save layout
              </button>
              {layoutSavedMsg && <span className="text-xs text-emerald-600">Saved</span>}
              <button
                onClick={() => { setColumnWidths([...DEFAULT_COL_WIDTHS]); localStorage.removeItem('customer-statement-column-widths'); }}
                className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent"
              >
                Reset columns
              </button>
              <button className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent">
                Option
              </button>
              <button className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-accent">
                Help
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
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">Date To</label>
              <input
                type="date"
                className="h-7 px-2 text-xs border border-border rounded bg-background text-foreground"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
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
                      role="button"
                      tabIndex={0}
                      onClick={e => { if (!e?.target?.closest?.('[data-resize]')) handleSort(i); }}
                      onKeyDown={e => { if (e?.key === 'Enter' || e?.key === ' ') { e.preventDefault(); handleSort(i); } }}
                      className={`${thCls} relative select-none cursor-pointer hover:bg-primary/20 ${i === 0 ? 'text-center' : [5, 6, 7, 8, 9].includes(i) ? 'text-right' : ''}`}
                      style={{ width: columnWidths[i], minWidth: 40 }}
                    >
                      {label}
                      <div
                        data-resize
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
                ) : summaryRows.length === 0 ? (
                  <tr><td colSpan={10} className={`${tdCls} py-8 text-center text-muted-foreground`}>No customers found</td></tr>
                ) : (
                  sortedRows.map((row, idx) => (
                    <tr
                      key={row.customer?.id}
                      onClick={() => setModalCustomer(row.customer)}
                      className={`cursor-pointer hover:bg-primary/5 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    >
                      <td className={`${tdCls} text-center`}>{row.seq}</td>
                      <td className={tdCls}>{row.customer?.mobile || ''}</td>
                      <td className={tdCls}>{row.customer?.business_executive || ''}</td>
                      <td className={`${tdCls} font-mono`}>{row.customer?.customer_code || ''}</td>
                      <td className={tdCls}>{row.customer?.customer_name || ''}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row.openingBal)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row.salesValue)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row.payment)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(row.outstanding)}</td>
                      <td className={`${tdCls} text-right tabular-nums font-medium`}>{fmtAmt(row.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-primary/20 font-semibold">
                  <td className={`${tdCls}`} colSpan={5}>Grand Total</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.openingBal)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.salesValue)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.payment)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(grandTotals.outstanding)}</td>
                  <td className={`${tdCls} text-right tabular-nums font-bold`}>{fmtAmt(grandTotals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {modalCustomer && (
        <CustomerStatementModal
          customer={modalCustomer}
          companyName={companyName}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setModalCustomer(null)}
          onRowClick={(entry) => {
            if (entry?.sales_invoice_id) {
              setModalCustomer(null);
              navigate('/sales-invoice-management', { state: { openInvoiceId: entry.sales_invoice_id, returnTo: '/customer-statement' } });
            }
          }}
        />
      )}
    </AppLayout>
  );
};

export default CustomerStatement;
