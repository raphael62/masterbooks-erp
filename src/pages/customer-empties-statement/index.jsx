import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useCompanyLocation } from '../../contexts/CompanyLocationContext';
import CustomerEmptiesByTypeModal from './components/CustomerEmptiesByTypeModal';
import CustomerEmptiesTransactionsModal from './components/CustomerEmptiesTransactionsModal';

const DEFAULT_COL_WIDTHS = [48, 90, 90, 80, 120, 110, 90, 90, 90, 90];
const COL_KEYS = ['SEQ', 'PHONE', 'PIC NAME', 'CUSTCODE', 'CUSTOMER NAME', 'OPENING BALANCE', 'EXPECTED', 'SOLD OUT', 'RECEIVED', 'BALANCE'];

const CustomerEmptiesStatement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany } = useCompanyLocation();
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('customer-empties-statement-column-widths');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [...DEFAULT_COL_WIDTHS];
  });
  const [resizingCol, setResizingCol] = useState(null);
  const [layoutSavedMsg, setLayoutSavedMsg] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const saveColumnLayout = useCallback(() => {
    localStorage.setItem('customer-empties-statement-column-widths', JSON.stringify(columnWidths));
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
  const [transactionModal, setTransactionModal] = useState(null);

  // Restore modals when returning from invoice/receipt (e.g. close invoice → back to statement with modals open)
  useEffect(() => {
    const rs = location?.state?.returnState;
    if (rs?.customer) {
      setModalCustomer(rs.customer);
      setTransactionModal(rs.emptiesType != null ? { customer: rs.customer, emptiesType: rs.emptiesType } : null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location?.pathname, location?.state?.returnState, navigate]);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, customer_code, customer_name, business_executive, mobile, status')
      .eq('status', 'Active')
      .order('customer_name');
    setCustomers(data || []);
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!customers?.length) {
      setSummaryRows([]);
      return;
    }
    setIsLoading(true);
    try {
      const customerIds = customers.map(c => c.id).filter(Boolean);
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, customer_id, invoice_date')
        .in('customer_id', customerIds)
        .order('invoice_date', { ascending: true });

      const invIds = (invData || []).map(i => i.id).filter(Boolean);
      let itemsData = [];
      let emptiesData = [];
      let productsData = [];
      if (invIds.length > 0) {
        const [itemsRes, emptiesRes] = await Promise.all([
          supabase.from('sales_invoice_items').select('invoice_id, product_id, ctn_qty, btl_qty, is_returnable').in('invoice_id', invIds),
          supabase.from('sales_invoice_empties').select('invoice_id, empties_type, received_qty, sold_qty').in('invoice_id', invIds),
        ]);
        itemsData = itemsRes?.data || [];
        emptiesData = emptiesRes?.data || [];
        const productIds = [...new Set(itemsData.map(i => i.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const prodRes = await supabase.from('products').select('id, empties_type, is_returnable, product_name, product_code').in('id', productIds);
          productsData = prodRes?.data || [];
        }
      }

      const { data: recHeaders } = await supabase
        .from('empties_receive_header')
        .select('id, customer_id, receive_date')
        .in('customer_id', customerIds);
      const recIds = (recHeaders || []).map(r => r.id).filter(Boolean);
      let recItemsData = [];
      if (recIds.length > 0) {
        const recItemsRes = await supabase.from('empties_receive_items').select('header_id, empties_type, qty').in('header_id', recIds);
        recItemsData = recItemsRes?.data || [];
      }

      const invByCust = {};
      for (const inv of invData || []) {
        if (!inv.customer_id) continue;
        invByCust[inv.customer_id] = invByCust[inv.customer_id] || [];
        invByCust[inv.customer_id].push(inv);
      }
      const recByCust = {};
      for (const h of recHeaders || []) {
        if (!h.customer_id) continue;
        recByCust[h.customer_id] = recByCust[h.customer_id] || [];
        recByCust[h.customer_id].push(h);
      }
      const prodMap = Object.fromEntries((productsData || []).map(p => [p.id, p]));

      const isInRange = (d) => {
        if (!d) return false;
        if (dateFrom && String(d) < String(dateFrom)) return false;
        if (dateTo && String(d) > String(dateTo)) return false;
        return true;
      };
      const isBefore = (d) => d && dateFrom && String(d) < String(dateFrom);
      const isPhysiEmpties = (name, code) => {
        const n = (name || '').toLowerCase();
        const c = (code || '').toLowerCase();
        return n.includes('physi empties') || c.includes('physi empties');
      };

      const byCustomer = {};
      for (const c of customers) {
        byCustomer[c.id] = { openingBal: 0, expected: 0, soldOut: 0, received: 0 };
      }

      for (const inv of invData || []) {
        const cid = inv.customer_id;
        if (!cid || !byCustomer[cid]) continue;
        const d = inv.invoice_date;
        const inRange = isInRange(d);
        const before = isBefore(d);

        const invItems = itemsData.filter(it => it.invoice_id === inv.id);
        let expectedDelta = 0;
        let soldOutDelta = 0;
        for (const it of invItems) {
          const qty = parseFloat(it.ctn_qty) ?? parseFloat(it.btl_qty) ?? 0;
          if (qty === 0) continue;
          const prod = it.product_id ? prodMap[it.product_id] : null;
          const et = prod?.empties_type || 'Other';
          const name = (it.product_name || prod?.product_name || '').toLowerCase();
          const code = (it.product_code || prod?.product_code || '').toLowerCase();
          const isRet = it.is_returnable === true || prod?.is_returnable === true;
          const isEmptiesProduct = name.includes('empties') || code.includes('empties');
          const physiEmpties = isPhysiEmpties(it.product_name || prod?.product_name, it.product_code || prod?.product_code);
          if (physiEmpties) {
            soldOutDelta += qty;
          } else if (isRet && !isEmptiesProduct) {
            expectedDelta += qty;
          } else if (isEmptiesProduct) {
            expectedDelta -= qty;
          }
        }
        if (inRange) {
          byCustomer[cid].expected += expectedDelta;
          byCustomer[cid].soldOut += soldOutDelta;
        }
        if (before) byCustomer[cid].openingBal += expectedDelta - soldOutDelta;

        const invEmpties = emptiesData.filter(e => e.invoice_id === inv.id);
        for (const e of invEmpties) {
          const sold = parseFloat(e.sold_qty) || 0;
          const recv = parseFloat(e.received_qty) || 0;
          if (inRange) byCustomer[cid].received += recv;
          if (before) byCustomer[cid].openingBal -= sold + recv;
        }
      }

      for (const h of recHeaders || []) {
        const cid = h.customer_id;
        if (!cid || !byCustomer[cid]) continue;
        const d = h.receive_date;
        const inRange = isInRange(d);
        const before = isBefore(d);
        const items = recItemsData.filter(i => i.header_id === h.id);
        for (const i of items) {
          const qty = parseFloat(i.qty) || 0;
          if (inRange) byCustomer[cid].received += qty;
          if (before) byCustomer[cid].openingBal -= qty;
        }
      }

      const rows = customers.map((c, i) => {
        const agg = byCustomer[c.id] || { openingBal: 0, expected: 0, soldOut: 0, received: 0 };
        const balance = agg.openingBal + agg.expected - agg.soldOut - agg.received;
        return {
          seq: i + 1,
          customer: c,
          openingBal: agg.openingBal,
          expected: agg.expected,
          soldOut: agg.soldOut,
          received: agg.received,
          balance,
        };
      });
      setSummaryRows(rows);
    } catch (err) {
      console.error('Error fetching customer empties summary:', err);
      setSummaryRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [customers, dateFrom, dateTo]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
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
      localStorage.setItem('customer-empties-statement-column-widths', JSON.stringify(columnWidths));
    }
  }, [resizingCol, columnWidths]);

  const fmtAmt = (v) => {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtNum = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '';
    return n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const grandTotals = summaryRows.reduce(
    (acc, row) => ({
      openingBal: acc.openingBal + (row.openingBal || 0),
      expected: acc.expected + (row.expected || 0),
      soldOut: acc.soldOut + (row.soldOut || 0),
      received: acc.received + (row.received || 0),
      balance: acc.balance + (row.balance || 0),
    }),
    { openingBal: 0, expected: 0, soldOut: 0, received: 0, balance: 0 }
  );

  const companyName = selectedCompany?.name || 'Kwaku Swanzy Ltd';
  const thCls = 'px-3 py-2 text-left text-xs font-semibold bg-primary/10 border border-border';
  const tdCls = 'px-3 py-1.5 text-xs border border-border';

  return (
    <AppLayout activeModule="sales">
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Empties Stmt</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {companyName} — {dateFrom} - {dateTo}
              </p>
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
                onClick={() => { setColumnWidths([...DEFAULT_COL_WIDTHS]); localStorage.removeItem('customer-empties-statement-column-widths'); }}
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
                      className={`${thCls} relative select-none ${i === 0 ? 'text-center' : [5, 6, 7, 8, 9].includes(i) ? 'text-right' : ''} ${label === 'SOLD OUT' ? 'text-primary' : ''}`}
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
                ) : summaryRows.length === 0 ? (
                  <tr><td colSpan={10} className={`${tdCls} py-8 text-center text-muted-foreground`}>No customers found</td></tr>
                ) : (
                  summaryRows.map((row, idx) => (
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
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(row.openingBal)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(row.expected)}</td>
                      <td className={`${tdCls} text-right tabular-nums text-amber-700 dark:text-amber-400 font-medium`}>{fmtNum(row.soldOut)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(row.received)}</td>
                      <td className={`${tdCls} text-right tabular-nums font-medium ${(row.balance || 0) > 0 ? 'text-destructive' : ''}`}>{fmtNum(row.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-primary/20 font-semibold">
                  <td className={`${tdCls}`} colSpan={5}>Grand Total</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(grandTotals.openingBal)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(grandTotals.expected)}</td>
                  <td className={`${tdCls} text-right tabular-nums text-primary font-bold`}>{fmtNum(grandTotals.soldOut)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(grandTotals.received)}</td>
                  <td className={`${tdCls} text-right tabular-nums font-bold`}>{fmtNum(grandTotals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {modalCustomer && (
        <CustomerEmptiesByTypeModal
          customer={modalCustomer}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => { setModalCustomer(null); setTransactionModal(null); }}
          onTypeClick={(emptiesType) => setTransactionModal({ customer: modalCustomer, emptiesType })}
        />
      )}

      {transactionModal && (
        <CustomerEmptiesTransactionsModal
          customer={transactionModal.customer}
          emptiesType={transactionModal.emptiesType}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setTransactionModal(null)}
          onRowClick={(entry) => {
            if (entry?.sales_invoice_id) {
              navigate('/sales-invoice-management', {
                state: {
                  openInvoiceId: entry.sales_invoice_id,
                  returnTo: '/sales/customer-empties-stmt',
                  returnState: { customer: transactionModal.customer, emptiesType: transactionModal.emptiesType },
                },
              });
            } else if (entry?.empties_receive_header_id) {
              navigate('/empties-receive-form', {
                state: {
                  openHeaderId: entry.empties_receive_header_id,
                  returnTo: '/sales/customer-empties-stmt',
                  returnState: { customer: transactionModal.customer, emptiesType: transactionModal.emptiesType },
                },
              });
            }
          }}
        />
      )}
    </AppLayout>
  );
};

export default CustomerEmptiesStatement;
