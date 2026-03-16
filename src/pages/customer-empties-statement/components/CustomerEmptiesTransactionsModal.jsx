import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const CustomerEmptiesTransactionsModal = ({ customer, emptiesType, dateFrom, dateTo, onClose, onRowClick }) => {
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!customer?.id || !emptiesType) return;
    setIsLoading(true);
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, invoice_no, invoice_date')
        .eq('customer_id', customer.id)
        .order('invoice_date', { ascending: true })
        .order('created_at', { ascending: true });

      const invIds = (invData || []).map(i => i.id).filter(Boolean);
      let itemsData = [];
      let emptiesData = [];
      let productsData = [];
      if (invIds.length > 0) {
        const [itemsRes, emptiesRes] = await Promise.all([
          supabase.from('sales_invoice_items').select('invoice_id, product_id, product_name, product_code, ctn_qty, btl_qty, is_returnable').in('invoice_id', invIds),
          supabase.from('sales_invoice_empties').select('invoice_id, empties_type, received_qty, sold_qty').in('invoice_id', invIds),
        ]);
        itemsData = itemsRes?.data || [];
        emptiesData = emptiesRes?.data || [];
        const productIds = [...new Set(itemsData.map(i => i.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const prodRes = await supabase.from('products').select('id, empties_type, is_returnable').in('id', productIds);
          productsData = prodRes?.data || [];
        }
      }

      const { data: recHeaders } = await supabase
        .from('empties_receive_header')
        .select('id, receive_no, receive_date')
        .eq('customer_id', customer.id)
        .order('receive_date', { ascending: true });
      const recIds = (recHeaders || []).map(r => r.id).filter(Boolean);
      let recItemsData = [];
      if (recIds.length > 0) {
        const recItemsRes = await supabase.from('empties_receive_items').select('header_id, empties_type, qty').in('header_id', recIds);
        recItemsData = recItemsRes?.data || [];
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

      let opening = 0;
      const list = [];

      for (const inv of invData || []) {
        const d = inv.invoice_date;
        const invItems = itemsData.filter(it => it.invoice_id === inv.id);
        let expectedDelta = 0;
        let soldOutDelta = 0;
        for (const it of invItems) {
          const prod = it.product_id ? prodMap[it.product_id] : null;
          if ((prod?.empties_type || 'Other') !== emptiesType) continue;
          const qty = parseFloat(it.ctn_qty) ?? parseFloat(it.btl_qty) ?? 0;
          if (qty === 0) continue;
          const name = it.product_name || prod?.product_name || '';
          const code = it.product_code || prod?.product_code || '';
          if (isPhysiEmpties(name, code)) {
            soldOutDelta += qty;
          } else {
            const isRet = it.is_returnable === true || prod?.is_returnable === true;
            if (isRet) expectedDelta += qty;
          }
        }
        const invEmpties = emptiesData.filter(e => e.invoice_id === inv.id && (e.empties_type || 'Other') === emptiesType);
        let sold = 0;
        let recv = 0;
        for (const e of invEmpties) {
          sold += parseFloat(e.sold_qty) || 0;
          recv += parseFloat(e.received_qty) || 0;
        }
        const soldOut = soldOutDelta + sold;
        if (isBefore(d)) {
          opening += expectedDelta - soldOut - recv;
        }
        if (isInRange(d) && (expectedDelta !== 0 || soldOut !== 0 || recv !== 0)) {
          list.push({
            id: `inv-${inv.id}`,
            sales_invoice_id: inv.id,
            empties_receive_header_id: null,
            type: 'Sales Invoice',
            date: d,
            reference: inv.invoice_no,
            description: 'Sales Invoice (Expected + Sold Out)',
            expected: expectedDelta,
            soldOut,
            received: recv,
          });
        }
      }

      for (const h of recHeaders || []) {
        const d = h.receive_date;
        const items = recItemsData.filter(i => i.header_id === h.id && (i.empties_type || 'Other') === emptiesType);
        const recv = items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
        if (isBefore(d)) opening -= recv;
        if (isInRange(d) && recv !== 0) {
          list.push({
            id: `rec-${h.id}`,
            sales_invoice_id: null,
            empties_receive_header_id: h.id,
            type: 'Empties Received',
            date: d,
            reference: h.receive_no,
            description: 'Empties Received',
            expected: 0,
            soldOut: 0,
            received: recv,
          });
        }
      }

      list.sort((a, b) => {
        const da = String(a.date || '');
        const db = String(b.date || '');
        if (da !== db) return da.localeCompare(db);
        return (a.reference || '').localeCompare(b.reference || '');
      });

      let bal = opening;
      const withBalance = list.map(t => {
        bal += (t.expected || 0) - (t.soldOut || 0) - (t.received || 0);
        return { ...t, balance: bal };
      });

      setOpeningBalance(opening);
      setTransactions(withBalance);
    } catch (err) {
      console.error('CustomerEmptiesTransactionsModal fetch error:', err);
      setTransactions([]);
      setOpeningBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [customer?.id, emptiesType, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalExpected = transactions.reduce((s, e) => s + (parseFloat(e.expected) || 0), 0);
  const totalSoldOut = transactions.reduce((s, e) => s + (parseFloat(e.soldOut) || 0), 0);
  const totalReceived = transactions.reduce((s, e) => s + (parseFloat(e.received) || 0), 0);
  const closingBalance = openingBalance + totalExpected - totalSoldOut - totalReceived;

  const fmtNum = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '';
    return n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };
  const fmtDate = (d) => (d ? String(d).slice(0, 10) : '');

  if (!customer || !emptiesType) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 bg-primary text-primary-foreground rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {customer.customer_code || ''} — {customer.customer_name || ''}
            </h2>
            <p className="text-xs opacity-90 mt-0.5">
              {fmtDate(dateFrom) || '—'} ~ {fmtDate(dateTo) || '—'} — {emptiesType} Opening: {fmtNum(openingBalance) || '0'} cartons
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <p className="px-4 py-1 text-xs text-muted-foreground border-b border-border">
          Click a row to open the invoice or empties receipt for editing. Balance = Opening + Expected - Sold Out - Received.
        </p>

        <div className="flex-1 overflow-auto px-4 py-2">
          <div className="max-w-[50vw]">
            <table className="w-full text-xs border-collapse border border-border table-fixed">
              <thead>
                <tr className="bg-primary/10">
                  <th className="px-2 py-1.5 text-left font-semibold w-8 border border-border">#</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-8 border border-border">TYPE</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-[12.5%] border border-border">DATE</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-[12.5%] border border-border">REFERENCE</th>
                  <th className="px-2 py-1.5 text-left font-semibold border border-border">DESCRIPTION</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-[12.5%] border border-border">EXPECTED</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-[12.5%] border border-border text-primary">SOLD OUT</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-[12.5%] border border-border">RECEIVED</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-[12.5%] border border-border">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-muted/20">
                  <td className="px-2 py-1.5 border border-border" />
                  <td className="px-2 py-1.5 border border-border" />
                  <td className="px-2 py-1.5 border border-border" />
                  <td className="px-2 py-1.5 border border-border" />
                  <td className="px-2 py-1.5 font-medium border border-border">Beginning Balance</td>
                  <td className="px-2 py-1.5 text-right tabular-nums border border-border" />
                  <td className="px-2 py-1.5 text-right tabular-nums border border-border text-amber-700 dark:text-amber-400" aria-label="Sold out" />
                  <td className="px-2 py-1.5 text-right tabular-nums border border-border" />
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium border border-border">{fmtNum(openingBalance) || '0'}</td>
                </tr>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={9} className="px-2 py-2 border border-border"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={9} className="px-2 py-8 text-center text-muted-foreground border border-border">No transactions</td></tr>
                ) : (
                  transactions.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      onClick={() => onRowClick?.(entry)}
                      className="hover:bg-primary/5 cursor-pointer border-b border-border/50"
                    >
                      <td className="px-2 py-1.5 text-center text-muted-foreground border border-border">{idx + 1}</td>
                      <td className="px-2 py-1.5 border border-border">
                        {entry.type === 'Empties Received' ? (
                          <Icon name="RefreshCw" size={14} className="text-muted-foreground inline" />
                        ) : (
                          <Icon name="FileText" size={14} className="text-muted-foreground inline" />
                        )}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums border border-border">{fmtDate(entry.date)}</td>
                      <td className="px-2 py-1.5 font-mono border border-border">{entry.reference || '—'}</td>
                      <td className="px-2 py-1.5 border border-border">{entry.description || '—'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(entry.expected)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border text-primary font-medium">{fmtNum(entry.soldOut)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(entry.received)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-medium border border-border">{fmtNum(entry.balance)}</td>
                    </tr>
                  ))
                )}
                {transactions.length > 0 && (
                  <tr className="bg-primary/20 font-semibold">
                    <td colSpan={5} className="px-2 py-1.5 text-xs border border-border">TOTALS</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-xs border border-border">{fmtNum(totalExpected)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-xs border border-border text-primary font-bold">{fmtNum(totalSoldOut)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-xs border border-border">{fmtNum(totalReceived)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-xs font-bold border border-border">{fmtNum(closingBalance)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-border flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1.5">
              <Icon name="Printer" size={14} /> Print
            </button>
            <button className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted flex items-center gap-1.5">
              <Icon name="Mail" size={14} /> Email
            </button>
            <button className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted flex items-center gap-1.5">
              <Icon name="FileSpreadsheet" size={14} /> Excel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{transactions.length} transactions</span>
            <button onClick={onClose} className="h-8 px-4 text-xs font-medium border border-border rounded hover:bg-muted">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEmptiesTransactionsModal;
