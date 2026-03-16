import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

const emptyItem = () => ({
  _key: Math.random()?.toString(36)?.slice(2),
  item_code: '',
  item_name: '',
  price_type_name: '',
  pack_unit: '',
  btl_qty: '',
  ctn_qty: '',
  price_ex_tax: '',
  pre_tax: 0,
  tax_rate: 0,
  tax_amt: 0,
  price_tax_inc: '',
  value_tax_inc: 0,
  product_id: null,
  price_type_id: null,
  _price_from_list: false,
});

const today = () => new Date()?.toISOString()?.slice(0, 10);

const fetchPriceForProduct = async (productCode, orderDate, customerPriceTypeId) => {
  if (!productCode || !orderDate) return null;
  try {
    const { data, error } = await supabase
      .from('price_list_items')
      .select(`
        id, product_code, pack_unit, price, unit_price, price_tax_inc, tax_rate_id, vat_type,
        price_list_headers!price_list_header_id(id, status, start_date, effective_date, price_type_id)
      `)
      .eq('product_code', productCode);
    if (error) return null;
    const withHeader = (data || []).filter(r => r?.price_list_headers != null);
    const byDate = (a, b) => {
      const dA = a?.price_list_headers?.effective_date || a?.price_list_headers?.start_date || '';
      const dB = b?.price_list_headers?.effective_date || b?.price_list_headers?.start_date || '';
      return (dB || '').localeCompare(dA || '');
    };
    const sorted = withHeader
      .filter(r => {
        const d = r?.price_list_headers?.effective_date || r?.price_list_headers?.start_date;
        return d && String(d) <= String(orderDate);
      })
      .sort(byDate);
    if (sorted.length === 0) return null;
    let matched = customerPriceTypeId ? sorted.find(r => r?.price_list_headers?.price_type_id === customerPriceTypeId) : null;
    if (!matched) matched = sorted[0];
    let taxRatePercent = 0;
    if (matched?.tax_rate_id) {
      const { data: trData } = await supabase.from('tax_rates').select('rate, rate_percent').eq('id', matched.tax_rate_id).single();
      taxRatePercent = parseFloat(trData?.rate) ?? parseFloat(trData?.rate_percent) ?? 0;
    }
    const vals = [parseFloat(matched?.price_tax_inc), parseFloat(matched?.price), parseFloat(matched?.unit_price)];
    const priceTaxInc = vals.find(v => v != null && !isNaN(v)) ?? null;
    const vatType = matched?.vat_type || 'inclusive';
    let priceExTax = null;
    if (priceTaxInc !== null) {
      if (vatType === 'inclusive' && taxRatePercent > 0) {
        priceExTax = parseFloat((priceTaxInc / (1 + taxRatePercent / 100)).toFixed(6));
      } else {
        priceExTax = parseFloat(priceTaxInc.toFixed(6));
      }
    }
    return {
      price_tax_inc: priceTaxInc,
      price_ex_tax: priceExTax,
      pack_unit: matched?.pack_unit || null,
      tax_rate_percent: taxRatePercent,
      price_type_id: matched?.price_list_headers?.price_type_id || null,
    };
  } catch (e) {
    return null;
  }
};

