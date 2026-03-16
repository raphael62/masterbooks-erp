import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';

const CustomerStatementModal = ({ customer, companyName, dateFrom, dateTo, onClose, onRowClick }) => {
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatement = useCallback(async () => {
    if (!customer?.id) return;
    setIsLoading(true);
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, invoice_no, invoice_date, total_tax_inc_value')
        .eq('customer_id', customer.id)
        .order('invoice_date', { ascending: true })
        .order('created_at', { ascending: true });

      const inRange = (invData || []).filter(inv => {
        const d = inv.invoice_date;
        if (!d) return false;
        if (dateFrom && String(d) < String(dateFrom)) return false;
        if (dateTo && String(d) > String(dateTo)) return false;
        return true;
      });

      let opening = 0;
      for (const inv of invData || []) {
        const d = inv.invoice_date;
        if (d && dateFrom && String(d) < String(dateFrom)) {
          opening += parseFloat(inv.total_tax_inc_value) || 0;
        }
      }

      let bal = opening;
      const list = inRange.map(inv => {
        const debit = parseFloat(inv.total_tax_inc_value) || 0;
        bal += debit;
        return {
          id: inv.id,
          sales_invoice_id: inv.id,
          type: 'Sales Invoice',
          date: inv.invoice_date,
          reference: inv.invoice_no,
          description: 'Sales Invoice',
          debit,
          credit: 0,
          balance: bal,
        };
      });

      setOpeningBalance(opening);
      setTransactions(list);
    } catch (err) {
      console.error('CustomerStatementModal fetch error:', err);
      setTransactions([]);
      setOpeningBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [customer?.id, dateFrom, dateTo]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const totalDebits = transactions.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0);
  const totalCredits = transactions.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0);
  const closingBalance = openingBalance + totalDebits - totalCredits;

  const fmtAmt = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '';
    return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtDate = (d) => (d ? String(d).slice(0, 10) : '');
  const fmtGhs = (v) => {
    const n = parseFloat(v) || 0;
    return `GH₵ ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => window.print();
  const handleEmail = () => { /* TODO */ };
  const handleExcel = () => {
    const headers = ['#', 'TYPE', 'DATE', 'REFERENCE', 'DESCRIPTION', 'DEBIT (SALES)', 'CREDIT', 'BALANCE'];
    const rows = [
      ['', '', '', '', 'Beginning Balance', '', '', fmtAmt(openingBalance) || '0.00'],
      ...transactions.map((e, i) => [
        i + 1,
        e.type,
        fmtDate(e.date),
        e.reference,
        e.description,
        fmtAmt(e.debit),
        fmtAmt(e.credit),
        fmtAmt(e.balance),
      ]),
      ['', '', '', '', 'TOTALS', fmtAmt(totalDebits), fmtAmt(totalCredits), fmtAmt(closingBalance)],
    ];
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-statement-${customer?.customer_code || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 bg-primary text-primary-foreground rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {customer.customer_code || ''} — {customer.customer_name || ''}
            </h2>
            <p className="text-xs opacity-90 mt-0.5">
              {fmtDate(dateFrom) || '—'} - {fmtDate(dateTo) || '—'} Opening: {fmtGhs(openingBalance)}
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
          Click an invoice or payment row to open it for editing.
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
                  <th className="px-2 py-1.5 text-left font-semibold w-[12.5%] border border-border">DESCRIPTION</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-[12.5%] border border-border">DEBIT (SALES)</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-[12.5%] border border-border">CREDIT</th>
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
                <td className="px-2 py-1.5 text-right tabular-nums border border-border" />
                <td className="px-2 py-1.5 text-right tabular-nums font-medium border border-border">{fmtAmt(openingBalance) || '0.00'}</td>
              </tr>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-2 py-2 border border-border"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className="px-2 py-8 text-center text-muted-foreground border border-border">No transactions</td></tr>
              ) : (
                transactions.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    onClick={() => onRowClick?.(entry)}
                    className="hover:bg-primary/5 cursor-pointer"
                  >
                    <td className="px-2 py-1.5 text-center text-muted-foreground border border-border">{idx + 1}</td>
                    <td className="px-2 py-1.5 border border-border">
                      <Icon name="FileText" size={14} className="text-muted-foreground inline" />
                    </td>
                    <td className="px-2 py-1.5 tabular-nums border border-border">{fmtDate(entry.date)}</td>
                    <td className="px-2 py-1.5 font-mono border border-border">{entry.reference || '—'}</td>
                    <td className="px-2 py-1.5 border border-border">{entry.description || '—'}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums border border-border">{fmtAmt(entry.debit)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-600 border border-border">{fmtAmt(entry.credit)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium border border-border">{fmtAmt(entry.balance)}</td>
                  </tr>
                ))
              )}
              {transactions.length > 0 && (
                <tr className="bg-primary/20 font-semibold">
                  <td colSpan={5} className="px-2 py-1.5 text-xs border border-border">TOTALS</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-xs border border-border">{fmtAmt(totalDebits)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-xs text-emerald-600 border border-border">{fmtAmt(totalCredits)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-xs font-bold border border-border">{fmtAmt(closingBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-border flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Icon name="Printer" size={14} /> Print
            </button>
            <button
              onClick={handleEmail}
              className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted flex items-center gap-1.5"
            >
              <Icon name="Mail" size={14} /> Email
            </button>
            <button
              onClick={handleExcel}
              className="h-8 px-3 text-xs font-medium border border-border rounded hover:bg-muted flex items-center gap-1.5"
            >
              <Icon name="FileSpreadsheet" size={14} /> Excel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{transactions.length} transactions</span>
            <button
              onClick={onClose}
              className="h-8 px-4 text-xs font-medium border border-border rounded hover:bg-muted"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerStatementModal;
