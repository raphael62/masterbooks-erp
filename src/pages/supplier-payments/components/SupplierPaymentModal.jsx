import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';

const generatePaymentNo = () => {
  const now = new Date();
  const yyyy = now?.getFullYear();
  const mm = String(now?.getMonth() + 1)?.padStart(2, '0');
  const dd = String(now?.getDate())?.padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `PAY-${yyyy}-${mm}-${dd}-${seq}`;
};

const SupplierPaymentModal = ({ payment, onClose, onSaved }) => {
  const isEdit = !!payment?.id;

  const [form, setForm] = useState({
    payment_no: payment?.payment_no || generatePaymentNo(),
    payment_date: payment?.payment_date || new Date()?.toISOString()?.split('T')?.[0],
    supplier_id: payment?.supplier_id || '',
    payment_account: payment?.payment_account || '',
    cheque_ref_no: payment?.cheque_ref_no || '',
    total_amount: payment?.total_amount || '',
    notes: payment?.notes || '',
    status: payment?.status || 'unallocated',
  });

  const [vendors, setVendors] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchLookups = useCallback(async () => {
    const results = await Promise.all([
      supabase?.from('vendors')?.select('id, vendor_name')?.eq('status', 'active')?.order('vendor_name'),
      supabase?.from('payment_accounts')?.select('id, account_name')?.order('account_name'),
    ]);
    const vd = results[0]?.data;
    const pa = results[1]?.data;
    setVendors(vd || []);
    setPaymentAccounts(pa || []);
  }, []);

  const fetchOutstandingInvoices = useCallback(async (supplierId) => {
    if (!supplierId) { setOutstandingInvoices([]); return; }
    try {
      const { data } = await supabase
        ?.from('purchase_invoices')
        ?.select('id, invoice_no, invoice_date, total_tax_inc_value')
        ?.eq('supplier_id', supplierId)
        ?.eq('status', 'posted')
        ?.order('invoice_date', { ascending: true });

      const { data: existingAllocs } = await supabase
        ?.from('supplier_payment_allocations')
        ?.select('purchase_invoice_id, allocated_amount')
        ?.neq('supplier_payment_id', payment?.id || '00000000-0000-0000-0000-000000000000');

      const allocMap = {};
      (existingAllocs || [])?.forEach(a => {
        allocMap[a?.purchase_invoice_id] = (allocMap?.[a?.purchase_invoice_id] || 0) + (parseFloat(a?.allocated_amount) || 0);
      });

      const invoices = (data || [])?.map(inv => {
        const invoiceAmt = parseFloat(inv?.total_tax_inc_value) || 0;
        const alreadyAllocated = allocMap?.[inv?.id] || 0;
        const outstanding = Math.max(0, invoiceAmt - alreadyAllocated);
        return {
          id: inv?.id,
          invoice_no: inv?.invoice_no,
          invoice_date: inv?.invoice_date,
          invoice_amount: invoiceAmt,
          outstanding_amount: outstanding,
          allocation_amount: 0,
        };
      })?.filter(inv => inv?.outstanding_amount > 0);

      setOutstandingInvoices(invoices);

      if (isEdit && payment?.id) {
        const { data: myAllocs } = await supabase
          ?.from('supplier_payment_allocations')
          ?.select('purchase_invoice_id, allocated_amount')
          ?.eq('supplier_payment_id', payment?.id);
        const myAllocMap = {};
        (myAllocs || [])?.forEach(a => { myAllocMap[a?.purchase_invoice_id] = parseFloat(a?.allocated_amount) || 0; });
        setAllocations(myAllocs?.map(a => ({ invoice_id: a?.purchase_invoice_id, amount: a?.allocated_amount })) || []);
        setOutstandingInvoices(prev => prev?.map(inv => ({
          ...inv,
          allocation_amount: myAllocMap?.[inv?.id] || 0,
        })));
      }
    } catch (err) {
      console.error('Error fetching outstanding invoices:', err);
    }
  }, [isEdit, payment?.id]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    if (form?.supplier_id) fetchOutstandingInvoices(form?.supplier_id);
  }, [form?.supplier_id, fetchOutstandingInvoices]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAllocationChange = (invoiceId, value) => {
    const numVal = parseFloat(value) || 0;
    setOutstandingInvoices(prev => prev?.map(inv =>
      inv?.id === invoiceId ? { ...inv, allocation_amount: numVal } : inv
    ));
  };

  const totalAllocated = outstandingInvoices?.reduce((s, inv) => s + (parseFloat(inv?.allocation_amount) || 0), 0);
  const totalPayment = parseFloat(form?.total_amount) || 0;
  const unallocated = totalPayment - totalAllocated;

  const validate = () => {
    const errs = {};
    if (!form?.payment_date) errs.payment_date = 'Required';
    if (!form?.supplier_id) errs.supplier_id = 'Required';
    if (!form?.payment_account) errs.payment_account = 'Required';
    if (!form?.total_amount || parseFloat(form?.total_amount) <= 0) errs.total_amount = 'Must be > 0';
    if (totalAllocated > totalPayment + 0.001) errs.allocation = 'Allocated exceeds payment amount';
    setErrors(errs);
    return Object.keys(errs)?.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const supplierName = vendors?.find(v => v?.id === form?.supplier_id)?.vendor_name || '';
      const allocatedAmt = totalAllocated;
      let status = 'unallocated';
      if (allocatedAmt >= totalPayment - 0.01) status = 'posted';
      else if (allocatedAmt > 0) status = 'partial';

      const payload = {
        payment_no: form?.payment_no,
        payment_date: form?.payment_date,
        supplier_id: form?.supplier_id,
        supplier_name: supplierName,
        payment_account: form?.payment_account,
        cheque_ref_no: form?.cheque_ref_no || null,
        total_amount: parseFloat(form?.total_amount),
        allocated_amount: allocatedAmt,
        notes: form?.notes || null,
        status,
      };

      let paymentId = payment?.id;
      if (isEdit) {
        const { error } = await supabase?.from('supplier_payments')?.update(payload)?.eq('id', paymentId);
        if (error) throw error;
        await supabase?.from('supplier_payment_allocations')?.delete()?.eq('supplier_payment_id', paymentId);
      } else {
        const { data, error } = await supabase?.from('supplier_payments')?.insert([payload])?.select()?.single();
        if (error) throw error;
        paymentId = data?.id;
      }

      const allocRows = outstandingInvoices
        ?.filter(inv => parseFloat(inv?.allocation_amount) > 0)
        ?.map(inv => ({
          supplier_payment_id: paymentId,
          purchase_invoice_id: inv?.id,
          allocated_amount: parseFloat(inv?.allocation_amount),
        }));

      if (allocRows?.length > 0) {
        const { error: allocErr } = await supabase?.from('supplier_payment_allocations')?.insert(allocRows);
        if (allocErr) console.warn('Allocation insert error:', allocErr);
      }

      // Update supplier ledger
      const ledgerEntry = {
        transaction_date: form?.payment_date,
        transaction_type: 'payment',
        reference_no: form?.payment_no,
        supplier_id: form?.supplier_id,
        supplier_name: supplierName,
        description: `Payment - ${form?.payment_account}${form?.cheque_ref_no ? ` Ref: ${form?.cheque_ref_no}` : ''}`,
        debit_amount: 0,
        credit_amount: parseFloat(form?.total_amount),
      };
      if (!isEdit) {
        await supabase?.from('supplier_ledger')?.insert([ledgerEntry]);
      }

      onSaved?.();
    } catch (err) {
      console.error('Error saving payment:', err);
      setErrors({ general: err?.message || 'Failed to save payment' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = 'h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-0.5 block';
  const fmtAmt = (v) => (parseFloat(v) || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d)?.toLocaleDateString('en-GB') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary text-primary-foreground rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Banknote" size={18} />
            <h2 className="text-sm font-semibold">{isEdit ? 'Edit Payment' : 'New Supplier Payment'}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-primary-foreground/20 rounded transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {errors?.general && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{errors?.general}</div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <div>
              <label className={labelCls}>Payment No</label>
              <input className={`${inputCls} bg-muted/50`} value={form?.payment_no} readOnly />
            </div>
            <div>
              <label className={labelCls}>Payment Date *</label>
              <input
                type="date"
                className={`${inputCls} ${errors?.payment_date ? 'border-red-400' : ''}`}
                value={form?.payment_date}
                onChange={e => handleChange('payment_date', e?.target?.value)}
              />
              {errors?.payment_date && <p className="text-xs text-red-500 mt-0.5">{errors?.payment_date}</p>}
            </div>
            <div>
              <label className={labelCls}>Supplier *</label>
              <select
                className={`${inputCls} ${errors?.supplier_id ? 'border-red-400' : ''}`}
                value={form?.supplier_id}
                onChange={e => handleChange('supplier_id', e?.target?.value)}
              >
                <option value="">Select Supplier</option>
                {vendors?.map(v => <option key={v?.id} value={v?.id}>{v?.vendor_name}</option>)}
              </select>
              {errors?.supplier_id && <p className="text-xs text-red-500 mt-0.5">{errors?.supplier_id}</p>}
            </div>
            <div>
              <label className={labelCls}>Payment Account *</label>
              <select
                className={`${inputCls} ${errors?.payment_account ? 'border-red-400' : ''}`}
                value={form?.payment_account}
                onChange={e => handleChange('payment_account', e?.target?.value)}
              >
                <option value="">Select Account</option>
                {paymentAccounts?.map(a => <option key={a?.id} value={a?.account_name}>{a?.account_name}</option>)}
              </select>
              {errors?.payment_account && <p className="text-xs text-red-500 mt-0.5">{errors?.payment_account}</p>}
            </div>
            <div>
              <label className={labelCls}>Cheque / Ref No</label>
              <input
                className={inputCls}
                value={form?.cheque_ref_no}
                onChange={e => handleChange('cheque_ref_no', e?.target?.value)}
                placeholder="Cheque or reference number"
              />
            </div>
            <div>
              <label className={labelCls}>Total Amount *</label>
              <input
                type="number"
                step="0.01"
                className={`${inputCls} text-right tabular-nums ${errors?.total_amount ? 'border-red-400' : ''}`}
                value={form?.total_amount}
                onChange={e => handleChange('total_amount', e?.target?.value)}
                placeholder="0.00"
              />
              {errors?.total_amount && <p className="text-xs text-red-500 mt-0.5">{errors?.total_amount}</p>}
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className={labelCls}>Notes</label>
              <textarea
                className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={2}
                value={form?.notes}
                onChange={e => handleChange('notes', e?.target?.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Invoice Allocation Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
              <h3 className="text-xs font-semibold text-foreground">Invoice Allocation</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Payment: <span className="font-semibold text-foreground">{fmtAmt(totalPayment)}</span></span>
                <span className="text-muted-foreground">Allocated: <span className="font-semibold text-emerald-600">{fmtAmt(totalAllocated)}</span></span>
                <span className={`font-semibold ${unallocated < -0.01 ? 'text-red-600' : 'text-foreground'}`}>
                  Remaining: {fmtAmt(unallocated)}
                </span>
              </div>
            </div>
            {errors?.allocation && (
              <div className="px-3 py-1.5 bg-red-50 border-b border-red-200 text-xs text-red-600">{errors?.allocation}</div>
            )}
            <div className="overflow-x-auto max-h-52">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60">
                  <tr className="border-b border-border">
                    <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Invoice No</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Invoice Date</th>
                    <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">Invoice Amount</th>
                    <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">Outstanding</th>
                    <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">Allocate Amount</th>
                    <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {!form?.supplier_id ? (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Select a supplier to see outstanding invoices</td></tr>
                  ) : outstandingInvoices?.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No outstanding invoices for this supplier</td></tr>
                  ) : (
                    outstandingInvoices?.map((inv, idx) => {
                      const remaining = inv?.outstanding_amount - (parseFloat(inv?.allocation_amount) || 0);
                      return (
                        <tr key={inv?.id} className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <td className="px-3 py-1 font-mono font-medium text-primary">{inv?.invoice_no}</td>
                          <td className="px-3 py-1 tabular-nums">{fmtDate(inv?.invoice_date)}</td>
                          <td className="px-3 py-1 text-right tabular-nums">{fmtAmt(inv?.invoice_amount)}</td>
                          <td className="px-3 py-1 text-right tabular-nums">{fmtAmt(inv?.outstanding_amount)}</td>
                          <td className="px-3 py-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={inv?.outstanding_amount}
                              className="h-6 px-1.5 text-xs text-right tabular-nums border border-border rounded bg-background w-28 focus:outline-none focus:ring-1 focus:ring-primary"
                              value={inv?.allocation_amount || ''}
                              onChange={e => handleAllocationChange(inv?.id, e?.target?.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td className={`px-3 py-1 text-right tabular-nums font-medium ${remaining < 0 ? 'text-red-600' : ''}`}>
                            {fmtAmt(remaining)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20 flex-shrink-0 rounded-b-xl">
          <button
            onClick={onClose}
            className="h-7 px-4 text-xs font-medium border border-border rounded hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-1.5"
          >
            {isSaving && <Icon name="Loader2" size={12} className="animate-spin" />}
            {isEdit ? 'Update Payment' : 'Save Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierPaymentModal;