const SalesOrderForm = ({ order, onClose, onSaved }) => {
  const orderId = order?.id || null;
  const isEdit = !!orderId;
  const overlayRef = useRef(null);
  const rowRefs = useRef({});
  const [form, setForm] = useState({
    order_no: '',
    customer_id: '',
    customer_code: '',
    customer_name: '',
    customer_price_type_id: null,
    sales_rep_id: '',
    sales_rep_name: '',
    location_id: '',
    location_name: '',
    order_date: today(),
    delivery_date: '',
    balance_outstanding: '',
    notes: '',
  });
  const [items, setItems] = useState(isEdit ? [] : [emptyItem(), emptyItem(), emptyItem(), emptyItem()]);
  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dropdownIdx, setDropdownIdx] = useState(null);
  const [dropdownField, setDropdownField] = useState(null);
  const [dropdownQuery, setDropdownQuery] = useState('');
  const [formSearchField, setFormSearchField] = useState(null);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [focusedPriceTaxIncIdx, setFocusedPriceTaxIncIdx] = useState(null);

  const getFilteredProducts = useCallback((query) => {
    if (!query || !products?.length) return products?.slice(0, 20) || [];
    const q = String(query).toLowerCase().trim();
    return products.filter(p => p?.product_code?.toLowerCase()?.includes(q) || p?.product_name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [products]);
  const getFilteredCustomers = useCallback((query) => {
    if (!customers?.length) return [];
    if (!query?.trim()) return customers.slice(0, 30);
    const q = String(query).toLowerCase().trim();
    return customers.filter(c => c?.customer_code?.toLowerCase()?.includes(q) || c?.customer_name?.toLowerCase()?.includes(q)).slice(0, 30);
  }, [customers]);
  const getFilteredSalesReps = useCallback((query) => {
    if (!salesReps?.length) return [];
    if (!query?.trim()) return salesReps.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return salesReps.filter(r => r?.exec_code?.toLowerCase()?.includes(q) || r?.full_name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [salesReps]);
  const getFilteredLocations = useCallback((query) => {
    if (!locations?.length) return [];
    if (!query?.trim()) return locations.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return locations.filter(l => l?.code?.toLowerCase()?.includes(q) || l?.name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [locations]);
  const getFilteredPriceTypes = useCallback((query) => {
    if (!priceTypes?.length) return [];
    if (!query?.trim()) return priceTypes.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return priceTypes.filter(p => p?.price_type_name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [priceTypes]);

  const loadReferenceData = async () => {
    try {
      const [custRes, repRes, locRes, prodRes, ptRes] = await Promise.all([
        supabase.from('customers').select('id, customer_code, customer_name, price_type, price_type_id, outstanding_balance, business_executive, location_id, location').order('customer_name'),
        supabase.from('business_executives').select('id, exec_code, full_name').order('full_name'),
        supabase.from('locations').select('id, code, name').order('name'),
        supabase.from('products').select('id, product_code, product_name, pack_unit, is_taxable, bottle_cost, plastic_cost, is_returnable').order('product_name'),
        supabase.from('price_types').select('id, price_type_name').order('price_type_name'),
      ]);
      const rawCustomers = custRes?.data || [];
      const seen = new Set();
      const deduped = rawCustomers.filter(c => {
        const key = (c?.customer_code || '').trim() || c?.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCustomers(deduped);
      setSalesReps(repRes?.data || []);
      setLocations(locRes?.data || []);
      setProducts(prodRes?.data || []);
      setPriceTypes(ptRes?.data || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  useEffect(() => { loadReferenceData(); }, []);

  const getRef = (rowIdx, col) => {
    const key = `${rowIdx}-${col}`;
    if (!rowRefs.current[key]) rowRefs.current[key] = React.createRef();
    return rowRefs.current[key];
  };

  const focusCell = (rowIdx, col) => {
    setTimeout(() => {
      const el = rowRefs.current[`${rowIdx}-${col}`]?.current;
      if (el) el.focus();
    }, 30);
  };

  const handleLineKeyDown = (e, idx, col) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusCell(idx === items.length - 1 ? 0 : idx + 1, col);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusCell(idx === 0 ? items.length - 1 : idx - 1, col);
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (col === 'item_code' || col === 'item_name') {
      const query = col === 'item_code' ? items[idx]?.item_code : items[idx]?.item_name;
      const matches = getFilteredProducts(query || '');
      if (matches?.length > 0) {
        handleProductSelect(idx, matches[0]?.id);
        setDropdownIdx(null);
      }
      focusCell(idx, 'ctn_qty');
    } else if (col === 'ctn_qty') {
      setItems(prev => {
        const isLast = idx === prev.length - 1;
        return isLast ? [...prev, emptyItem()] : prev;
      });
      focusCell(idx + 1, 'item_code');
    }
  };

  // Re-fetch prices when order date or customer price type changes
  useEffect(() => {
    const run = async () => {
      const orderDate = form?.order_date || today();
      const customerPriceTypeId = form?.customer_price_type_id || null;
      const currentItems = items?.filter(it => it?.product_id && it?.item_code) || [];
      if (currentItems.length === 0) return;
      const updates = [];
      for (let i = 0; i < items?.length || 0; i++) {
        const it = items[i];
        if (!it?.product_id || !it?.item_code) continue;
        const priceData = await fetchPriceForProduct(it.item_code, orderDate, customerPriceTypeId);
        if (priceData) updates.push({ idx: i, priceData, ptName: priceTypes?.find(pt => pt?.id === priceData?.price_type_id)?.price_type_name || it?.price_type_name });
      }
      if (updates.length > 0) {
        setItems(prev => {
          const u = [...prev];
          for (const { idx, priceData, ptName } of updates) {
            if (!u[idx]) continue;
            const item = { ...u[idx] };
            if (priceData.price_tax_inc != null) item.price_tax_inc = priceData.price_tax_inc;
            if (priceData.price_ex_tax != null) { item.price_ex_tax = priceData.price_ex_tax; item._price_from_list = true; }
            item.tax_rate = priceData.tax_rate_percent ?? item.tax_rate;
            if (priceData.pack_unit != null) item.pack_unit = priceData.pack_unit;
            item.price_type_id = priceData.price_type_id ?? item.price_type_id;
            item.price_type_name = ptName || item.price_type_name;
            const ctn = parseFloat(item.ctn_qty) || 0;
            const price = parseFloat(item.price_ex_tax) || 0;
            const tr = parseFloat(item.tax_rate) || 0;
            item.pre_tax = parseFloat((ctn * price).toFixed(2));
            item.tax_amt = parseFloat((item.pre_tax * tr / 100).toFixed(2));
            item.value_tax_inc = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
            u[idx] = item;
          }
          return u;
        });
      }
    };
    const hasPricedItems = items?.some(it => it?.product_id && it?._price_from_list);
    if (hasPricedItems) run();
  }, [form?.order_date, form?.customer_price_type_id]);

  useEffect(() => {
    if (!order) return;
    setForm({
      order_no: order?.order_no || '',
      customer_id: order?.customer_id || '',
      customer_code: order?.customer_code || '',
      customer_name: order?.customer_name || '',
      customer_price_type_id: order?.customer_price_type_id || null,
      sales_rep_id: order?.sales_rep_id || '',
      sales_rep_name: order?.sales_rep_name || '',
      location_id: order?.location_id || '',
      location_name: order?.location_name || '',
      order_date: order?.order_date || today(),
      delivery_date: order?.delivery_date || order?.due_date || '',
      balance_outstanding: order?.balance_outstanding ?? '',
      notes: order?.notes || '',
    });
    if (order?.items?.length) {
      setItems(order.items.map(it => ({
        _key: it?.id || Math.random()?.toString(36)?.slice(2),
        item_code: it?.product_code || '',
        item_name: it?.product_name || '',
        price_type_name: it?.price_type_name || '',
        pack_unit: it?.pack_unit ?? '',
        btl_qty: it?.btl_qty ?? '',
        ctn_qty: it?.ctn_qty ?? '',
        price_ex_tax: it?.price_ex_tax ?? '',
        pre_tax: it?.pre_tax ?? 0,
        tax_rate: it?.tax_rate ?? 0,
        tax_amt: it?.tax_amt ?? 0,
        price_tax_inc: it?.price_tax_inc ?? '',
        value_tax_inc: it?.value_tax_inc ?? 0,
        product_id: it?.product_id || null,
        price_type_id: it?.price_type_id || null,
        _price_from_list: false,
      })));
    } else {
      setItems([emptyItem(), emptyItem(), emptyItem(), emptyItem()]);
    }
  }, [order?.id]);

  const generateOrderNo = useCallback(async () => {
    if (isEdit) return;
    try {
      const dateStr = form?.order_date || today();
      const prefix = `SO-${dateStr}`;
      const { data } = await supabase?.from('sales_orders')
        ?.select('order_no')
        ?.like('order_no', `${prefix}-%`)
        ?.order('order_no', { ascending: false })
        ?.limit(1);
      const last = data?.[0]?.order_no;
      let seq = 1;
      if (last) {
        const parts = last?.split('-');
        const lastSeq = parseInt(parts?.[parts?.length - 1], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      setForm(f => ({ ...f, order_no: `${prefix}-${String(seq)?.padStart(3, '0')}` }));
    } catch {
      setForm(f => ({ ...f, order_no: `SO-${form?.order_date || today()}-001` }));
    }
  }, [form?.order_date, isEdit]);

  useEffect(() => {
    if (!isEdit && !form?.order_no) generateOrderNo();
  }, []);

  const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleCustomerSelect = (customer) => {
    let matchedPriceType = customer?.price_type_id ? priceTypes?.find(pt => pt?.id === customer?.price_type_id) : null;
    if (!matchedPriceType && customer?.price_type) {
      matchedPriceType = priceTypes?.find(pt => pt?.price_type_name?.toLowerCase() === customer?.price_type?.toLowerCase());
    }
    const matchedRep = salesReps?.find(r =>
      r?.full_name?.toLowerCase() === customer?.business_executive?.toLowerCase() ||
      r?.exec_code?.toLowerCase() === customer?.business_executive?.toLowerCase()
    );
    const matchedLocation = customer?.location_id ? locations?.find(l => l?.id === customer?.location_id) : null;
    const ptName = matchedPriceType?.price_type_name || customer?.price_type || '';
    setForm(f => ({
      ...f,
      customer_id: customer?.id,
      customer_code: customer?.customer_code,
      customer_name: customer?.customer_name,
      customer_price_type_id: matchedPriceType?.id || null,
      balance_outstanding: customer?.outstanding_balance ?? 0,
      sales_rep_id: matchedRep?.id || f.sales_rep_id,
      sales_rep_name: matchedRep ? matchedRep?.full_name : f.sales_rep_name,
      location_id: matchedLocation?.id || f.location_id,
      location_name: matchedLocation ? `${matchedLocation?.code} - ${matchedLocation?.name}` : f.location_name,
    }));
    if (ptName) {
      setItems(prev => prev?.map(it => ({ ...it, price_type_name: ptName, price_type_id: matchedPriceType?.id || it?.price_type_id })) || []);
    }
  };

  const handleSalesRepChange = (repId) => {
    const rep = salesReps?.find(r => r?.id === repId);
    setForm(f => ({ ...f, sales_rep_id: repId, sales_rep_name: rep ? rep?.full_name : '' }));
  };

  const handleLocationChange = (locationId) => {
    const loc = locations?.find(l => l?.id === locationId);
    setForm(f => ({ ...f, location_id: locationId, location_name: loc ? `${loc?.code} - ${loc?.name}` : '' }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated?.[idx], [field]: value };
      if (field === 'price_tax_inc') {
        const raw = String(value).replace(/,/g, '');
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return prev;
        item.price_tax_inc = raw;
      }
      // Btl Qty → Ctn Qty only (Ctn Qty does NOT convert back to Btl Qty)
      if (field === 'btl_qty') {
        const btl = parseFloat(value);
        const pack = parseFloat(item?.pack_unit) || 1;
        if (!isNaN(btl) && value !== '' && value !== null) item.ctn_qty = pack > 0 ? parseFloat((btl / pack).toFixed(4)) : 0;
        else if (value === '' || value === null) item.ctn_qty = '';
      }
      if (field === 'price_tax_inc') {
        const ctn = parseFloat(item?.ctn_qty) || 0;
        const priceTaxInc = parseFloat(String(value).replace(/,/g, '')) || 0;
        const taxRate = parseFloat(item?.tax_rate) || 0;
        item.price_ex_tax = taxRate > 0 ? parseFloat((priceTaxInc / (1 + taxRate / 100)).toFixed(6)) : parseFloat(priceTaxInc.toFixed(6));
        item.pre_tax = parseFloat((ctn * item.price_ex_tax).toFixed(2));
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        item.value_tax_inc = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
      }
      if (field === 'ctn_qty' || field === 'btl_qty') {
        const ctnForCalc = field === 'ctn_qty' ? (parseFloat(value) || 0) : (parseFloat(item?.ctn_qty) || 0);
        const price = parseFloat(item?.price_ex_tax) || 0;
        const taxRate = parseFloat(item?.tax_rate) || 0;
        item.pre_tax = parseFloat((ctnForCalc * price).toFixed(2));
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        item.value_tax_inc = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
      }
      updated[idx] = item;
      const isLastRow = idx === updated.length - 1;
      const hasValue = value !== '' && value !== null && value !== undefined;
      if (isLastRow && hasValue) return [...updated, emptyItem()];
      return updated;
    });
  };

  const handleProductSelect = async (idx, productId) => {
    const prod = products?.find(p => p?.id === productId);
    if (!prod) return;
    const baseUpdate = {
      product_id: prod?.id,
      item_code: prod?.product_code,
      item_name: prod?.product_name,
      pack_unit: prod?.pack_unit || '',
      _price_from_list: false,
    };
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated?.[idx], ...baseUpdate };
      const isLastRow = idx === updated.length - 1;
      return isLastRow ? [...updated, emptyItem()] : updated;
    });
    const orderDate = form?.order_date || today();
    const customerPriceTypeId = form?.customer_price_type_id || null;
    const priceData = await fetchPriceForProduct(prod?.product_code, orderDate, customerPriceTypeId);
    if (priceData) {
      const ptName = priceTypes?.find(pt => pt?.id === priceData?.price_type_id)?.price_type_name || '';
      setItems(prev => {
        const u = [...prev];
        const targetIdx = u.findIndex((it, i) => i === idx || (it?.product_id === prod?.id && it?.item_code === prod?.product_code));
        const rowIdx = targetIdx >= 0 ? targetIdx : idx;
        if (!u[rowIdx]) return u;
        const item = { ...u[rowIdx] };
        if (priceData.price_tax_inc != null) item.price_tax_inc = priceData.price_tax_inc;
        if (priceData.price_ex_tax != null) { item.price_ex_tax = priceData.price_ex_tax; item._price_from_list = true; }
        item.tax_rate = priceData.tax_rate_percent || 0;
        if (priceData.pack_unit != null) item.pack_unit = priceData.pack_unit;
        item.price_type_id = priceData.price_type_id ?? null;
        item.price_type_name = ptName;
        const ctn = parseFloat(item.ctn_qty) || 0;
        const price = parseFloat(item.price_ex_tax) || 0;
        const tr = parseFloat(item.tax_rate) || 0;
        item.pre_tax = parseFloat((ctn * price).toFixed(2));
        item.tax_amt = parseFloat((item.pre_tax * tr / 100).toFixed(2));
        item.value_tax_inc = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
        u[rowIdx] = item;
        return u;
      });
    }
  };

  const removeItem = (idx) => setItems(prev => prev?.filter((_, i) => i !== idx));

  const totals = items?.reduce((acc, it) => ({
    btl_qty: acc?.btl_qty + (parseFloat(it?.btl_qty) || 0),
    ctn_qty: acc?.ctn_qty + (parseFloat(it?.ctn_qty) || 0),
    pre_tax: acc?.pre_tax + (parseFloat(it?.pre_tax) || 0),
    tax_amt: acc?.tax_amt + (parseFloat(it?.tax_amt) || 0),
    value_tax_inc: acc?.value_tax_inc + (parseFloat(it?.value_tax_inc) || 0),
  }), { btl_qty: 0, ctn_qty: 0, pre_tax: 0, tax_amt: 0, value_tax_inc: 0 });

  const fmt = (v) => { const n = parseFloat(v); return isNaN(n) ? '0.00' : n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const fmt6 = (v) => { const n = parseFloat(v); return isNaN(n) ? '0.000000' : n?.toLocaleString('en-GB', { minimumFractionDigits: 6, maximumFractionDigits: 6 }); };
  const fmtNum = (v) => { const n = parseFloat(v); return (isNaN(n) || n === 0) ? '' : n?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }); };

  const handleSave = async (andNew = false) => {
    if (!form?.customer_id && !form?.customer_name) { setError('Please select a customer.'); return; }
    if (!form?.order_date) { setError('Order Date is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const orderData = {
        order_no: form?.order_no || `SO-${form?.order_date}-001`,
        customer_id: form?.customer_id || null,
        customer_code: form?.customer_code,
        customer_name: form?.customer_name,
        sales_rep_id: form?.sales_rep_id || null,
        sales_rep_name: form?.sales_rep_name,
        location_id: form?.location_id || null,
        location_name: form?.location_name,
        balance_outstanding: parseFloat(form?.balance_outstanding) || 0,
        order_date: form?.order_date,
        delivery_date: form?.delivery_date || null,
        due_date: form?.delivery_date || null,
        amount: totals?.pre_tax,
        vat: totals?.tax_amt,
        total: totals?.value_tax_inc,
        status: 'draft',
        notes: form?.notes,
        updated_at: new Date()?.toISOString(),
      };

      let savedOrderId = orderId;
      if (isEdit) {
        const { error: updErr } = await supabase?.from('sales_orders')?.update(orderData)?.eq('id', orderId);
        if (updErr) throw updErr;
        await supabase?.from('sales_order_items')?.delete()?.eq('order_id', orderId);
      } else {
        const { data: newOrder, error: insErr } = await supabase?.from('sales_orders')?.insert(orderData)?.select()?.single();
        if (insErr) throw insErr;
        savedOrderId = newOrder?.id;
      }

      const validItems = items?.filter(it => {
        const hasCode = !!(it?.item_code || it?.item_name || it?.product_id);
        const ctnQty = parseFloat(it?.ctn_qty);
        const btlQty = parseFloat(it?.btl_qty);
        const hasQty = (!isNaN(ctnQty) && ctnQty !== 0) || (!isNaN(btlQty) && btlQty !== 0);
        return hasCode || hasQty;
      });

      if (validItems?.length > 0) {
        const itemsData = validItems?.map((it, i) => ({
          order_id: savedOrderId,
          product_id: it?.product_id || null,
          product_code: it?.item_code || '',
          product_name: it?.item_name || '',
          price_type_id: it?.price_type_id || null,
          price_type_name: it?.price_type_name || '',
          pack_unit: isNaN(parseFloat(it?.pack_unit)) ? 0 : parseFloat(it?.pack_unit),
          btl_qty: isNaN(parseFloat(it?.btl_qty)) ? 0 : parseFloat(it?.btl_qty),
          ctn_qty: isNaN(parseFloat(it?.ctn_qty)) ? 0 : parseFloat(it?.ctn_qty),
          price_ex_tax: isNaN(parseFloat(it?.price_ex_tax)) ? 0 : parseFloat(it?.price_ex_tax),
          pre_tax: isNaN(parseFloat(it?.pre_tax)) ? 0 : parseFloat(it?.pre_tax),
          tax_rate: isNaN(parseFloat(it?.tax_rate)) ? 0 : parseFloat(it?.tax_rate),
          tax_amt: isNaN(parseFloat(it?.tax_amt)) ? 0 : parseFloat(it?.tax_amt),
          price_tax_inc: isNaN(parseFloat(it?.price_tax_inc)) ? 0 : parseFloat(it?.price_tax_inc),
          value_tax_inc: isNaN(parseFloat(it?.value_tax_inc)) ? 0 : parseFloat(it?.value_tax_inc),
          sort_order: i,
        }));
        const { error: itemsErr } = await supabase?.from('sales_order_items')?.insert(itemsData);
        if (itemsErr) throw itemsErr;
      }

      onSaved?.();
      if (andNew) {
        setForm({
          order_no: '',
          customer_id: '', customer_code: '', customer_name: '', customer_price_type_id: null,
          sales_rep_id: '', sales_rep_name: '', location_id: '', location_name: '',
          order_date: today(), delivery_date: '', balance_outstanding: '', notes: '',
        });
        setItems([emptyItem(), emptyItem(), emptyItem(), emptyItem()]);
        setTimeout(() => generateOrderNo(), 50);
      } else {
        onClose?.();
      }
    } catch (err) {
      setError(err?.message || 'Failed to save order.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none bg-white';
  const readOnlyInputCls = 'w-full h-7 px-2 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 cursor-default';
  const labelCls = 'text-xs font-medium text-right pr-2 whitespace-nowrap';
  const thCls = 'border border-gray-300 px-1 py-1 text-xs font-semibold text-center whitespace-nowrap bg-gray-50';
  const tdCls = 'border border-gray-200 px-0.5 py-0.5';
  const numInputCls = 'w-full h-6 px-1 text-xs border-0 text-right focus:outline-none focus:ring-1 bg-transparent appearance-none';
  const textInputCls = 'w-full h-6 px-1 text-xs border-0 focus:outline-none focus:ring-1 bg-transparent';
  const readOnlyCls = 'w-full h-6 px-1 text-xs text-right bg-gray-50 text-gray-700 cursor-default select-text';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={e => { if (e?.target === overlayRef?.current) onClose?.(); }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl flex flex-col"
        style={{ width: '96vw', maxWidth: '1100px', maxHeight: '95vh' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Sales Order' : 'New Sales Order'}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-xl leading-none font-bold">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
          )}

          {/* Header Fields - 4 rows x 3 columns (match Sales Invoice layout) */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mb-4">
            {/* Row 1: Customer | Sales Rep | Location-Out */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Customer</span>
              <div className="flex-1 relative">
                <input type="text" value={formSearchField === 'customer' ? formSearchQuery : (form?.customer_code && form?.customer_name ? `${form.customer_code} - ${form.customer_name}` : '')} onChange={e => { setFormSearchField('customer'); setFormSearchQuery(e?.target?.value); }} onFocus={() => { setFormSearchField('customer'); setFormSearchQuery(form?.customer_code && form?.customer_name ? `${form.customer_code} - ${form.customer_name}` : ''); }} onBlur={() => setTimeout(() => setFormSearchField(null), 200)} placeholder="Search customer..." className={inputCls} />
                {formSearchField === 'customer' && getFilteredCustomers(formSearchQuery)?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-48 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, customer_id: '', customer_code: '', customer_name: '', customer_price_type_id: null, balance_outstanding: '' })); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                    {getFilteredCustomers(formSearchQuery).map(c => (
                      <button key={c?.id} type="button" onMouseDown={e => { e.preventDefault(); handleCustomerSelect(c); setFormSearchField(null); setFormSearchQuery(''); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{c?.customer_code} - {c?.customer_name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Sales Rep</span>
              <div className="flex-1 relative">
                <input type="text" value={formSearchField === 'sales_rep' ? formSearchQuery : (() => { const r = salesReps?.find(x => x?.id === form?.sales_rep_id); return r ? `${r?.exec_code} - ${r?.full_name}` : ''; })()} onChange={e => { setFormSearchField('sales_rep'); setFormSearchQuery(e?.target?.value); }} onFocus={() => { const r = salesReps?.find(x => x?.id === form?.sales_rep_id); setFormSearchField('sales_rep'); setFormSearchQuery(r ? `${r?.exec_code} - ${r?.full_name}` : ''); }} onBlur={() => setTimeout(() => setFormSearchField(null), 200)} placeholder="Search sales rep..." className={inputCls} />
                {formSearchField === 'sales_rep' && getFilteredSalesReps(formSearchQuery)?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-48 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); handleSalesRepChange(''); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                    {getFilteredSalesReps(formSearchQuery).map(r => (
                      <button key={r?.id} type="button" onMouseDown={e => { e.preventDefault(); handleSalesRepChange(r?.id); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{r?.exec_code} - {r?.full_name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Location-Out</span>
              <div className="flex-1 relative">
                <input type="text" value={formSearchField === 'location' ? formSearchQuery : (() => { const l = locations?.find(x => x?.id === form?.location_id); return l ? `${l?.code} - ${l?.name}` : ''; })()} onChange={e => { setFormSearchField('location'); setFormSearchQuery(e?.target?.value); }} onFocus={() => { const l = locations?.find(x => x?.id === form?.location_id); setFormSearchField('location'); setFormSearchQuery(l ? `${l?.code} - ${l?.name}` : ''); }} onBlur={() => setTimeout(() => setFormSearchField(null), 200)} placeholder="Search location..." className={inputCls} />
                {formSearchField === 'location' && getFilteredLocations(formSearchQuery)?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-48 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); handleLocationChange(''); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                    {getFilteredLocations(formSearchQuery).map(l => (
                      <button key={l?.id} type="button" onMouseDown={e => { e.preventDefault(); handleLocationChange(l?.id); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{l?.code} - {l?.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Balance Outstanding | Order Date | Delivery Date */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Balance Outsd.</span>
              <input type="text" value={form?.balance_outstanding !== '' ? parseFloat(form?.balance_outstanding || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} readOnly className={readOnlyInputCls} placeholder="0.00" />
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Order Date</span>
              <input type="date" value={form?.order_date} onChange={e => handleFormChange('order_date', e?.target?.value)} className={inputCls} />
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Delivery Date</span>
              <input type="date" value={form?.delivery_date} onChange={e => handleFormChange('delivery_date', e?.target?.value)} className={inputCls} />
            </div>

            {/* Row 3: Order No | Notes (span 2) */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Order No</span>
              <input type="text" value={form?.order_no || 'Auto-generated'} readOnly className={readOnlyInputCls} />
            </div>
            <div className="flex items-center col-span-2">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Notes</span>
              <input type="text" value={form?.notes} onChange={e => handleFormChange('notes', e?.target?.value)} className={inputCls} placeholder="" />
            </div>
          </div>

          {/* Line Items Grid (no tabs) */}
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full border-collapse text-xs" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th className={`${thCls} w-7`}>#</th>
                  <th className={`${thCls} w-14`} style={{ color: 'var(--color-primary)' }}>Item Code</th>
                  <th className={`${thCls} w-32`} style={{ color: 'var(--color-primary)' }}>Item Name</th>
                  <th className={`${thCls} w-24`} style={{ color: 'var(--color-primary)' }}>Price Type</th>
                  <th className={`${thCls} w-12`} style={{ color: 'var(--color-primary)' }}>Pack Unit</th>
                  <th className={`${thCls} w-12`} style={{ color: 'var(--color-primary)' }}>Btl Qty</th>
                  <th className={`${thCls} w-12`} style={{ color: 'var(--color-primary)' }}>Ctn Qty</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>Price (Ex-Tax)</th>
                  <th className={`${thCls} w-16`} style={{ color: 'var(--color-primary)' }}>Pre Tax</th>
                  <th className={`${thCls} w-16`} style={{ color: 'var(--color-primary)' }}>Tax Amt</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>Price (Tax-Inc)</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Value (Tax-Inc)</th>
                  <th className={`${thCls} w-8`}></th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item, idx) => (
                  <tr key={item?._key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className={`${tdCls} text-center text-gray-400 text-xs`}>{idx + 1}</td>
                    <td className={`${tdCls} relative`}>
                      <input type="text" ref={getRef(idx, 'item_code')} value={item?.item_code} onChange={e => { const val = e?.target?.value; handleItemChange(idx, 'item_code', val); setDropdownIdx(idx); setDropdownField('code'); setDropdownQuery(val); const prod = products?.find(p => p?.product_code?.toLowerCase() === val?.toLowerCase()); if (prod) { handleProductSelect(idx, prod?.id); setDropdownIdx(null); } }} onFocus={() => { setDropdownIdx(idx); setDropdownField('code'); setDropdownQuery(item?.item_code || ''); }} onBlur={() => setTimeout(() => setDropdownIdx(null), 200)} onKeyDown={e => handleLineKeyDown(e, idx, 'item_code')} className={textInputCls} placeholder="Code" />
                      {dropdownIdx === idx && dropdownField === 'code' && getFilteredProducts(dropdownQuery)?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-44 overflow-y-auto min-w-[200px]">
                          {getFilteredProducts(dropdownQuery).map(p => (
                            <button key={p?.id} type="button" onMouseDown={e => { e.preventDefault(); handleProductSelect(idx, p?.id); setDropdownIdx(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 flex gap-2"><span className="text-gray-400 font-mono w-16 flex-shrink-0">{p?.product_code}</span><span className="truncate">{p?.product_name}</span></button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${tdCls} relative`}>
                      <input type="text" ref={getRef(idx, 'item_name')} value={item?.item_name} onChange={e => { handleItemChange(idx, 'item_name', e?.target?.value); setDropdownIdx(idx); setDropdownField('name'); setDropdownQuery(e?.target?.value); }} onFocus={() => { setDropdownIdx(idx); setDropdownField('name'); setDropdownQuery(item?.item_name || ''); }} onBlur={() => setTimeout(() => setDropdownIdx(null), 200)} onKeyDown={e => handleLineKeyDown(e, idx, 'item_name')} className={textInputCls} placeholder="Item name" />
                      {dropdownIdx === idx && dropdownField === 'name' && getFilteredProducts(dropdownQuery)?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-44 overflow-y-auto min-w-[260px]">
                          {getFilteredProducts(dropdownQuery).map(p => (
                            <button key={p?.id} type="button" onMouseDown={e => { e.preventDefault(); handleProductSelect(idx, p?.id); setDropdownIdx(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 flex gap-2"><span className="truncate flex-1">{p?.product_name}</span><span className="text-gray-400 font-mono">{p?.product_code}</span></button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${tdCls} relative`}>
                      <input type="text" value={dropdownIdx === idx && dropdownField === 'price_type' ? dropdownQuery : (item?.price_type_name || '')} onChange={e => { setDropdownIdx(idx); setDropdownField('price_type'); setDropdownQuery(e?.target?.value); }} onFocus={() => { setDropdownIdx(idx); setDropdownField('price_type'); setDropdownQuery(item?.price_type_name || ''); }} onBlur={() => setTimeout(() => setDropdownIdx(null), 200)} placeholder="--" className={textInputCls} />
                      {dropdownIdx === idx && dropdownField === 'price_type' && getFilteredPriceTypes(dropdownQuery)?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto min-w-[140px]">
                          <button type="button" onMouseDown={e => { e.preventDefault(); setItems(prev => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], price_type_id: null, price_type_name: '' }; return u; }); setDropdownIdx(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                          {getFilteredPriceTypes(dropdownQuery).map(p => (
                            <button key={p?.id} type="button" onMouseDown={async e => { e.preventDefault(); const ptId = p?.id; setItems(prev => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], price_type_id: ptId, price_type_name: p?.price_type_name || '' }; return u; }); setDropdownIdx(null); if (ptId && item?.item_code) { const priceData = await fetchPriceForProduct(item.item_code, form?.order_date || today(), ptId); if (priceData) { setItems(prev => { const u = [...prev]; if (!u[idx]) return prev; const row = { ...u[idx], price_type_id: ptId, price_type_name: p?.price_type_name || '' }; if (priceData.price_tax_inc != null) row.price_tax_inc = priceData.price_tax_inc; if (priceData.price_ex_tax != null) { row.price_ex_tax = priceData.price_ex_tax; row._price_from_list = true; } row.tax_rate = priceData.tax_rate_percent ?? row.tax_rate; const ctn = parseFloat(row.ctn_qty) || 0; const price = parseFloat(row.price_ex_tax) || 0; const tr = parseFloat(row.tax_rate) || 0; row.pre_tax = parseFloat((ctn * price).toFixed(2)); row.tax_amt = parseFloat((row.pre_tax * tr / 100).toFixed(2)); row.value_tax_inc = parseFloat((row.pre_tax + row.tax_amt).toFixed(2)); u[idx] = row; return u; }); } } }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{p?.price_type_name}</button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${tdCls} bg-gray-50`}><span className={readOnlyCls}>{item?.pack_unit ?? ''}</span></td>
                    <td className={tdCls}><input type="number" value={item?.btl_qty} onChange={e => handleItemChange(idx, 'btl_qty', e?.target?.value)} className={numInputCls} /></td>
                    <td className={tdCls}>
                      <input
                        type="number"
                        ref={getRef(idx, 'ctn_qty')}
                        value={item?.ctn_qty}
                        onChange={e => handleItemChange(idx, 'ctn_qty', e?.target?.value)}
                        onKeyDown={e => handleLineKeyDown(e, idx, 'ctn_qty')}
                        className={numInputCls}
                        placeholder=""
                      />
                    </td>
                    <td className={`${tdCls} relative bg-gray-50 text-right`}>
                      {item?._price_from_list && (
                        <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-400" style={{ margin: '2px' }} title="Price auto-filled from price list" />
                      )}
                      <span className={readOnlyCls} title={`Price Ex-Tax: ${fmt6(item?.price_ex_tax)}`}>{fmt6(item?.price_ex_tax)}</span>
                    </td>
                    <td className={`${tdCls} bg-gray-50 text-right`}><span className="px-1 text-xs text-gray-700">{fmt(item?.pre_tax) || '0.00'}</span></td>
                    <td className={`${tdCls} bg-gray-50 text-right`}><span className="px-1 text-xs text-gray-700">{fmt(item?.tax_amt) || '0.00'}</span></td>
                    <td className={`${tdCls} text-right`}>
                      <input type="text" inputMode="decimal" value={focusedPriceTaxIncIdx === idx ? (item?.price_tax_inc ?? '') : fmt(item?.price_tax_inc)} onChange={e => handleItemChange(idx, 'price_tax_inc', e?.target?.value)} onFocus={() => setFocusedPriceTaxIncIdx(idx)} onBlur={() => setFocusedPriceTaxIncIdx(null)} className={numInputCls} placeholder="0.00" />
                    </td>
                    <td className={`${tdCls} bg-gray-50 text-right`}><span className="px-1 text-xs text-gray-700">{fmt(item?.value_tax_inc) || '0.00'}</span></td>
                    <td className={`${tdCls} text-center`}>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={5} className="border border-gray-300 px-2 py-1 text-right text-xs text-gray-500"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmtNum(totals?.btl_qty) || ''}</td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmtNum(totals?.ctn_qty) || ''}</td>
                  <td className="border border-gray-300 px-1 py-1"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.pre_tax)}</td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.tax_amt)}</td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.value_tax_inc)}</td>
                  <td className="border border-gray-300 px-1 py-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-xs text-gray-500">Price auto-filled from price list (editable)</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button onClick={() => handleSave(false)} disabled={saving} className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-60" style={{ backgroundColor: 'var(--color-primary)' }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-60" style={{ backgroundColor: '#1565c0' }}>Save & New</button>
          <button onClick={() => window.print()} className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors" style={{ backgroundColor: '#f9a825' }}>Print</button>
          <div className="flex-1" />
          <button onClick={onClose} className="h-9 px-5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderForm;
