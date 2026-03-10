import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const SupplierEmptiesStatement = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d?.setMonth(d?.getMonth() - 3);
    return d?.toISOString()?.split('T')?.[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date()?.toISOString()?.split('T')?.[0]);
  const [emptiesData, setEmptiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState(null);

  const fetchVendors = useCallback(async () => {
    const { data } = await supabase?.from('vendors')?.select('id, vendor_name, vendor_code')?.order('vendor_name');
    setVendors(data || []);
  }, []);

  const fetchEmptiesStatement = useCallback(async () => {
    if (!selectedSupplier) { setEmptiesData([]); return; }
    setIsLoading(true);
    try {
      const vendor = vendors?.find(v => v?.id === selectedSupplier);
      setSupplierInfo(vendor || null);

      // Fetch purchase invoice items where is_returnable = true for this supplier
      let query = supabase
        ?.from('purchase_invoice_items')
        ?.select(`
          id,
          purchase_invoice_id,
          item_code,
          item_name,
          ctn_qty,
          btl_qty,
          empties_value,
          is_returnable,
          purchase_invoices!inner(invoice_no, invoice_date, supplier_id)
        `)
        ?.eq('is_returnable', true)
        ?.eq('purchase_invoices.supplier_id', selectedSupplier);

      if (dateFrom) query = query?.gte('purchase_invoices.invoice_date', dateFrom);
      if (dateTo) query = query?.lte('purchase_invoices.invoice_date', dateTo);

      const { data, error } = await query;
      if (error) throw error;
      // Sort client-side by invoice_date ascending
      const sorted = (data || [])?.sort((a, b) => {
        const da = a?.purchase_invoices?.invoice_date || '';
        const db = b?.purchase_invoices?.invoice_date || '';
        return da < db ? -1 : da > db ? 1 : 0;
      });
      setEmptiesData(sorted);
    } catch (err) {
      console.error('Error fetching empties statement:', err);
      setEmptiesData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSupplier, dateFrom, dateTo, vendors]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { fetchEmptiesStatement(); }, [fetchEmptiesStatement]);

  // Aggregate by product
  const productSummary = emptiesData?.reduce((acc, item) => {
    const key = item?.item_code || item?.item_name || 'Unknown';
    if (!acc?.[key]) {
      acc[key] = {
        item_code: item?.item_code,
        item_name: item?.item_name,
        total_issued_ctn: 0,
        total_issued_btl: 0,
        total_returned_ctn: 0,
        total_returned_btl: 0,
        total_empties_value: 0,
        transactions: 0,
      };
    }
    const ctn = parseFloat(item?.ctn_qty) || 0;
    const btl = parseFloat(item?.btl_qty) || 0;
    const val = parseFloat(item?.empties_value) || 0;
    if (ctn > 0 || btl > 0) {
      acc[key].total_issued_ctn += ctn;
      acc[key].total_issued_btl += btl;
    } else {
      acc[key].total_returned_ctn += Math.abs(ctn);
      acc[key].total_returned_btl += Math.abs(btl);
    }
    acc[key].total_empties_value += val;
    acc[key].transactions += 1;
    return acc;
  }, {});

  const summaryRows = Object.values(productSummary);
  const totalIssuedCtn = summaryRows?.reduce((s, r) => s + r?.total_issued_ctn, 0);
  const totalReturnedCtn = summaryRows?.reduce((s, r) => s + r?.total_returned_ctn, 0);
  const totalBalanceCtn = totalIssuedCtn - totalReturnedCtn;
  const totalEmptiesValue = summaryRows?.reduce((s, r) => s + r?.total_empties_value, 0);

  const fmtAmt = (v) => (parseFloat(v) || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtQty = (v) => (parseFloat(v) || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d)?.toLocaleDateString('en-GB') : '';

  const inputCls = 'h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Supplier Empties Statement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Empties movement per supplier — crates/bottles issued vs returned vs balance</p>
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
              onClick={fetchEmptiesStatement}
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

        {/* Main Content */}
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <div className="h-full flex flex-col gap-4 overflow-auto">
            {/* Summary Cards */}
            {selectedSupplier && !isLoading && emptiesData?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
                {[
                  { label: 'Total Issued (Ctn)', value: fmtQty(totalIssuedCtn), icon: 'PackagePlus', color: 'text-blue-600 bg-blue-50' },
                  { label: 'Total Returned (Ctn)', value: fmtQty(totalReturnedCtn), icon: 'PackageMinus', color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Balance (Ctn)', value: fmtQty(totalBalanceCtn), icon: 'Package', color: totalBalanceCtn > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50' },
                  { label: 'Total Empties Value', value: fmtAmt(totalEmptiesValue), icon: 'DollarSign', color: 'text-primary bg-primary/10' },
                ]?.map((card, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card?.color}`}>
                      <Icon name={card?.icon} size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{card?.label}</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{card?.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detail Table */}
            <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-primary text-primary-foreground flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Empties Detail by Product</span>
                  {supplierInfo && (
                    <span className="text-xs opacity-80">{supplierInfo?.vendor_name} | {fmtDate(dateFrom)} — {fmtDate(dateTo)}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs font-sans border-collapse min-w-max">
                  <thead className="sticky top-0 z-10 bg-muted/60">
                    <tr className="border-b border-border">
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground border-r border-border/50">Item Code</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground border-r border-border/50">Item Name</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground border-r border-border/50">Issued Ctn</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground border-r border-border/50">Issued Btl</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground border-r border-border/50">Returned Ctn</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground border-r border-border/50">Returned Btl</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground border-r border-border/50">Balance Ctn</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground border-r border-border/50">Empties Value</th>
                      <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedSupplier ? (
                      <tr><td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">Select a supplier to view their empties statement</td></tr>
                    ) : isLoading ? (
                      Array.from({ length: 5 })?.map((_, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td colSpan={9} className="px-3 py-1.5"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                        </tr>
                      ))
                    ) : summaryRows?.length === 0 ? (
                      <tr><td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">No returnable items found for the selected period</td></tr>
                    ) : (
                      summaryRows?.map((row, idx) => {
                        const balanceCtn = row?.total_issued_ctn - row?.total_returned_ctn;
                        return (
                          <tr key={idx} className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                            <td className="px-3 py-1.5 font-mono text-primary whitespace-nowrap">{row?.item_code || '—'}</td>
                            <td className="px-3 py-1.5 whitespace-nowrap">{row?.item_name}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtQty(row?.total_issued_ctn)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtQty(row?.total_issued_btl)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-emerald-700">{fmtQty(row?.total_returned_ctn)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-emerald-700">{fmtQty(row?.total_returned_btl)}</td>
                            <td className={`px-3 py-1.5 text-right tabular-nums font-semibold ${balanceCtn > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {fmtQty(balanceCtn)}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtAmt(row?.total_empties_value)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{row?.transactions}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {summaryRows?.length > 0 && (
                    <tfoot className="sticky bottom-0">
                      <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
                        <td colSpan={2} className="px-3 py-1.5 text-xs">Totals</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs">{fmtQty(totalIssuedCtn)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs">{fmtQty(summaryRows?.reduce((s, r) => s + r?.total_issued_btl, 0))}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs text-emerald-700">{fmtQty(totalReturnedCtn)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs text-emerald-700">{fmtQty(summaryRows?.reduce((s, r) => s + r?.total_returned_btl, 0))}</td>
                        <td className={`px-3 py-1.5 text-right tabular-nums text-xs font-bold ${totalBalanceCtn > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {fmtQty(totalBalanceCtn)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs">{fmtAmt(totalEmptiesValue)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs text-muted-foreground">{emptiesData?.length}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SupplierEmptiesStatement;
