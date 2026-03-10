import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const SupplierStatement = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d?.setMonth(d?.getMonth() - 3);
    return d?.toISOString()?.split('T')?.[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date()?.toISOString()?.split('T')?.[0]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState(null);

  const fetchVendors = useCallback(async () => {
    const { data } = await supabase?.from('vendors')?.select('id, vendor_name, vendor_code')?.order('vendor_name');
    setVendors(data || []);
  }, []);

  const fetchStatement = useCallback(async () => {
    if (!selectedSupplier) { setLedgerEntries([]); return; }
    setIsLoading(true);
    try {
      const vendor = vendors?.find(v => v?.id === selectedSupplier);
      setSupplierInfo(vendor || null);

      let query = supabase
        ?.from('supplier_ledger')
        ?.select('*')
        ?.eq('supplier_id', selectedSupplier)
        ?.order('transaction_date', { ascending: true })
        ?.order('created_at', { ascending: true });

      if (dateFrom) query = query?.gte('transaction_date', dateFrom);
      if (dateTo) query = query?.lte('transaction_date', dateTo);

      const { data, error } = await query;
      if (error) throw error;
      setLedgerEntries(data || []);
    } catch (err) {
      console.error('Error fetching supplier statement:', err);
      setLedgerEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSupplier, dateFrom, dateTo, vendors]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { fetchStatement(); }, [fetchStatement]);

  // Running balance calculation
  let runningBalance = 0;
  const entriesWithBalance = ledgerEntries?.map(entry => {
    runningBalance += (parseFloat(entry?.debit_amount) || 0) - (parseFloat(entry?.credit_amount) || 0);
    return { ...entry, running_balance: runningBalance };
  });

  const totalDebits = ledgerEntries?.reduce((s, e) => s + (parseFloat(e?.debit_amount) || 0), 0);
  const totalCredits = ledgerEntries?.reduce((s, e) => s + (parseFloat(e?.credit_amount) || 0), 0);
  const closingBalance = totalDebits - totalCredits;

  const fmtAmt = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '';
    return n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtDate = (d) => d ? new Date(d)?.toLocaleDateString('en-GB') : '';

  const TYPE_LABELS = {
    purchase_invoice: 'Purchase Invoice',
    payment: 'Payment',
    credit_note: 'Credit Note',
    debit_note: 'Debit Note',
    adjustment: 'Adjustment',
  };

  const inputCls = 'h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Supplier Statement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Running ledger per supplier — invoices, payments, and outstanding balance</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 pb-3 flex-shrink-0">
          <div className="flex flex-wrap items-end gap-3 p-3 bg-card border border-border rounded-lg">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">Supplier *</label>
              <select
                className={`${inputCls} w-56`}
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e?.target?.value)}
              >
                <option value="">Select Supplier</option>
                {vendors?.map(v => <option key={v?.id} value={v?.id}>{v?.vendor_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">Date From</label>
              <input type="date" className={inputCls} value={dateFrom} onChange={e => setDateFrom(e?.target?.value)} />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">Date To</label>
              <input type="date" className={inputCls} value={dateTo} onChange={e => setDateTo(e?.target?.value)} />
            </div>
            <button
              onClick={fetchStatement}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Icon name="Search" size={13} /> View Statement
            </button>
            <button
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border rounded hover:bg-accent transition-colors"
            >
              <Icon name="Printer" size={13} /> Print
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            {/* Supplier Info Header */}
            {supplierInfo && (
              <div className="px-4 py-2.5 bg-primary/5 border-b border-border flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-sm font-semibold text-foreground">{supplierInfo?.vendor_name}</span>
                  {supplierInfo?.vendor_code && (
                    <span className="ml-2 text-xs text-muted-foreground font-mono">[{supplierInfo?.vendor_code}]</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">Period: <span className="font-medium text-foreground">{fmtDate(dateFrom)} — {fmtDate(dateTo)}</span></span>
                  <span className="text-muted-foreground">{ledgerEntries?.length} transactions</span>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs font-sans border-collapse min-w-max">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-primary text-primary-foreground">
                    <th className="w-28 px-3 py-1.5 text-left font-semibold border-r border-primary/20">Date</th>
                    <th className="w-32 px-3 py-1.5 text-left font-semibold border-r border-primary/20">Type</th>
                    <th className="w-36 px-3 py-1.5 text-left font-semibold border-r border-primary/20">Reference</th>
                    <th className="flex-1 px-3 py-1.5 text-left font-semibold border-r border-primary/20">Description</th>
                    <th className="w-28 px-3 py-1.5 text-right font-semibold border-r border-primary/20">Debit (Invoice)</th>
                    <th className="w-28 px-3 py-1.5 text-right font-semibold border-r border-primary/20">Credit (Payment)</th>
                    <th className="w-28 px-3 py-1.5 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedSupplier ? (
                    <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">Select a supplier to view their statement</td></tr>
                  ) : isLoading ? (
                    Array.from({ length: 6 })?.map((_, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td colSpan={7} className="px-3 py-1.5"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                      </tr>
                    ))
                  ) : entriesWithBalance?.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">No transactions found for the selected period</td></tr>
                  ) : (
                    entriesWithBalance?.map((entry, idx) => (
                      <tr
                        key={entry?.id}
                        className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                      >
                        <td className="px-3 py-1 tabular-nums whitespace-nowrap">{fmtDate(entry?.transaction_date)}</td>
                        <td className="px-3 py-1 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            entry?.transaction_type === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                            entry?.transaction_type === 'purchase_invoice' ? 'bg-blue-100 text-blue-700' :
                            entry?.transaction_type === 'credit_note'? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'
                          }`}>
                            {TYPE_LABELS?.[entry?.transaction_type] || entry?.transaction_type}
                          </span>
                        </td>
                        <td className="px-3 py-1 font-mono text-primary whitespace-nowrap">{entry?.reference_no || '—'}</td>
                        <td className="px-3 py-1 text-foreground">{entry?.description || '—'}</td>
                        <td className="px-3 py-1 text-right tabular-nums whitespace-nowrap">{fmtAmt(entry?.debit_amount)}</td>
                        <td className="px-3 py-1 text-right tabular-nums whitespace-nowrap text-emerald-700">{fmtAmt(entry?.credit_amount)}</td>
                        <td className={`px-3 py-1 text-right tabular-nums font-medium whitespace-nowrap ${
                          entry?.running_balance > 0 ? 'text-red-600' : entry?.running_balance < 0 ? 'text-emerald-600' : 'text-foreground'
                        }`}>
                          {entry?.running_balance !== 0 ? fmtAmt(Math.abs(entry?.running_balance)) + (entry?.running_balance > 0 ? ' Dr' : ' Cr') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {entriesWithBalance?.length > 0 && (
                  <tfoot className="sticky bottom-0">
                    <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
                      <td colSpan={4} className="px-3 py-1.5 text-xs text-foreground">Closing Balance</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-xs">{fmtAmt(totalDebits)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-xs text-emerald-700">{fmtAmt(totalCredits)}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums text-xs font-bold ${
                        closingBalance > 0 ? 'text-red-600' : closingBalance < 0 ? 'text-emerald-600' : 'text-foreground'
                      }`}>
                        {closingBalance !== 0 ? fmtAmt(Math.abs(closingBalance)) + (closingBalance > 0 ? ' Dr' : ' Cr') : '—'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SupplierStatement;
