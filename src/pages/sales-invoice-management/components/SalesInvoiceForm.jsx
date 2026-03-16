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
  _is_returnable: false,
  _bottle_cost: 0,
  _plastic_cost: 0,
  _empties_type: '',
});

const today = () => new Date()?.toISOString()?.slice(0, 10);

const fetchPriceForProduct = async (productCode, invoiceDate, customerPriceTypeId) => {
  if (!productCode || !invoiceDate) return null;
  try {
    // Use price_list_header_id FK (header_id also exists); filter by start_date or effective_date
    const { data, error } = await supabase
      .from('price_list_items')
      .select(`
        id, product_code, pack_unit, price, unit_price, price_tax_inc, tax_rate_id, vat_type,
        price_list_headers!price_list_header_id(id, status, start_date, effective_date, price_type_id)
      `)
      .eq('product_code', productCode);

    if (error) {
      console.warn('fetchPriceForProduct query error:', error);
      return null;
    }
    // Filter and sort in JS (Supabase embed filters can be finicky with multiple FKs)
    const withHeader = (data || []).filter(r => r?.price_list_headers != null);
    const byDate = (a, b) => {
      const dA = a?.price_list_headers?.effective_date || a?.price_list_headers?.start_date || '';
      const dB = b?.price_list_headers?.effective_date || b?.price_list_headers?.start_date || '';
      return (dB || '').localeCompare(dA || '');
    };
    const sorted = withHeader
      .filter(r => {
        const d = r?.price_list_headers?.effective_date || r?.price_list_headers?.start_date;
        return d && String(d) <= String(invoiceDate);
      })
      .sort(byDate);

    if (sorted.length === 0) return null;

    let matched = null;
    if (customerPriceTypeId) {
      matched = sorted.find(r => r?.price_list_headers?.price_type_id === customerPriceTypeId);
    }
    if (!matched) matched = sorted[0];
    if (!matched) return null;

    let taxRatePercent = 0;
    if (matched?.tax_rate_id) {
      const { data: trData } = await supabase.from('tax_rates').select('rate, rate_percent').eq('id', matched.tax_rate_id).single();
      taxRatePercent = parseFloat(trData?.rate) ?? parseFloat(trData?.rate_percent) ?? 0;
    }

    // Prefer price_tax_inc, then price, then unit_price (price_tax_inc may be 0/default in legacy rows)
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
    console.error('fetchPriceForProduct error:', e);
    return null;
  }
};

