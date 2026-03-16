import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const CustomerEmptiesByTypeModal = ({ customer, dateFrom, dateTo, onClose, onTypeClick }) => {
  const [typeRows, setTypeRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchByType = useCallback(async () => {
    if (!customer?.id) return;
    setIsLoading(true);
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, invoice_date')
        .eq('customer_id', customer.id)
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
        .select('id, receive_date')
        .eq('customer_id', customer.id);
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

      const byType = {};

      for (const inv of invData || []) {
        const d = inv.invoice_date;
        const inRange = isInRange(d);
        const before = isBefore(d);
        const invItems = itemsData.filter(it => it.invoice_id === inv.id);
        for (const it of invItems) {
          const qty = parseFloat(it.ctn_qty) ?? parseFloat(it.btl_qty) ?? 0;
          if (qty === 0) continue;
          const prod = it.product_id ? prodMap[it.product_id] : null;
          const et = prod?.empties_type || 'Other';
          const name = it.product_name || prod?.product_name || '';
          const code = it.product_code || prod?.product_code || '';
          const isRet = it.is_returnable === true || prod?.is_returnable === true;
          const nameL = name.toLowerCase();
          const codeL = code.toLowerCase();
          const isEmptiesProduct = nameL.includes('empties') || codeL.includes('empties');
          const physiEmpties = isPhysiEmpties(name, code);
          if (!byType[et]) byType[et] = { opening: 0, expected: 0, soldOut: 0, received: 0 };
          if (physiEmpties) {
            if (inRange) byType[et].soldOut += qty;
            if (before) byType[et].opening -= qty;
          } else {
            const delta = isRet && !isEmptiesProduct ? qty : isEmptiesProduct ? -qty : 0;
            if (inRange) byType[et].expected += delta;
            if (before) byType[et].opening += delta;
          }
        }
        const invEmpties = emptiesData.filter(e => e.invoice_id === inv.id);
        for (const e of invEmpties) {
          const et = e?.empties_type || 'Other';
          if (!byType[et]) byType[et] = { opening: 0, expected: 0, soldOut: 0, received: 0 };
          const recv = parseFloat(e.received_qty) || 0;
          const sold = parseFloat(e.sold_qty) || 0;
          if (inRange) byType[et].received += recv;
          if (before) byType[et].opening -= sold + recv;
        }
      }

      for (const h of recHeaders || []) {
        const d = h.receive_date;
        const inRange = isInRange(d);
        const before = isBefore(d);
        const items = recItemsData.filter(i => i.header_id === h.id);
        for (const i of items) {
          const et = i?.empties_type || 'Other';
          if (!byType[et]) byType[et] = { opening: 0, expected: 0, soldOut: 0, received: 0 };
          const qty = parseFloat(i.qty) || 0;
          if (inRange) byType[et].received += qty;
          if (before) byType[et].opening -= qty;
        }
      }

      const rows = Object.entries(byType)
        .filter(([et]) => et && et !== 'Other')
        .map(([emptiesType, agg]) => ({
          emptiesType,
          opening: agg.opening,
          expected: agg.expected,
          soldOut: agg.soldOut,
          received: agg.received,
          balance: agg.opening + agg.expected - agg.soldOut - agg.received,
        }))
        .sort((a, b) => (a.emptiesType || '').localeCompare(b.emptiesType || ''));
      setTypeRows(rows);
    } catch (err) {
      console.error('CustomerEmptiesByTypeModal fetch error:', err);
      setTypeRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [customer?.id, dateFrom, dateTo]);

  useEffect(() => {
    fetchByType();
  }, [fetchByType]);

  const fmtNum = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '';
    return n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };
  const fmtDate = (d) => (d ? String(d).slice(0, 10) : '');

  const totals = typeRows.reduce(
    (acc, r) => ({
      opening: acc.opening + (r.opening || 0),
      expected: acc.expected + (r.expected || 0),
      soldOut: acc.soldOut + (r.soldOut || 0),
      received: acc.received + (r.received || 0),
      balance: acc.balance + (r.balance || 0),
    }),
    { opening: 0, expected: 0, soldOut: 0, received: 0, balance: 0 }
  );

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 bg-primary text-primary-foreground rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {customer.customer_code || ''} — {customer.customer_name || ''}
            </h2>
            <p className="text-xs opacity-90 mt-0.5">
              {fmtDate(dateFrom) || '—'} - {fmtDate(dateTo) || '—'} Empties by Type
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
          Click an empties type to see the transaction details (invoices &amp; receipts) for that type.
        </p>

        <div className="flex-1 overflow-auto px-4 py-2">
          <div className="max-w-[50vw]">
            <table className="w-full text-xs border-collapse border border-border table-fixed">
              <thead>
                <tr className="bg-primary/10">
                  <th className="px-2 py-1.5 text-left font-semibold w-8 border border-border">#</th>
                  <th className="px-2 py-1.5 text-left font-semibold border border-border">EMPTIES TYPE</th>
                  <th className="px-2 py-1.5 text-right font-semibold border border-border">OPENING</th>
                  <th className="px-2 py-1.5 text-right font-semibold border border-border">EXPECTED</th>
                  <th className="px-2 py-1.5 text-right font-semibold border border-border text-primary">SOLD OUT</th>
                  <th className="px-2 py-1.5 text-right font-semibold border border-border">RECEIVED</th>
                  <th className="px-2 py-1.5 text-right font-semibold border border-border">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-2 py-2 border border-border"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                  ))
                ) : typeRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-2 py-8 text-center text-muted-foreground border border-border">No empties types</td></tr>
                ) : (
                  typeRows.map((row, idx) => (
                    <tr
                      key={row.emptiesType}
                      onClick={() => onTypeClick?.(row.emptiesType)}
                      className="hover:bg-primary/5 cursor-pointer border-b border-border/50"
                    >
                      <td className="px-2 py-1.5 text-center text-muted-foreground border border-border">{idx + 1}</td>
                      <td className="px-2 py-1.5 font-medium border border-border">{row.emptiesType}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(row.opening)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(row.expected)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border text-primary font-medium">{fmtNum(row.soldOut)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(row.received)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums font-medium border border-border ${(row.balance || 0) > 0 ? 'text-destructive' : ''}`}>{fmtNum(row.balance)}</td>
                    </tr>
                  ))
                )}
                {typeRows.length > 0 && (
                  <tr className="bg-primary/20 font-semibold">
                    <td colSpan={2} className="px-2 py-1.5 border border-border">TOTALS</td>
                    <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(totals.opening)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(totals.expected)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-primary font-bold border border-border">{fmtNum(totals.soldOut)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtNum(totals.received)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-bold text-destructive border border-border">{fmtNum(totals.balance)}</td>
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
            <span className="text-xs text-muted-foreground">{typeRows.length} types</span>
            <button onClick={onClose} className="h-8 px-4 text-xs font-medium border border-border rounded hover:bg-muted">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEmptiesByTypeModal;