const SalesInvoiceForm = ({ invoice, onClose, onSaved }) => {
  const invoiceId = invoice?.id || null;
  const isEdit = !!invoiceId;
  const overlayRef = useRef(null);
  const rowRefs = useRef({});

  const [activeTab, setActiveTab] = useState('invoice');

  const [form, setForm] = useState({
    invoice_no: '',
    customer_id: '',
    customer_code: '',
    customer_name: '',
    customer_price_type_id: null,
    sales_rep_id: '',
    sales_rep_name: '',
    location_id: '',
    location_name: '',
    balance_outstanding: '',
    invoice_date: today(),
    delivery_date: '',
    vat_invoice_no: '',
    driver_name: '',
    payment_terms: '',
    trip_status: 'Pending',
    vehicle_no: '',
    notes: '',
  });

  const [items, setItems] = useState(
    isEdit ? [] : [emptyItem(), emptyItem(), emptyItem(), emptyItem()]
  );

  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dropdownIdx, setDropdownIdx] = useState(null);
  const [dropdownField, setDropdownField] = useState(null); // 'code' | 'name' | 'price_type'
  const [dropdownQuery, setDropdownQuery] = useState('');
  const [formSearchField, setFormSearchField] = useState(null); // 'customer' | 'sales_rep' | 'location' | 'driver' | 'vehicle' | 'payment_terms'
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [focusedPriceTaxIncIdx, setFocusedPriceTaxIncIdx] = useState(null);
  const [emptiesOwed, setEmptiesOwed] = useState({}); // { empties_type: number }
  const [emptiesReceived, setEmptiesReceived] = useState({}); // { empties_type: number } - physically returned

  const getFilteredPaymentTerms = (query) => {
    const opts = ['Cash', 'Net 7', 'Net 14', 'Net 30', 'Net 60', 'Credit'];
    if (!query?.trim()) return opts;
    const q = String(query).toLowerCase().trim();
    return opts.filter(pt => pt?.toLowerCase().includes(q));
  };

  const getFilteredProducts = useCallback((query) => {
    if (!query || !products?.length) return products?.slice(0, 20) || [];
    const q = String(query).toLowerCase().trim();
    return products.filter(p =>
      p?.product_code?.toLowerCase()?.includes(q) ||
      p?.product_name?.toLowerCase()?.includes(q)
    ).slice(0, 20);
  }, [products]);

  const getFilteredCustomers = useCallback((query) => {
    if (!customers?.length) return [];
    if (!query?.trim()) return customers.slice(0, 30);
    const q = String(query).toLowerCase().trim();
    return customers.filter(c =>
      c?.customer_code?.toLowerCase()?.includes(q) ||
      c?.customer_name?.toLowerCase()?.includes(q)
    ).slice(0, 30);
  }, [customers]);

  const getFilteredSalesReps = useCallback((query) => {
    if (!salesReps?.length) return [];
    if (!query?.trim()) return salesReps.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return salesReps.filter(r =>
      r?.exec_code?.toLowerCase()?.includes(q) ||
      r?.full_name?.toLowerCase()?.includes(q)
    ).slice(0, 20);
  }, [salesReps]);

  const getFilteredLocations = useCallback((query) => {
    if (!locations?.length) return [];
    if (!query?.trim()) return locations.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return locations.filter(l =>
      l?.code?.toLowerCase()?.includes(q) ||
      l?.name?.toLowerCase()?.includes(q)
    ).slice(0, 20);
  }, [locations]);

  const getFilteredDrivers = useCallback((query) => {
    if (!drivers?.length) return [];
    if (!query?.trim()) return drivers.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return drivers.filter(d => String(d).toLowerCase().includes(q)).slice(0, 20);
  }, [drivers]);

  const getFilteredVehicles = useCallback((query) => {
    if (!vehicles?.length) return [];
    if (!query?.trim()) return vehicles.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return vehicles.filter(v => String(v).toLowerCase().includes(q)).slice(0, 20);
  }, [vehicles]);

  const getFilteredPriceTypes = useCallback((query) => {
    if (!priceTypes?.length) return [];
    if (!query?.trim()) return priceTypes.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return priceTypes.filter(p => p?.price_type_name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [priceTypes]);

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

  const loadReferenceData = async () => {
    try {
      const [custRes, repRes, locRes, prodRes, ptRes, siRes, piRes] = await Promise.all([
        supabase.from('customers').select('id, customer_code, customer_name, price_type, price_type_id, outstanding_balance, business_executive, location_id, location').order('customer_name'),
        supabase.from('business_executives').select('id, exec_code, full_name').order('full_name'),
        supabase.from('locations').select('id, code, name').order('name'),
        supabase.from('products').select('id, product_code, product_name, pack_unit, is_taxable, bottle_cost, plastic_cost, is_returnable, empties_type').order('product_name'),
        supabase.from('price_types').select('id, price_type_name').order('price_type_name'),
        supabase.from('sales_invoices').select('driver_name, vehicle_no'),
        supabase.from('purchase_invoices').select('driver_name, vehicle_no'),
      ]);
      // Deduplicate customers by customer_code (business key); fallback to id if no code
      const rawCustomers = custRes?.data || [];
      const seen = new Set();
      const dedupedCustomers = rawCustomers.filter(c => {
        const key = (c?.customer_code || '').trim() || c?.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCustomers(dedupedCustomers);
      setSalesReps(repRes?.data || []);
      setLocations(locRes?.data || []);
      setProducts(prodRes?.data || []);
      setPriceTypes(ptRes?.data || []);
      const siData = siRes?.data || [];
      const piData = piRes?.data || [];
      const allDrivers = [...siData.map(r => r?.driver_name), ...piData.map(r => r?.driver_name)].filter(v => v != null && String(v).trim() !== '');
      const allVehicles = [...siData.map(r => r?.vehicle_no), ...piData.map(r => r?.vehicle_no)].filter(v => v != null && String(v).trim() !== '');
      setDrivers([...new Set(allDrivers)].sort());
      setVehicles([...new Set(allVehicles)].sort());
      if (custRes?.error) console.warn('Customers load error:', custRes.error);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  useEffect(() => { loadReferenceData(); }, []);

  // Fetch owed empties (from all saved transactions, same pattern as customer balance)
  const fetchOwedEmpties = useCallback(async () => {
    const customerId = form?.customer_id;
    if (!customerId) {
      setEmptiesOwed({});
      return;
    }
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, delivery_date, invoice_date')
        .eq('customer_id', customerId);

      const pastInvIds = (invData || [])
        .filter(inv => inv?.id !== invoiceId)
        .map(inv => inv?.id)
        .filter(Boolean);

      const soldByType = {};
      const emptiesSoldByType = {};
      if (pastInvIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('sales_invoice_items')
          .select('product_id, product_code, product_name, ctn_qty, btl_qty, invoice_id, is_returnable')
          .in('invoice_id', pastInvIds);

        const productIds = [...new Set((itemsData || []).map(r => r?.product_id).filter(Boolean))];
        let prodMap = {};
        if (productIds.length > 0) {
          const { data: prodData } = await supabase.from('products').select('id, empties_type').in('id', productIds);
          prodMap = Object.fromEntries((prodData || []).map(p => [p?.id, p?.empties_type || 'Other']));
        }
        const isEmpties = (r) => {
          const n = String(r?.product_name || '').toLowerCase();
          const c = String(r?.product_code || '').toLowerCase();
          return n.includes('empties') || c.includes('empties');
        };
        for (const r of itemsData || []) {
          const et = prodMap[r.product_id] || 'Other';
          const qty = parseFloat(r.ctn_qty) || parseFloat(r.btl_qty) || 0;
          if (isEmpties(r)) {
            emptiesSoldByType[et] = (emptiesSoldByType[et] || 0) + qty;
          } else if (r?.is_returnable && qty > 0) {
            soldByType[et] = (soldByType[et] || 0) + qty;
          }
        }
      }

      const { data: recData } = await supabase
        .from('empties_receive_header')
        .select('id')
        .eq('customer_id', customerId);
      const recIds = (recData || []).map(r => r?.id).filter(Boolean);

      const receivedByType = {};
      if (recIds.length > 0) {
        const { data: recItems } = await supabase
          .from('empties_receive_items')
          .select('empties_type, qty')
          .in('header_id', recIds);
        for (const r of recItems || []) {
          const et = r?.empties_type || 'Other';
          receivedByType[et] = (receivedByType[et] || 0) + (parseFloat(r.qty) || 0);
        }
      }

      // sales_invoice_empties: received from all saved invoices (excluding current)
      const { data: invEmptiesRaw } = await supabase
        .from('sales_invoice_empties')
        .select('invoice_id, empties_type, received_qty');
      const { data: invForEmpties } = await supabase
        .from('sales_invoices')
        .select('id, customer_id')
        .eq('customer_id', customerId);
      const invLookup = Object.fromEntries((invForEmpties || []).map(i => [i?.id, i]));
      for (const r of invEmptiesRaw || []) {
        const inv = invLookup[r?.invoice_id];
        if (!inv || inv?.id === invoiceId) continue;
        const et = r?.empties_type || 'Other';
        receivedByType[et] = (receivedByType[et] || 0) + (parseFloat(r?.received_qty) || 0);
      }

      const owed = {};
      const allTypes = new Set([...Object.keys(soldByType), ...Object.keys(receivedByType), ...Object.keys(emptiesSoldByType)]);
      for (const et of allTypes) {
        const sold = soldByType[et] || 0;
        const recv = receivedByType[et] || 0;
        const emptiesSold = emptiesSoldByType[et] || 0;
        owed[et] = Math.max(0, sold - recv - emptiesSold);
      }
      setEmptiesOwed(owed);
    } catch (err) {
      console.error('fetchOwedEmpties error:', err);
      setEmptiesOwed({});
    }
  }, [form?.customer_id, invoiceId]);

  useEffect(() => {
    fetchOwedEmpties();
  }, [fetchOwedEmpties]);

  // Fetch customer outstanding balance from sales_invoices (same pattern as empties - computed from transactions)
  const fetchCustomerBalance = useCallback(async () => {
    const customerId = form?.customer_id;
    if (!customerId) return;
    try {
      const { data: invData } = await supabase
        .from('sales_invoices')
        .select('id, balance_outstanding, total_tax_inc_value')
        .eq('customer_id', customerId);
      let balance = 0;
      for (const inv of invData || []) {
        if (inv?.id === invoiceId) continue;
        const ob = parseFloat(inv?.balance_outstanding);
        const total = parseFloat(inv?.total_tax_inc_value);
        balance += (Number.isFinite(ob) && ob > 0) ? ob : (Number.isFinite(total) ? total : 0);
      }
      setForm(f => (f?.customer_id === customerId ? { ...f, balance_outstanding: balance } : f));
    } catch (err) {
      console.error('fetchCustomerBalance error:', err);
    }
  }, [form?.customer_id, invoiceId]);

  useEffect(() => {
    if (form?.customer_id) fetchCustomerBalance();
  }, [form?.customer_id, fetchCustomerBalance]);

  const prevCustomerIdRef = useRef(null);
  useEffect(() => {
    if (prevCustomerIdRef.current != null && prevCustomerIdRef.current !== form?.customer_id) {
      setEmptiesReceived({});
    }
    prevCustomerIdRef.current = form?.customer_id;
  }, [form?.customer_id]);

  // Re-fetch prices for items when invoice date or customer price type changes
  useEffect(() => {
    const run = async () => {
      const invoiceDate = form?.invoice_date || today();
      const customerPriceTypeId = form?.customer_price_type_id || null;
      const currentItems = items?.filter(it => it?.product_id && it?.item_code) || [];
      if (currentItems.length === 0) return;
      const updates = [];
      for (let i = 0; i < items?.length || 0; i++) {
        const it = items[i];
        if (!it?.product_id || !it?.item_code) continue;
        const priceData = await fetchPriceForProduct(it.item_code, invoiceDate, customerPriceTypeId);
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
  }, [form?.invoice_date, form?.customer_price_type_id]);

  // Auto-apply promotions: fetch active promos and add FREE line items when rules match
  useEffect(() => {
    const applyPromotions = async () => {
      const invoiceDate = form?.invoice_date || today();
      const locId = form?.location_id || null;
      const priceTypeId = form?.customer_price_type_id || null;
      const dayOfWeek = (() => { const d = new Date(invoiceDate + 'T12:00:00'); return d.getDay(); })(); // 0=Sun..6=Sat

      const paidItems = items?.filter(it => {
        const n = String(it?.item_name || '').toLowerCase();
        const c = String(it?.item_code || '').toLowerCase();
        return !n.includes('free') && !c.includes('free') && (it?.product_id || it?.item_code);
      }) || [];
      if (paidItems.length === 0) return;

      try {
        const { data: promos } = await supabase
          ?.from('promotions')
          ?.select('id, budget_cartons, consumed_cartons, location_ids, price_type_ids, days_of_week')
          ?.eq('active', true)
          ?.lte('start_date', invoiceDate)
          ?.gte('end_date', invoiceDate);
        if (!promos?.length) return;

        const applicable = promos.filter(p => {
          const locIds = Array.isArray(p?.location_ids) ? p.location_ids : (p?.location_ids ? JSON.parse(p.location_ids || '[]') : []);
          const ptIds = Array.isArray(p?.price_type_ids) ? p.price_type_ids : (p?.price_type_ids ? JSON.parse(p.price_type_ids || '[]') : []);
          const days = Array.isArray(p?.days_of_week) ? p.days_of_week : (p?.days_of_week ? JSON.parse(p.days_of_week || '[]') : []);
          if (locIds?.length && !locIds.includes(locId)) return false;
          if (ptIds?.length && !ptIds.includes(priceTypeId)) return false;
          if (days?.length && !days.includes(dayOfWeek)) return false;
          return true;
        });
        if (!applicable.length) return;

        const promoIds = applicable.map(p => p?.id).filter(Boolean);
        const { data: rules } = await supabase
          ?.from('promotion_rules')
          ?.select('*')
          ?.in('promotion_id', promoIds)
          ?.order('sort_order');
        if (!rules?.length) return;

        const toUnit = (u) => String(u || '').toLowerCase();
        const isBottles = (u) => toUnit(u).includes('bottle') || toUnit(u) === 'pieces';
        const qtyByProduct = {};
        const qtyByProductBottles = {};
        let lastIdxByProduct = {};
        paidItems.forEach((it, idx) => {
          const pid = it?.product_id;
          const ctn = parseFloat(it?.ctn_qty) || 0;
          const btl = parseFloat(it?.btl_qty) || 0;
          if (pid) {
            if (ctn > 0) { qtyByProduct[pid] = (qtyByProduct[pid] || 0) + ctn; lastIdxByProduct[pid] = idx; }
            if (btl > 0) { qtyByProductBottles[pid] = (qtyByProductBottles[pid] || 0) + btl; lastIdxByProduct[pid] = idx; }
          }
        });

        const promoLinesWithInsert = [];
        for (const rule of rules) {
          const buyPid = rule?.buy_product_id;
          const rewardPid = rule?.reward_product_id;
          const buyQty = parseFloat(rule?.buy_qty) || 1;
          const rewardQty = parseFloat(rule?.reward_qty) || 1;
          const buyUnit = rule?.buy_unit || 'Cartons';
          const rewardUnit = rule?.reward_unit || 'Cartons';
          const useBottles = isBottles(buyUnit);
          const bought = useBottles ? (qtyByProductBottles[buyPid] || 0) : (qtyByProduct[buyPid] || 0);
          const times = Math.floor(bought / buyQty);
          if (times <= 0 || !rewardPid) continue;

          const rewardTotal = times * rewardQty;
          const promo = applicable.find(p => p?.id === rule?.promotion_id);
          if (promo?.budget_cartons != null) {
            const consumed = parseFloat(promo?.consumed_cartons) || 0;
            const remaining = Math.max(0, promo.budget_cartons - consumed);
            if (rewardTotal > remaining) continue;
          }

          const prod = products?.find(p => p?.id === rewardPid);
          const code = rule?.reward_product_code || prod?.product_code || '';
          const name = rule?.reward_product_name || prod?.product_name || '';
          const packUnit = Math.max(1, parseFloat(prod?.pack_unit) || 1);
          const priceTypeName = priceTypes?.find(pt => pt?.id === form?.customer_price_type_id)?.price_type_name || '';
          const insertAfterIdx = lastIdxByProduct[buyPid] ?? -1;
          const rewardInBottles = isBottles(rewardUnit);
          const ctnQty = rewardInBottles ? parseFloat((rewardTotal / packUnit).toFixed(4)) : rewardTotal;
          promoLinesWithInsert.push({
            line: {
              _key: `promo-${rule?.id}-${rewardPid}`,
              _is_promo: true,
              product_id: rewardPid,
              item_code: code,
              item_name: `${code} FREE ${name}`.trim(),
              pack_unit: packUnit,
              btl_qty: '',
              ctn_qty: ctnQty,
              price_ex_tax: 0,
              pre_tax: 0,
              tax_rate: 0,
              tax_amt: 0,
              price_tax_inc: 0,
              value_tax_inc: 0,
              price_type_id: form?.customer_price_type_id || null,
              price_type_name: priceTypeName,
              _price_from_list: false,
              _is_returnable: prod?.is_returnable === true,
              _bottle_cost: parseFloat(prod?.bottle_cost) || 0,
              _plastic_cost: parseFloat(prod?.plastic_cost) || 0,
              _empties_type: prod?.empties_type || '',
            },
            insertAfterIdx,
          });
        }

        if (promoLinesWithInsert.length > 0) {
          setItems(prev => {
            const withoutPromo = (prev || []).filter(it => !it?._is_promo);
            const merged = [];
            for (let i = 0; i < withoutPromo.length; i++) {
              const toInsert = promoLinesWithInsert.filter(p => p.insertAfterIdx === i - 1).map(p => p.line);
              merged.push(...toInsert);
              merged.push(withoutPromo[i]);
            }
            merged.push(...promoLinesWithInsert.filter(p => p.insertAfterIdx === withoutPromo.length - 1).map(p => p.line));
            const existingPromo = (prev || []).filter(it => it?._is_promo);
            const newPromos = merged.filter(it => it?._is_promo);
            const samePromo = existingPromo.length === newPromos.length &&
              newPromos.every((p, i) => existingPromo[i]?.product_id === p?.product_id &&
                (parseFloat(existingPromo[i]?.ctn_qty) || 0) === (parseFloat(p?.ctn_qty) || 0) &&
                (parseFloat(existingPromo[i]?.btl_qty) || 0) === (parseFloat(p?.btl_qty) || 0));
            if (samePromo) return prev;
            return merged;
          });
        } else {
          setItems(prev => {
            const hasPromo = (prev || []).some(it => it?._is_promo);
            if (!hasPromo) return prev;
            return (prev || []).filter(it => !it?._is_promo);
          });
        }
      } catch (err) {
        console.warn('applyPromotions error:', err);
      }
    };

    if (form?.invoice_date && products?.length) applyPromotions();
  }, [form?.invoice_date, form?.location_id, form?.customer_price_type_id, items, products]);

  // Populate form when editing
  useEffect(() => {
    if (!invoice) return;
    setForm({
      invoice_no: invoice?.invoice_no || '',
      customer_id: invoice?.customer_id || '',
      customer_code: invoice?.customer_code || '',
      customer_name: invoice?.customer_name || '',
      customer_price_type_id: invoice?.customer_price_type_id || null,
      sales_rep_id: invoice?.sales_rep_id || '',
      sales_rep_name: invoice?.sales_rep_name || '',
      location_id: invoice?.location_id || '',
      location_name: invoice?.location_name || '',
      balance_outstanding: invoice?.balance_outstanding ?? '',
      invoice_date: invoice?.invoice_date || today(),
      delivery_date: invoice?.delivery_date || '',
      vat_invoice_no: invoice?.vat_invoice_no || '',
      driver_name: invoice?.driver_name || '',
      payment_terms: invoice?.payment_terms || '',
      trip_status: invoice?.trip_status || 'Pending',
      vehicle_no: invoice?.vehicle_no || '',
      notes: invoice?.notes || '',
    });
    if (invoice?.items && invoice.items.length > 0) {
      const isPromo = (it) => (String(it?.product_name || '') + String(it?.product_code || '')).toLowerCase().includes('free');
      setItems(invoice.items.map(it => ({
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
        _is_returnable: it?.is_returnable === true,
        _bottle_cost: it?.bottle_cost ?? 0,
        _plastic_cost: it?.plastic_cost ?? 0,
        _empties_type: products?.find(x => x?.id === it?.product_id)?.empties_type || '',
        _is_promo: isPromo(it),
      })));
    } else {
      setItems([emptyItem(), emptyItem(), emptyItem(), emptyItem()]);
    }
    if (invoice?.empties?.length) {
      const recv = {};
      for (const e of invoice.empties) {
        const et = e?.empties_type || 'Other';
        const r = parseFloat(e?.received_qty);
        if (!isNaN(r) && r !== 0) recv[et] = r;
      }
      setEmptiesReceived(recv);
    } else {
      setEmptiesReceived({});
    }
  }, [invoice?.id, products, invoice?.empties]);

  // Generate invoice number SI-yyyy-mm-dd-xxx
  const generateInvoiceNo = useCallback(async () => {
    if (isEdit) return;
    try {
      const dateStr = form?.invoice_date || today();
      const prefix = `SI-${dateStr}`;
      const { data } = await supabase?.from('sales_invoices')
        ?.select('invoice_no')
        ?.like('invoice_no', `${prefix}-%`)
        ?.order('invoice_no', { ascending: false })
        ?.limit(1);
      const last = data?.[0]?.invoice_no;
      let seq = 1;
      if (last) {
        const parts = last?.split('-');
        const lastSeq = parseInt(parts?.[parts?.length - 1], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      setForm(f => ({ ...f, invoice_no: `${prefix}-${String(seq)?.padStart(3, '0')}` }));
    } catch {
      setForm(f => ({ ...f, invoice_no: `SI-${form?.invoice_date || today()}-001` }));
    }
  }, [form?.invoice_date, isEdit]);

  useEffect(() => {
    if (!isEdit && !form?.invoice_no) generateInvoiceNo();
  }, []);

  const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleCustomerSelect = async (customer) => {
    // Balance is computed by fetchCustomerBalance (from sales_invoices, same pattern as empties owed)
    // Match price type by UUID directly (customer.price_type_id)
    let matchedPriceType = customer?.price_type_id
      ? priceTypes?.find(pt => pt?.id === customer?.price_type_id)
      : null;
    // Fallback: text match using price_type_name column
    if (!matchedPriceType && customer?.price_type) {
      matchedPriceType = priceTypes?.find(pt =>
        pt?.price_type_name?.toLowerCase() === customer?.price_type?.toLowerCase()
      );
    }
    // Look up sales_rep_id by matching customer.business_executive text to full_name
    const matchedRep = salesReps?.find(r =>
      r?.full_name?.toLowerCase() === customer?.business_executive?.toLowerCase() ||
      r?.exec_code?.toLowerCase() === customer?.business_executive?.toLowerCase()
    );
    // Match location by UUID directly (customer.location_id)
    const matchedLocation = customer?.location_id
      ? locations?.find(l => l?.id === customer?.location_id)
      : null;
    const customerPriceTypeName = matchedPriceType?.price_type_name || customer?.price_type || '';
    setForm(f => ({
      ...f,
      customer_id: customer?.id,
      customer_code: customer?.customer_code,
      customer_name: customer?.customer_name,
      customer_price_type_id: matchedPriceType?.id || null,
      balance_outstanding: '', // filled by fetchCustomerBalance (computed from sales_invoices)
      sales_rep_id: matchedRep?.id || f.sales_rep_id,
      sales_rep_name: matchedRep ? matchedRep?.full_name : f.sales_rep_name,
      location_id: matchedLocation?.id || f.location_id,
      location_name: matchedLocation ? `${matchedLocation?.code} - ${matchedLocation?.name}` : f.location_name,
    }));
    // Populate price type on all line items when customer is selected
    if (customerPriceTypeName) {
      setItems(prev => prev?.map(it => ({ ...it, price_type_name: customerPriceTypeName, price_type_id: matchedPriceType?.id || it?.price_type_id })) || []);
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

      // price_tax_inc: validate numeric input
      if (field === 'price_tax_inc') {
        const raw = String(value).replace(/,/g, '');
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return prev;
        item.price_tax_inc = raw;
      }

      // Btl Qty → Ctn Qty only (Ctn Qty does NOT convert back to Btl Qty)
      if (field === 'btl_qty') {
        const btl = parseFloat(value);
        const pack = parseFloat(item?.pack_unit) || 1;
        if (!isNaN(btl) && value !== '' && value !== null) {
          item.ctn_qty = pack > 0 ? parseFloat((btl / pack).toFixed(4)) : 0;
        } else if (value === '' || value === null) {
          item.ctn_qty = '';
        }
      }

      // Recalculate when price_tax_inc changes
      if (field === 'price_tax_inc') {
        const ctn = parseFloat(item?.ctn_qty) || 0;
        const priceTaxInc = parseFloat(String(value).replace(/,/g, '')) || 0;
        const taxRate = parseFloat(item?.tax_rate) || 0;
        item.price_ex_tax = taxRate > 0
          ? parseFloat((priceTaxInc / (1 + taxRate / 100)).toFixed(6))
          : parseFloat(priceTaxInc.toFixed(6));
        item.pre_tax = parseFloat((ctn * item.price_ex_tax).toFixed(2));
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        item.value_tax_inc = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
      }

      // Recalculate when qty changes
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

    const isReturnable = prod?.is_returnable === true;
    const bottleCost = parseFloat(prod?.bottle_cost) || 0;
    const plasticCost = parseFloat(prod?.plastic_cost) || 0;

    const baseUpdate = {
      product_id: prod?.id,
      item_code: prod?.product_code,
      item_name: prod?.product_name,
      pack_unit: prod?.pack_unit || '',
      _is_returnable: isReturnable,
      _bottle_cost: bottleCost,
      _plastic_cost: plasticCost,
      _empties_type: prod?.empties_type || '',
      _price_from_list: false,
    };

    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated?.[idx], ...baseUpdate };
      const isLastRow = idx === updated.length - 1;
      return isLastRow ? [...updated, emptyItem()] : updated;
    });

    const invoiceDate = form?.invoice_date || today();
    const customerPriceTypeId = form?.customer_price_type_id || null;
    const priceData = await fetchPriceForProduct(prod?.product_code, invoiceDate, customerPriceTypeId);

    if (priceData) {
      // Get price type name
      const ptName = priceTypes?.find(pt => pt?.id === priceData?.price_type_id)?.price_type_name || '';

      setItems(prev => {
        const updated = [...prev];
        const targetIdx = updated.findIndex((it, i) => i === idx || (it?.product_id === prod?.id && it?.item_code === prod?.product_code));
        const rowIdx = targetIdx >= 0 ? targetIdx : idx;
        if (!updated[rowIdx]) return updated;

        const item = { ...updated[rowIdx] };
        if (priceData.price_tax_inc !== null && priceData.price_tax_inc !== undefined) {
          item.price_tax_inc = priceData.price_tax_inc;
        }
        if (priceData.price_ex_tax !== null && priceData.price_ex_tax !== undefined) {
          item.price_ex_tax = priceData.price_ex_tax;
          item._price_from_list = true;
        }
        item.tax_rate = priceData.tax_rate_percent || 0;
        if (priceData.pack_unit !== null && priceData.pack_unit !== undefined) {
          item.pack_unit = priceData.pack_unit;
        }
        item.price_type_id = priceData.price_type_id || null;
        item.price_type_name = ptName;

        const ctn = parseFloat(item.ctn_qty) || 0;
        const price = parseFloat(item.price_ex_tax) || 0;
        const taxRate = parseFloat(item.tax_rate) || 0;
        item.pre_tax = parseFloat((ctn * price).toFixed(2));
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        item.value_tax_inc = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));

        updated[rowIdx] = item;
        return updated;
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

  // Helper: product is an empties stock item (customer buying empties = reduces expected)
  const isEmptiesProduct = (item) => {
    const name = String(item?.item_name || '').toLowerCase();
    const code = String(item?.item_code || '').toLowerCase();
    return name.includes('empties') || code.includes('empties');
  };

  // Helper: Physi Empties = empties sale or refund line (drives Sold out on statement)
  const isPhysiEmpties = (item) => {
    const name = String(item?.item_name || '').toLowerCase();
    const code = String(item?.item_code || '').toLowerCase();
    return name.includes('physi empties') || code.includes('physi empties');
  };

  // Helper: line is a promotion (FREE in name/code - separate line item for free product)
  const isPromoLine = (item) => {
    const name = String(item?.item_name || '').toLowerCase();
    const code = String(item?.item_code || '').toLowerCase();
    return name.includes('free') || code.includes('free');
  };

  // Expected: returnable line items (excl. Physi Empties) - empties going out
  const expectedByType = React.useMemo(() => {
    const m = {};
    for (const it of items || []) {
      if (isPhysiEmpties(it)) continue;
      const et = it._empties_type || 'Other';
      const ctn = parseFloat(it?.ctn_qty) || 0;
      const btl = parseFloat(it?.btl_qty) || 0;
      const qty = ctn !== 0 ? ctn : btl;
      const isReturnable = it?._is_returnable && !isEmptiesProduct(it);
      if (isReturnable) {
        m[et] = (m[et] || 0) + qty;
      } else if (isEmptiesProduct(it)) {
        m[et] = (m[et] || 0) - qty;
      }
    }
    return m;
  }, [items]);

  // Sold out: from line items with "Physi Empties" in name/code (empties sale or refund)
  const soldOutByType = React.useMemo(() => {
    const m = {};
    for (const it of items || []) {
      if (!isPhysiEmpties(it)) continue;
      const et = it._empties_type || 'Other';
      const ctn = parseFloat(it?.ctn_qty) || 0;
      const btl = parseFloat(it?.btl_qty) || 0;
      const qty = ctn !== 0 ? ctn : btl;
      if (qty > 0) m[et] = (m[et] || 0) + qty;
    }
    return m;
  }, [items]);

  // Empties summary rows: Owed, Expected, Sold out, Received, O/S
  // Sold out = from Physi Empties line items. O/S = Owed + Expected - Sold out - Received
  const emptiesSummary = React.useMemo(() => {
    const allTypes = new Set([
      ...Object.keys(emptiesOwed || {}),
      ...Object.keys(expectedByType || {}),
      ...Object.keys(soldOutByType || {}),
      ...Object.keys(emptiesReceived || {}),
    ].filter(Boolean));
    return [...allTypes].sort().map(et => {
      const owed = emptiesOwed?.[et] ?? 0;
      const expected = expectedByType?.[et] ?? 0;
      const soldOut = soldOutByType?.[et] ?? 0;
      const received = parseFloat(emptiesReceived?.[et]) || 0;
      const os = Math.max(0, owed + expected - soldOut - received);
      return { empties_type: et, owed, expected, soldOut, received, os };
    });
  }, [emptiesOwed, expectedByType, soldOutByType, emptiesReceived]);

  const handleEmptiesReceivedChange = (emptiesType, value) => {
    setEmptiesReceived(prev => {
      const v = parseFloat(value);
      if (value === '' || value == null) {
        const next = { ...prev };
        delete next[emptiesType];
        return next;
      }
      return { ...prev, [emptiesType]: isNaN(v) ? value : v };
    });
  };

  const fmt = (v) => { const n = parseFloat(v); return isNaN(n) ? '0.00' : n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const fmt6 = (v) => { const n = parseFloat(v); return isNaN(n) ? '0.000000' : n?.toLocaleString('en-GB', { minimumFractionDigits: 6, maximumFractionDigits: 6 }); };
  const fmtNum = (v) => { const n = parseFloat(v); return (isNaN(n) || n === 0) ? '' : n?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };

  const handleSave = async (andNew = false) => {
    if (!form?.customer_id && !form?.customer_name) { setError('Please select a customer.'); return; }
    setSaving(true);
    setError('');
    try {
      const invoiceData = {
        invoice_no: form?.invoice_no,
        customer_id: form?.customer_id || null,
        customer_code: form?.customer_code,
        customer_name: form?.customer_name,
        sales_rep_id: form?.sales_rep_id || null,
        sales_rep_name: form?.sales_rep_name,
        location_id: form?.location_id || null,
        location_name: form?.location_name,
        balance_outstanding: parseFloat(totals?.value_tax_inc) || 0,
        invoice_date: form?.invoice_date,
        delivery_date: form?.delivery_date || null,
        vat_invoice_no: form?.vat_invoice_no || null,
        driver_name: form?.driver_name,
        payment_terms: form?.payment_terms,
        trip_status: form?.trip_status || 'Pending',
        vehicle_no: form?.vehicle_no,
        notes: form?.notes,
        total_pre_tax: totals?.pre_tax,
        total_tax_amt: totals?.tax_amt,
        total_tax_inc_value: totals?.value_tax_inc,
        updated_at: new Date()?.toISOString(),
      };

      let invoiceIdToUse = invoiceId;
      if (isEdit) {
        const { error: updErr } = await supabase?.from('sales_invoices')?.update(invoiceData)?.eq('id', invoiceIdToUse);
        if (updErr) throw updErr;
        await supabase?.from('sales_invoice_items')?.delete()?.eq('invoice_id', invoiceIdToUse);
      } else {
        const { data: newInv, error: insErr } = await supabase?.from('sales_invoices')?.insert(invoiceData)?.select()?.single();
        if (insErr) throw insErr;
        invoiceIdToUse = newInv?.id;
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
          invoice_id: invoiceIdToUse,
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
          is_returnable: it?._is_returnable === true,
          empties_value: it?._is_returnable ? parseFloat((parseFloat(it?.ctn_qty || 0) * ((it?._plastic_cost || 0) + (it?._bottle_cost || 0))).toFixed(2)) : 0,
          sort_order: i,
        }));
        const { error: itemsErr } = await supabase?.from('sales_invoice_items')?.insert(itemsData);
        if (itemsErr) throw itemsErr;
      }

      // Persist empties: expected (from line items), sold out, received. One row per type that has expected, received, or sold out.
      await supabase?.from('sales_invoice_empties')?.delete()?.eq('invoice_id', invoiceIdToUse);
      const hasValue = (r) => (parseFloat(r?.expected) || 0) !== 0 || (parseFloat(r?.received) || 0) !== 0 || (parseFloat(r?.soldOut) || 0) !== 0;
      const emptiesToSave = emptiesSummary?.filter(hasValue) || [];
      if (emptiesToSave.length > 0) {
        const emptiesData = emptiesToSave.map(r => ({
          invoice_id: invoiceIdToUse,
          empties_type: r?.empties_type,
          received_qty: parseFloat(r?.received) || 0,
          sold_qty: parseFloat(r?.soldOut) || 0,
        }));
        await supabase?.from('sales_invoice_empties')?.insert(emptiesData);
      }

      // Post to customer AR ledger (customer_ledger) on invoice date
      // Using supplier_ledger pattern — post to customer_ledger if it exists
      try {
        await supabase?.from('supplier_ledger')
          ?.delete()
          ?.eq('reference_no', form?.invoice_no)
          ?.eq('transaction_type', 'sales_invoice');
      } catch {}

      // Stock movement on delivery date at Location-Out
      if (form?.delivery_date && form?.location_id && validItems?.length > 0) {
        try {
          await supabase?.from('stock_movements')
            ?.delete()
            ?.eq('reference_no', form?.invoice_no)
            ?.eq('transaction_type', 'sales_dispatch');

          for (const it of validItems) {
            if (!it?.product_id) continue;
            const ctnQty = parseFloat(it?.ctn_qty) || 0;
            const btlQty = parseFloat(it?.btl_qty) || 0;
            const qty = btlQty !== 0 ? btlQty : ctnQty;
            if (qty === 0) continue;

            const movement = {
              movement_date: form?.delivery_date,
              product_id: it?.product_id,
              product_code: it?.item_code || '',
              product_name: it?.item_name || '',
              location: form?.location_name || form?.location_id,
              transaction_type: 'sales_dispatch',
              quantity: -Math.abs(qty),
              unit_cost: parseFloat(it?.price_ex_tax) || 0,
              reference_no: form?.invoice_no,
              reason: `Sales Invoice ${form?.invoice_no}`,
            };
            const { error: smErr } = await supabase?.from('stock_movements')?.insert(movement);
            if (smErr) console.warn('stock_movements insert warning:', smErr?.message);

            // Decrease stock_levels_by_location
            const { data: existing } = await supabase
              ?.from('stock_levels_by_location')
              ?.select('id, stock_on_hand')
              ?.eq('product_id', it?.product_id)
              ?.eq('location_id', form?.location_id)
              ?.maybeSingle();

            if (existing) {
              const newQty = parseFloat(existing?.stock_on_hand || 0) - Math.abs(qty);
              await supabase?.from('stock_levels_by_location')
                ?.update({ stock_on_hand: newQty, last_movement_date: new Date()?.toISOString() })
                ?.eq('id', existing?.id);
            }
          }
        } catch (stockErr) {
          console.warn('Stock movement warning:', stockErr?.message);
        }
      }

      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to save invoice.');
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

  const TABS = [
    { id: 'invoice', label: 'Invoice' },
    { id: 'sales_order', label: 'Sales Order' },
    { id: 'field_sales', label: 'Field Sales' },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={e => { if (e?.target === overlayRef?.current) onClose?.(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: '96vw', maxWidth: '1100px', maxHeight: '95vh' }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Sales Invoice' : 'New Sales Invoice'}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-xl leading-none font-bold">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
          )}

          {/* Header Fields - 4 rows x 3 columns */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mb-4">
            {/* Row 1: Customer | Sales Rep | Location-Out */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Customer</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formSearchField === 'customer' ? formSearchQuery : (form?.customer_code && form?.customer_name ? `${form.customer_code} - ${form.customer_name}` : '')}
                  onChange={e => { setFormSearchField('customer'); setFormSearchQuery(e?.target?.value); }}
                  onFocus={() => { setFormSearchField('customer'); setFormSearchQuery(form?.customer_code && form?.customer_name ? `${form.customer_code} - ${form.customer_name}` : ''); }}
                  onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                  placeholder="Search customer..."
                  className={inputCls}
                />
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
                <input
                  type="text"
                  value={formSearchField === 'sales_rep' ? formSearchQuery : (() => { const r = salesReps?.find(x => x?.id === form?.sales_rep_id); return r ? `${r?.exec_code} - ${r?.full_name}` : ''; })()}
                  onChange={e => { setFormSearchField('sales_rep'); setFormSearchQuery(e?.target?.value); }}
                  onFocus={() => { const r = salesReps?.find(x => x?.id === form?.sales_rep_id); setFormSearchField('sales_rep'); setFormSearchQuery(r ? `${r?.exec_code} - ${r?.full_name}` : ''); }}
                  onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                  placeholder="Search sales rep..."
                  className={inputCls}
                />
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
                <input
                  type="text"
                  value={formSearchField === 'location' ? formSearchQuery : (() => { const l = locations?.find(x => x?.id === form?.location_id); return l ? `${l?.code} - ${l?.name}` : ''; })()}
                  onChange={e => { setFormSearchField('location'); setFormSearchQuery(e?.target?.value); }}
                  onFocus={() => { const l = locations?.find(x => x?.id === form?.location_id); setFormSearchField('location'); setFormSearchQuery(l ? `${l?.code} - ${l?.name}` : ''); }}
                  onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                  placeholder="Search location..."
                  className={inputCls}
                />
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

            {/* Row 2: Balance Outstanding | Invoice Date | Delivery Date */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Balance Outsd.</span>
              <input type="text" value={form?.balance_outstanding != null && form?.balance_outstanding !== '' ? parseFloat(form?.balance_outstanding || 0)?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} readOnly className={readOnlyInputCls} placeholder="0.00" />
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Invoice Date</span>
              <input type="date" value={form?.invoice_date} onChange={e => handleFormChange('invoice_date', e?.target?.value)} className={inputCls} />
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Delivery Date</span>
              <input type="date" value={form?.delivery_date} onChange={e => handleFormChange('delivery_date', e?.target?.value)} className={inputCls} />
            </div>

            {/* Row 3: Invoice No | VAT Invoice No | Driver's Name */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Invoice No.</span>
              <input type="text" value={form?.invoice_no} onChange={e => handleFormChange('invoice_no', e?.target?.value)} className={inputCls} />
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>VAT Invoice No.</span>
              <input type="text" value={form?.vat_invoice_no} onChange={e => handleFormChange('vat_invoice_no', e?.target?.value)} className={inputCls} placeholder="Manual entry" />
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Driver's Name</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formSearchField === 'driver' ? formSearchQuery : (form?.driver_name || '')}
                  onChange={e => { setFormSearchField('driver'); setFormSearchQuery(e?.target?.value); handleFormChange('driver_name', e?.target?.value); }}
                  onFocus={() => { setFormSearchField('driver'); setFormSearchQuery(form?.driver_name || ''); }}
                  onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                  placeholder="Search driver..."
                  className={inputCls}
                />
                {formSearchField === 'driver' && (getFilteredDrivers(formSearchQuery)?.length > 0 || (form?.driver_name && !drivers?.includes(form?.driver_name))) && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); handleFormChange('driver_name', ''); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                    {form?.driver_name && !drivers?.includes(form?.driver_name) && <button type="button" onMouseDown={e => { e.preventDefault(); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{form?.driver_name}</button>}
                    {getFilteredDrivers(formSearchQuery).map(d => (
                      <button key={d} type="button" onMouseDown={e => { e.preventDefault(); handleFormChange('driver_name', d); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{d}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Payment Terms | Trip Status | Vehicle No */}
            <div className="flex items-center">
              <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Payment Terms</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formSearchField === 'payment_terms' ? formSearchQuery : (form?.payment_terms || '')}
                  onChange={e => { setFormSearchField('payment_terms'); setFormSearchQuery(e?.target?.value); }}
                  onFocus={() => { setFormSearchField('payment_terms'); setFormSearchQuery(form?.payment_terms || ''); }}
                  onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                  placeholder="Search payment terms..."
                  className={inputCls}
                />
                {formSearchField === 'payment_terms' && getFilteredPaymentTerms(formSearchQuery)?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); handleFormChange('payment_terms', ''); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                    {getFilteredPaymentTerms(formSearchQuery).map(pt => (
                      <button key={pt} type="button" onMouseDown={e => { e.preventDefault(); handleFormChange('payment_terms', pt); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{pt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Trip Status</span>
              <select value={form?.trip_status} onChange={e => handleFormChange('trip_status', e?.target?.value)} className={inputCls}>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Vehicle No.</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formSearchField === 'vehicle' ? formSearchQuery : (form?.vehicle_no || '')}
                  onChange={e => { setFormSearchField('vehicle'); setFormSearchQuery(e?.target?.value); handleFormChange('vehicle_no', e?.target?.value); }}
                  onFocus={() => { setFormSearchField('vehicle'); setFormSearchQuery(form?.vehicle_no || ''); }}
                  onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                  placeholder="Search vehicle..."
                  className={inputCls}
                />
                {formSearchField === 'vehicle' && (getFilteredVehicles(formSearchQuery)?.length > 0 || (form?.vehicle_no && !vehicles?.includes(form?.vehicle_no))) && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); handleFormChange('vehicle_no', ''); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                    {form?.vehicle_no && !vehicles?.includes(form?.vehicle_no) && <button type="button" onMouseDown={e => { e.preventDefault(); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{form?.vehicle_no}</button>}
                    {getFilteredVehicles(formSearchQuery).map(v => (
                      <button key={v} type="button" onMouseDown={e => { e.preventDefault(); handleFormChange('vehicle_no', v); setFormSearchField(null); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{v}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Posting Rule Info */}
          <div className="mb-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>Posting Rule:</strong> Invoice Date posts to Customer AR Ledger &nbsp;|&nbsp; Delivery Date decreases Stock at Location-Out
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-300 mb-0">
            {TABS?.map(tab => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`px-5 py-1.5 text-xs font-medium border-t border-l border-r rounded-t transition-colors ${
                  activeTab === tab?.id
                    ? 'bg-white border-gray-300 text-foreground -mb-px z-10'
                    : 'bg-gray-100 border-transparent text-muted-foreground hover:bg-gray-200'
                }`}
                style={activeTab === tab?.id ? { color: 'var(--color-primary)' } : {}}
              >
                {tab?.label}
              </button>
            ))}
          </div>

          {/* Line Items Grid (shared across all tabs) */}
          <p className="text-xs text-gray-500 mb-1">Promotions: applied automatically by the system when conditions are met; adds separate FREE line(s) for rewards.</p>
          <div className="overflow-x-auto border border-gray-300 rounded-b rounded-tr">
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
                  <th className={`${thCls} w-7`}></th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item, idx) => {
                  const isPromo = item?._is_promo;
                  return (
                  <tr key={item?._key} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isPromo ? 'bg-gray-50' : ''}`}>
                    <td className={`${tdCls} text-center text-gray-400 text-xs`}>{idx + 1}</td>
                    {/* Item Code - filterable */}
                    <td className={`${tdCls} relative`}>
                      {isPromo ? (
                        <span className={readOnlyCls}>{item?.item_code || ''}</span>
                      ) : (
                      <>
                      <input
                        type="text"
                        ref={getRef(idx, 'item_code')}
                        value={item?.item_code}
                        onChange={e => {
                          const val = e?.target?.value;
                          handleItemChange(idx, 'item_code', val);
                          setDropdownIdx(idx);
                          setDropdownField('code');
                          setDropdownQuery(val);
                          const prod = products?.find(p => p?.product_code?.toLowerCase() === val?.toLowerCase());
                          if (prod) { handleProductSelect(idx, prod?.id); setDropdownIdx(null); }
                        }}
                        onFocus={() => {
                          setDropdownIdx(idx);
                          setDropdownField('code');
                          setDropdownQuery(item?.item_code || '');
                        }}
                        onBlur={() => setTimeout(() => setDropdownIdx(null), 200)}
                        onKeyDown={e => handleLineKeyDown(e, idx, 'item_code')}
                        className={textInputCls}
                        placeholder="Code"
                      />
                      {dropdownIdx === idx && dropdownField === 'code' && getFilteredProducts(dropdownQuery)?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-44 overflow-y-auto" style={{ minWidth: '200px' }}>
                          {getFilteredProducts(dropdownQuery).map(p => (
                            <button
                              key={p?.id}
                              type="button"
                              onMouseDown={e => { e.preventDefault(); handleProductSelect(idx, p?.id); setDropdownIdx(null); }}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 flex gap-2"
                            >
                              <span className="text-gray-400 font-mono w-16 flex-shrink-0">{p?.product_code}</span>
                              <span className="truncate">{p?.product_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      </>
                      )}
                    </td>
                    {/* Item Name - filterable */}
                    <td className={`${tdCls} relative`}>
                      {isPromo ? (
                        <span className={readOnlyCls}>{item?.item_name || ''}</span>
                      ) : (
                      <>
                      <input
                        type="text"
                        ref={getRef(idx, 'item_name')}
                        value={item?.item_name}
                        onChange={e => {
                          handleItemChange(idx, 'item_name', e?.target?.value);
                          setDropdownIdx(idx);
                          setDropdownField('name');
                          setDropdownQuery(e?.target?.value);
                        }}
                        onFocus={() => {
                          setDropdownIdx(idx);
                          setDropdownField('name');
                          setDropdownQuery(item?.item_name || '');
                        }}
                        onBlur={() => setTimeout(() => setDropdownIdx(null), 200)}
                        onKeyDown={e => handleLineKeyDown(e, idx, 'item_name')}
                        className={textInputCls}
                        placeholder="Item name"
                      />
                      {dropdownIdx === idx && dropdownField === 'name' && getFilteredProducts(dropdownQuery)?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-44 overflow-y-auto" style={{ minWidth: '260px' }}>
                          {getFilteredProducts(dropdownQuery).map(p => (
                            <button
                              key={p?.id}
                              type="button"
                              onMouseDown={e => { e.preventDefault(); handleProductSelect(idx, p?.id); setDropdownIdx(null); }}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 flex gap-2"
                            >
                              <span className="truncate flex-1">{p?.product_name}</span>
                              <span className="text-gray-400 font-mono">{p?.product_code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      </>
                      )}
                    </td>
                    {/* Price Type - filterable */}
                    <td className={`${tdCls} relative`}>
                      {isPromo ? (
                        <span className={readOnlyCls}>{item?.price_type_name || ''}</span>
                      ) : (
                      <>
                      <input
                        type="text"
                        value={dropdownIdx === idx && dropdownField === 'price_type' ? dropdownQuery : (item?.price_type_name || '')}
                        onChange={e => { setDropdownIdx(idx); setDropdownField('price_type'); setDropdownQuery(e?.target?.value); }}
                        onFocus={() => { setDropdownIdx(idx); setDropdownField('price_type'); setDropdownQuery(item?.price_type_name || ''); }}
                        onBlur={() => setTimeout(() => setDropdownIdx(null), 200)}
                        placeholder="--"
                        className={textInputCls}
                      />
                      {dropdownIdx === idx && dropdownField === 'price_type' && getFilteredPriceTypes(dropdownQuery)?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-40 overflow-y-auto min-w-[140px]">
                          <button type="button" onMouseDown={async e => {
                            e.preventDefault();
                            setItems(prev => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], price_type_id: null, price_type_name: '' }; return u; });
                            setDropdownIdx(null);
                          }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                          {getFilteredPriceTypes(dropdownQuery).map(p => (
                            <button key={p?.id} type="button" onMouseDown={async e => {
                              e.preventDefault();
                              const ptId = p?.id;
                              setItems(prev => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], price_type_id: ptId, price_type_name: p?.price_type_name || '' }; return u; });
                              setDropdownIdx(null);
                              if (ptId && item?.item_code) {
                                const invoiceDate = form?.invoice_date || today();
                                const priceData = await fetchPriceForProduct(item.item_code, invoiceDate, ptId);
                                if (priceData) {
                                  setItems(prev => {
                                    const u = [...prev];
                                    if (!u[idx]) return prev;
                                    const row = { ...u[idx], price_type_id: ptId, price_type_name: p?.price_type_name || '' };
                                    if (priceData.price_tax_inc != null) row.price_tax_inc = priceData.price_tax_inc;
                                    if (priceData.price_ex_tax != null) { row.price_ex_tax = priceData.price_ex_tax; row._price_from_list = true; }
                                    row.tax_rate = priceData.tax_rate_percent ?? row.tax_rate;
                                    const ctn = parseFloat(row.ctn_qty) || 0;
                                    const price = parseFloat(row.price_ex_tax) || 0;
                                    const tr = parseFloat(row.tax_rate) || 0;
                                    row.pre_tax = parseFloat((ctn * price).toFixed(2));
                                    row.tax_amt = parseFloat((row.pre_tax * tr / 100).toFixed(2));
                                    row.value_tax_inc = parseFloat((row.pre_tax + row.tax_amt).toFixed(2));
                                    u[idx] = row;
                                    return u;
                                  });
                                }
                              }
                            }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{p?.price_type_name}</button>
                          ))}
                        </div>
                      )}
                      </>
                      )}
                    </td>
                    {/* Pack Unit */}
                    <td className={`${tdCls} bg-gray-50`}>
                      <span className={readOnlyCls}>{item?.pack_unit !== '' && item?.pack_unit !== null && item?.pack_unit !== undefined ? item?.pack_unit : ''}</span>
                    </td>
                    {/* Btl Qty */}
                    <td className={`${tdCls} ${isPromo ? 'text-right' : ''}`}>
                      {isPromo ? (
                        <span className={readOnlyCls}>{item?.btl_qty ?? ''}</span>
                      ) : (
                        <input type="number" value={item?.btl_qty} onChange={e => handleItemChange(idx, 'btl_qty', e?.target?.value)} className={numInputCls} placeholder="" />
                      )}
                    </td>
                    {/* Ctn Qty */}
                    <td className={`${tdCls} ${isPromo ? 'text-right' : ''}`}>
                      {isPromo ? (
                        <span className={readOnlyCls}>{item?.ctn_qty ?? ''}</span>
                      ) : (
                        <input
                          type="number"
                          ref={getRef(idx, 'ctn_qty')}
                          value={item?.ctn_qty}
                          onChange={e => handleItemChange(idx, 'ctn_qty', e?.target?.value)}
                          onKeyDown={e => handleLineKeyDown(e, idx, 'ctn_qty')}
                          className={numInputCls}
                          placeholder=""
                        />
                      )}
                    </td>
                    {/* Price Ex-Tax - READ ONLY 6dp, right-aligned */}
                    <td className={`${tdCls} relative bg-gray-50 text-right`}>
                      {item?._price_from_list && (
                        <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-400" style={{ margin: '2px' }} title="Price auto-filled from price list" />
                      )}
                      <span className={readOnlyCls} title={`Price Ex-Tax: ${fmt6(item?.price_ex_tax)}`}>{fmt6(item?.price_ex_tax)}</span>
                    </td>
                    {/* Pre Tax - READ ONLY 2dp */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">{fmt(item?.pre_tax) || '0.00'}</span>
                    </td>
                    {/* Tax Amt - READ ONLY 2dp */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">{fmt(item?.tax_amt) || '0.00'}</span>
                    </td>
                    {/* Price Tax-Inc - EDITABLE, 2 decimals (read-only for promo) */}
                    <td className={`${tdCls} text-right`}>
                      {isPromo ? (
                        <span className={readOnlyCls}>{fmt(item?.price_tax_inc) || '0.00'}</span>
                      ) : (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={focusedPriceTaxIncIdx === idx ? (item?.price_tax_inc ?? '') : fmt(item?.price_tax_inc)}
                          onChange={e => handleItemChange(idx, 'price_tax_inc', e?.target?.value)}
                          onFocus={() => setFocusedPriceTaxIncIdx(idx)}
                          onBlur={() => setFocusedPriceTaxIncIdx(null)}
                          className={numInputCls}
                          placeholder="0.00"
                        />
                      )}
                    </td>
                    {/* Value Tax-Inc - READ ONLY 2dp */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">{fmt(item?.value_tax_inc) || '0.00'}</span>
                    </td>
                    <td className={`${tdCls} text-center`}>
                      {!isPromo && (
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                      )}
                    </td>
                  </tr>
                );
                })}
              </tbody>
              {/* Footer Totals */}
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

          {/* Empties - Expected & Received */}
          <div className="mt-4 border border-gray-300 rounded overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 border-b border-gray-300">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Empties - Expected &amp; Received</span>
            </div>
            <table className="w-full border-collapse text-xs" style={{ minWidth: '400px' }}>
              <thead>
                <tr>
                  <th className={`${thCls} text-left`} style={{ color: 'var(--color-primary)' }}>PRODUCT</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>OWED</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>EXPECTED</th>
                  <th className={`${thCls} w-20 text-right text-primary`}>SOLD OUT</th>
                  <th className={`${thCls} w-24 text-right`} style={{ color: 'var(--color-primary)' }}>RECEIVED</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>O/S</th>
                </tr>
              </thead>
              <tbody>
                {emptiesSummary?.length > 0 ? (
                  emptiesSummary.map(row => (
                    <tr key={row?.empties_type} className="bg-white hover:bg-gray-50">
                      <td className={`${tdCls} px-2 py-1.5 font-medium`}>{row?.empties_type}</td>
                      <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums`}>{fmtNum(row?.owed) || '0'}</td>
                      <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums`}>{fmtNum(row?.expected) || '0'}</td>
                      <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums text-primary font-medium`} title="From Physi Empties lines">
                        {fmtNum(row?.soldOut) || '0'}
                      </td>
                      <td className={`${tdCls} px-2 py-1.5`}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={emptiesReceived?.[row?.empties_type] !== undefined ? emptiesReceived[row?.empties_type] : (row?.received || '')}
                          onChange={e => handleEmptiesReceivedChange(row?.empties_type, e?.target?.value)}
                          className="w-full h-6 px-1 text-xs border border-gray-300 rounded text-right focus:outline-none focus:ring-1"
                          placeholder="0"
                          title="Physically returned"
                        />
                      </td>
                      <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums font-semibold`}>{fmtNum(row?.os) || '0'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={`${tdCls} px-2 py-4 text-center text-gray-400`}>
                      Select a customer and add returnable items to see empties summary
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#1565c0' }}
          >Save &amp; New</button>
          <button onClick={() => window.print()}
            className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors"
            style={{ backgroundColor: '#f9a825' }}
          >Print</button>
          <div className="flex-1" />
          <button onClick={onClose} className="h-9 px-5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceForm;
