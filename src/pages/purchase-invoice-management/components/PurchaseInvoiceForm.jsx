import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import InvoiceHistoryModal from './InvoiceHistoryModal';

const emptyItem = () => ({
  _key: Math.random()?.toString(36)?.slice(2),
  item_code: '',
  item_name: '',
  pack_unit: '',
  btl_qty: '',
  ctn_qty: '',
  breakages_btl: '',
  breakages_value: '',
  price_ex_tax: '',
  pre_tax: 0,
  tax_rate: 0,
  tax_amt: 0,
  price_tax_inc: '',
  tax_inc_value: 0,
  empties_value: '',
  product_id: null,
  _price_from_list: false,
  _is_returnable: false,
  _bottle_cost: 0,
  _plastic_cost: 0,
  _empties_type: '',
});

const today = () => new Date()?.toISOString()?.slice(0, 10);
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d?.setDate(d?.getDate() + days);
  return d?.toISOString()?.slice(0, 10);
};

// Fetch price from price list (product_code or product_id)
const fetchPriceForProduct = async (productCode, productId, invoiceDate, vendorId, vendorPriceTypeCache) => {
  if ((!productCode && !productId) || !invoiceDate) return null;
  try {
    const vendorPriceTypeId = vendorPriceTypeCache?.current?.[vendorId] || null;

    // Query price_list_items joined to price_list_headers (filter in JS - embed filters can be finicky)
    let query = supabase
      .from('price_list_items')
      .select(`
        id,
        product_code,
        product_id,
        pack_unit,
        price,
        pre_tax_price,
        price_tax_inc,
        unit_of_measure,
        unit_price,
        tax_rate_id,
        vat_type,
        price_list_headers!price_list_header_id(
          id,
          status,
          start_date,
          price_type_id
        )
      `);

    // Match by product_code and/or product_id
    if (productCode && productId) {
      query = query.or(`product_code.eq.${productCode},product_id.eq.${productId}`);
    } else if (productCode) {
      query = query.eq('product_code', productCode);
    } else if (productId) {
      query = query.eq('product_id', productId);
    } else {
      return null;
    }

    let { data, error: qErr } = await query;

    // Fallback: try header_id FK if price_list_header_id returns nothing (some items use header_id)
    if ((qErr || !data?.length) && (productCode || productId)) {
      let fbQuery = supabase.from('price_list_items').select(`
        id, product_code, product_id, pack_unit, price, pre_tax_price, price_tax_inc,
        unit_of_measure, unit_price, tax_rate_id, vat_type,
        price_list_headers!header_id(id, status, start_date, price_type_id)
      `);
      if (productCode && productId) fbQuery = fbQuery.or(`product_code.eq.${productCode},product_id.eq.${productId}`);
      else if (productCode) fbQuery = fbQuery.eq('product_code', productCode);
      else fbQuery = fbQuery.eq('product_id', productId);
      const fb = await fbQuery;
      if (!fb.error && fb.data?.length) {
        data = fb.data;
        qErr = null;
      }
    }

    if (qErr || !data || data.length === 0) return null;

    // Filter by header existing and start_date <= invoice_date, sort by start_date desc
    const withHeader = data.filter(r => r?.price_list_headers != null);
    const sorted = withHeader
      .filter(r => {
        const d = r?.price_list_headers?.start_date;
        return d && String(d) <= String(invoiceDate);
      })
      .sort((a, b) => {
        const dateA = a?.price_list_headers?.start_date || '';
        const dateB = b?.price_list_headers?.start_date || '';
        return dateB.localeCompare(dateA);
      });

    // Prefer vendor's price_type match
    let matched = null;
    if (vendorPriceTypeId) {
      matched = sorted.find(r => r?.price_list_headers?.price_type_id === vendorPriceTypeId);
    }
    if (!matched) matched = sorted[0];
    if (!matched) return null;

    // Fetch tax rate if tax_rate_id is present
    let taxRatePercent = 0;
    if (matched?.tax_rate_id) {
      const { data: trData } = await supabase
        .from('tax_rates')
        .select('rate')
        .eq('id', matched.tax_rate_id)
        .single();
      taxRatePercent = parseFloat(trData?.rate) || 0;
    }

    // Use pre_tax_price for cost (ex-tax), else price/unit_price/price_tax_inc
    const preTaxPrice = parseFloat(matched?.pre_tax_price);
    const priceTaxInc = parseFloat(matched?.price_tax_inc) || parseFloat(matched?.price) || parseFloat(matched?.unit_price) || null;
    const vatType = matched?.vat_type || 'exclusive';

    let priceExTax = null;
    if (!isNaN(preTaxPrice) && preTaxPrice > 0) {
      priceExTax = parseFloat(preTaxPrice.toFixed(6));
    } else if (priceTaxInc !== null) {
      if (vatType === 'inclusive' && taxRatePercent > 0) {
        priceExTax = parseFloat((priceTaxInc / (1 + taxRatePercent / 100)).toFixed(6));
      } else {
        priceExTax = parseFloat(priceTaxInc.toFixed(6));
      }
    }

    return {
      price_tax_inc: priceTaxInc,
      price: priceExTax,
      pack_unit: matched?.pack_unit || null,
      unit_of_measure: matched?.unit_of_measure || null,
      tax_rate_percent: taxRatePercent,
      vat_type: vatType,
    };
  } catch (e) {
    console.error('fetchPriceForProduct error:', e);
    return null;
  }
};

// Fallback: last purchase price for this product (from past purchase invoices)
const fetchLastPurchasePrice = async (productId) => {
  if (!productId) return null;
  try {
    const { data: rows } = await supabase
      .from('purchase_invoice_items')
      .select('price_ex_tax, purchase_invoices(invoice_date)')
      .eq('product_id', productId)
      .not('price_ex_tax', 'is', null);

    if (!rows?.length) return null;
    const sorted = [...rows].sort((a, b) => {
      const dA = a?.purchase_invoices?.invoice_date || '';
      const dB = b?.purchase_invoices?.invoice_date || '';
      return dB.localeCompare(dA);
    });
    const p = parseFloat(sorted[0]?.price_ex_tax);
    return isNaN(p) ? null : p;
  } catch (e) {
    console.error('fetchLastPurchasePrice error:', e);
    return null;
  }
};

const PurchaseInvoiceForm = ({ invoice, onClose, onSaved, onSaveNew }) => {
  const invoiceId = invoice?.id || null;
  const isEdit = !!invoiceId;

  const [form, setForm] = useState({
    invoice_no: '',
    supplier_id: '',
    supplier_name: '',
    location_id: '',
    location_name: '',
    invoice_date: today(),
    delivery_date: today(),
    due_date: addDays(today(), 15),
    payment_date: addDays(today(), 15),
    pallet_qty: '',
    notes: '',
    transporter: '',
    driver_name: '',
    vehicle_no: '',
    supplier_inv_no: '',
    empties_inv_no: '',
    po_number: '',
    delivery_note: '',
  });

  const [items, setItems] = useState(
    isEdit ? [] : [emptyItem(), emptyItem(), emptyItem(), emptyItem()]
  );

  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emptiesOwed, setEmptiesOwed] = useState({});
  const [emptiesReturned, setEmptiesReturned] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [dropdownIdx, setDropdownIdx] = useState(null);
  const [dropdownField, setDropdownField] = useState(null);
  const [dropdownQuery, setDropdownQuery] = useState('');
  const [formSearchField, setFormSearchField] = useState(null);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [focusedPriceTaxIncIdx, setFocusedPriceTaxIncIdx] = useState(null);
  // Cache: vendorId -> price_type_id
  const vendorPriceTypeCache = useRef({});
  const rowRefs = useRef({});

  const getFilteredProducts = useCallback((query) => {
    if (!query || !products?.length) return products?.slice(0, 20) || [];
    const q = String(query).toLowerCase().trim();
    return products.filter(p => p?.product_code?.toLowerCase()?.includes(q) || p?.product_name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [products]);
  const getFilteredSuppliers = useCallback((query) => {
    if (!suppliers?.length) return [];
    if (!query?.trim()) return suppliers.slice(0, 30);
    const q = String(query).toLowerCase().trim();
    return suppliers.filter(s => s?.supplier_code?.toLowerCase()?.includes(q) || s?.supplier_name?.toLowerCase()?.includes(q)).slice(0, 30);
  }, [suppliers]);
  const getFilteredLocations = useCallback((query) => {
    if (!locations?.length) return [];
    if (!query?.trim()) return locations.slice(0, 20);
    const q = String(query).toLowerCase().trim();
    return locations.filter(l => l?.code?.toLowerCase()?.includes(q) || l?.name?.toLowerCase()?.includes(q)).slice(0, 20);
  }, [locations]);

  const getRef = (rowIdx, col) => {
    const key = `${rowIdx}-${col}`;
    if (!rowRefs.current[key]) rowRefs.current[key] = React.createRef();
    return rowRefs.current[key];
  };

  const focusCell = (rowIdx, col) => {
    setTimeout(() => {
      const key = `${rowIdx}-${col}`;
      const el = rowRefs.current[key]?.current;
      if (el) el.focus();
    }, 30);
  };

  const handleLineKeyDown = (e, idx, col) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = idx === items.length - 1 ? 0 : idx + 1;
      focusCell(nextIdx, col);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = idx === 0 ? items.length - 1 : idx - 1;
      focusCell(prevIdx, col);
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
      // Add new row if current is last row
      setItems(prev => {
        const isLast = idx === prev.length - 1;
        if (isLast) {
          return [...prev, emptyItem()];
        }
        return prev;
      });
      // Focus item_code of next row
      focusCell(idx + 1, 'item_code');
    }
  };

  const [newTransporter, setNewTransporter] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newVehicle, setNewVehicle] = useState('');

  const overlayRef = useRef(null);

  const loadReferenceData = async () => {
    try {
      // Fetch vendors independently so errors are visible per-query
      const suppRes = await supabase
        .from('vendors')
        .select('id, vendor_code, vendor_name, price_type_id')
        .order('vendor_name');

      if (suppRes.error) {
        console.error('vendors query error:', suppRes.error);
      } else {
        console.log('vendors loaded:', suppRes.data?.length, suppRes.data);
      }

      const mappedSuppliers = (suppRes?.data || []).map(v => ({
        id: v.id,
        supplier_code: v.vendor_code,
        supplier_name: v.vendor_name,
        price_type_id: v.price_type_id || null,
      }));
      setSuppliers(mappedSuppliers);
      mappedSuppliers.forEach(s => {
        vendorPriceTypeCache.current[s.id] = s.price_type_id;
      });

      const locRes = await supabase
        .from('locations')
        .select('id, code, name')
        .order('name');
      if (locRes.error) console.error('locations query error:', locRes.error);
      setLocations(locRes?.data || []);

      const prodRes = await supabase
        .from('products')
        .select('id, product_code, product_name, pack_unit, is_taxable, bottle_cost, plastic_cost, is_returnable, empties_type')
        .order('product_name');
      if (prodRes.error) console.error('products query error:', prodRes.error);
      setProducts(prodRes?.data || []);

      const invRes = await supabase
        .from('purchase_invoices')
        .select('transporter, driver_name, vehicle_no');
      const invData = invRes?.data || [];
      const uniqueTransporters = [...new Set(invData.map(r => r?.transporter).filter(Boolean))];
      const uniqueDrivers = [...new Set(invData.map(r => r?.driver_name).filter(Boolean))];
      const uniqueVehicles = [...new Set(invData.map(r => r?.vehicle_no).filter(Boolean))];
      setTransporters(uniqueTransporters);
      setDrivers(uniqueDrivers);
      setVehicles(uniqueVehicles);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  // Fetch owed empties (from all saved transactions, same pattern as sales invoice)
  const fetchOwedEmpties = useCallback(async () => {
    const supplierId = form?.supplier_id;
    if (!supplierId) {
      setEmptiesOwed({});
      return;
    }
    try {
      const { data: invData } = await supabase
        .from('purchase_invoices')
        .select('id')
        .eq('supplier_id', supplierId);

      const pastInvIds = (invData || [])
        .filter(inv => inv?.id !== invoiceId)
        .map(inv => inv?.id)
        .filter(Boolean);

      const receivedByType = {};
      const emptiesPurchasedByType = {};
      if (pastInvIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('purchase_invoice_items')
          .select('product_id, product_code, product_name, ctn_qty, btl_qty, purchase_invoice_id')
          .in('purchase_invoice_id', pastInvIds);

        const productIds = [...new Set((itemsData || []).map(r => r?.product_id).filter(Boolean))];
        let prodMap = {};
        if (productIds.length > 0) {
          const { data: prodData } = await supabase.from('products').select('id, empties_type, is_returnable').in('id', productIds);
          prodMap = Object.fromEntries((prodData || []).map(p => [p?.id, { empties_type: p?.empties_type || 'Other', is_returnable: p?.is_returnable }]));
        }
        const isEmptiesProduct = (r) => {
          const n = String(r?.product_name || '').toLowerCase();
          const c = String(r?.product_code || '').toLowerCase();
          return n.includes('empties') || c.includes('empties');
        };
        for (const r of itemsData || []) {
          const meta = prodMap[r?.product_id];
          const et = meta?.empties_type || 'Other';
          const qty = parseFloat(r?.ctn_qty) || parseFloat(r?.btl_qty) || 0;
          if (isEmptiesProduct(r)) {
            emptiesPurchasedByType[et] = (emptiesPurchasedByType[et] || 0) + qty;
          } else if (meta?.is_returnable && qty > 0) {
            receivedByType[et] = (receivedByType[et] || 0) + qty;
          }
        }
      }

      const { data: dispData } = await supabase
        .from('empties_dispatch_header')
        .select('id')
        .eq('supplier_id', supplierId);
      const dispIds = (dispData || []).map(r => r?.id).filter(Boolean);

      const dispatchedByType = {};
      if (dispIds.length > 0) {
        const { data: dispItems } = await supabase
          .from('empties_dispatch_items')
          .select('empties_type, qty')
          .in('header_id', dispIds);
        for (const r of dispItems || []) {
          const et = r?.empties_type || 'Other';
          dispatchedByType[et] = (dispatchedByType[et] || 0) + (parseFloat(r?.qty) || 0);
        }
      }

      const { data: piEmptiesRaw } = await supabase
        .from('purchase_invoice_empties')
        .select('invoice_id, empties_type, returned_qty');
      const { data: piForEmpties } = await supabase
        .from('purchase_invoices')
        .select('id, supplier_id')
        .eq('supplier_id', supplierId);
      const piLookup = Object.fromEntries((piForEmpties || []).map(i => [i?.id, i]));
      for (const r of piEmptiesRaw || []) {
        const inv = piLookup[r?.invoice_id];
        if (!inv || inv?.id === invoiceId) continue;
        const et = r?.empties_type || 'Other';
        dispatchedByType[et] = (dispatchedByType[et] || 0) + (parseFloat(r?.returned_qty) || 0);
      }

      const owed = {};
      const allTypes = new Set([...Object.keys(receivedByType), ...Object.keys(dispatchedByType), ...Object.keys(emptiesPurchasedByType)]);
      for (const et of allTypes) {
        const recv = receivedByType[et] || 0;
        const disp = dispatchedByType[et] || 0;
        const emptiesPurch = emptiesPurchasedByType[et] || 0;
        owed[et] = Math.max(0, recv - disp - emptiesPurch);
      }
      setEmptiesOwed(owed);
    } catch (err) {
      console.error('fetchOwedEmpties error:', err);
      setEmptiesOwed({});
    }
  }, [form?.supplier_id, invoiceId]);

  useEffect(() => {
    if (form?.supplier_id) fetchOwedEmpties();
  }, [fetchOwedEmpties]);

  const prevSupplierIdRef = useRef(null);
  useEffect(() => {
    if (prevSupplierIdRef.current != null && prevSupplierIdRef.current !== form?.supplier_id) {
      setEmptiesReturned({});
    }
    prevSupplierIdRef.current = form?.supplier_id;
  }, [form?.supplier_id]);

  // Populate form when editing an existing invoice
  useEffect(() => {
    if (!invoice) return;
    setForm({
      invoice_no: invoice?.invoice_no || '',
      supplier_id: invoice?.supplier_id || '',
      supplier_name: invoice?.supplier_name || '',
      location_id: invoice?.location_id || '',
      location_name: invoice?.location_name || '',
      invoice_date: invoice?.invoice_date || today(),
      delivery_date: invoice?.delivery_date || '',
      due_date: invoice?.due_date || addDays(today(), 15),
      payment_date: invoice?.payment_date || addDays(today(), 15),
      pallet_qty: invoice?.pallet_qty ?? '',
      notes: invoice?.notes || '',
      transporter: invoice?.transporter || '',
      driver_name: invoice?.driver_name || '',
      vehicle_no: invoice?.vehicle_no || '',
      supplier_inv_no: invoice?.supplier_inv_no || '',
      empties_inv_no: invoice?.empties_inv_no || '',
      po_number: invoice?.po_number || '',
      delivery_note: invoice?.delivery_note || '',
    });
    if (invoice?.items && invoice.items.length > 0) {
      setItems(invoice.items.map(it => ({
        _key: it?.id || Math.random()?.toString(36)?.slice(2),
        item_code: it?.item_code || '',
        item_name: it?.item_name || '',
        pack_unit: it?.pack_unit ?? '',
        btl_qty: it?.btl_qty ?? '',
        ctn_qty: it?.ctn_qty ?? '',
        breakages_btl: it?.breakages_btl ?? '',
        breakages_value: it?.breakages_value ?? '',
        price_ex_tax: it?.price_ex_tax ?? '',
        pre_tax: it?.pre_tax ?? 0,
        tax_rate: it?.tax_rate ?? 0,
        tax_amt: it?.tax_amt ?? 0,
        price_tax_inc: it?.price_tax_inc ?? '',
        tax_inc_value: it?.tax_inc_value ?? 0,
        empties_value: it?.empties_value ?? '',
        product_id: it?.product_id || null,
        _price_from_list: false,
        _is_returnable: !isNaN(parseFloat(it?.empties_value)) && parseFloat(it?.empties_value) !== 0,
        _bottle_cost: it?.bottle_cost ?? 0,
        _plastic_cost: it?.plastic_cost ?? 0,
        _empties_type: products?.find(x => x?.id === it?.product_id)?.empties_type || 'Other',
      })));
    } else {
      setItems([emptyItem(), emptyItem(), emptyItem(), emptyItem()]);
    }
    if (invoice?.empties?.length) {
      const recv = {};
      for (const e of invoice.empties) {
        const et = e?.empties_type || 'Other';
        recv[et] = parseFloat(e?.returned_qty) || 0;
      }
      setEmptiesReturned(recv);
    } else {
      setEmptiesReturned({});
    }
  }, [invoice?.id, invoice?.empties]);

  useEffect(() => {
    if (!products?.length) return;
    setItems(prev => {
      if (!prev?.length) return prev;
      const next = prev.map(it => {
        if (!it?.product_id) return it;
        const et = products.find(p => p?.id === it?.product_id)?.empties_type || 'Other';
        if ((it._empties_type || 'Other') === et) return it;
        return { ...it, _empties_type: et };
      });
      const changed = next.some((n, i) => n._empties_type !== (prev[i]?._empties_type));
      return changed ? next : prev;
    });
  }, [products]);

  // Generate invoice number in format PI-yyyy-mm-dd-xxx
  const generateInvoiceNo = useCallback(async () => {
    if (isEdit) return;
    try {
      const dateStr = form?.delivery_date || form?.invoice_date || today();
      const prefix = `PI-${dateStr}`;
      const { data } = await supabase?.from('purchase_invoices')
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
      const newNo = `${prefix}-${String(seq)?.padStart(3, '0')}`;
      setForm(f => ({ ...f, invoice_no: newNo }));
    } catch {
      const dateStr = form?.delivery_date || form?.invoice_date || today();
      setForm(f => ({ ...f, invoice_no: `PI-${dateStr}-001` }));
    }
  }, [form?.delivery_date, form?.invoice_date, isEdit]);

  useEffect(() => {
    if (!isEdit && form?.delivery_date) {
      generateInvoiceNo();
    }
  }, [form?.delivery_date, isEdit, generateInvoiceNo]);

  const handleFormChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSupplierChange = (supplierId) => {
    const sup = suppliers?.find(s => s?.id === supplierId);
    setForm(f => ({
      ...f,
      supplier_id: supplierId,
      supplier_name: sup ? `${sup?.supplier_code} - ${sup?.supplier_name}` : '',
    }));
  };

  const handleLocationChange = (locationId) => {
    const loc = locations?.find(l => l?.id === locationId);
    setForm(f => ({
      ...f,
      location_id: locationId,
      location_name: loc ? `${loc?.code} - ${loc?.name}` : '',
    }));
  };

  useEffect(() => {
    const hasReturnable = items?.some(it => it?._is_returnable === true);
    if (form?.supplier_inv_no && hasReturnable) {
      const num = parseInt(form?.supplier_inv_no, 10);
      if (!isNaN(num)) {
        setForm(f => ({ ...f, empties_inv_no: String(num + 1) }));
      }
    } else {
      setForm(f => ({ ...f, empties_inv_no: '' }));
    }
  }, [form?.supplier_inv_no, items]);

  // Auto-add new row when user starts typing in the last row
  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated?.[idx], [field]: value };

      if (field === 'price_tax_inc') {
        const raw = String(value).replace(/,/g, '');
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return prev;
        item.price_tax_inc = raw;
      }

      // If user manually edits price_ex_tax, clear the auto-fill indicator
      if (field === 'price_ex_tax') {
        item._price_from_list = false;
      }

      // btl_qty or pack_unit change → auto-calculate ctn_qty (one-way only)
      if (field === 'btl_qty' || field === 'pack_unit') {
        const btlRaw = field === 'btl_qty' ? value : item?.btl_qty;
        const btl = parseFloat(btlRaw);
        if (!isNaN(btl) && btlRaw !== '' && btlRaw !== null) {
          const pack = parseFloat(field === 'pack_unit' ? value : item?.pack_unit) || 1;
          item.ctn_qty = pack > 0 ? btl / pack : 0;
        } else if (field === 'btl_qty' && (value === '' || value === null)) {
          item.ctn_qty = '';
        }
      }
      // ctn_qty edited directly → do NOT touch btl_qty, just use ctn_qty as-is

      // Recalculate Pre-Tax, Tax Amt, Tax Inc Value whenever ctn_qty, btl_qty, pack_unit, or price_ex_tax changes
      if (field === 'ctn_qty' || field === 'btl_qty' || field === 'pack_unit') {
        const ctn = parseFloat(item?.ctn_qty) || 0;
        const price = parseFloat(item?.price_ex_tax) || 0;
        item.pre_tax = ctn * price;
        const taxRate = parseFloat(item?.tax_rate) || 0;
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        item.tax_inc_value = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
      }

      if (field === 'price_tax_inc') {
        // price_tax_inc is the primary editable price field
        const ctn = parseFloat(item?.ctn_qty) || 0;
        const priceTaxInc = parseFloat(String(value).replace(/,/g, '')) || 0;
        const taxRate = parseFloat(item?.tax_rate) || 0;

        // Derive price_ex_tax from price_tax_inc with 6 decimal precision
        if (taxRate > 0) {
          item.price_ex_tax = parseFloat((priceTaxInc / (1 + taxRate / 100)).toFixed(6));
        } else {
          item.price_ex_tax = parseFloat(priceTaxInc.toFixed(6));
        }

        // Recalculate pre_tax, tax_amt, tax_inc_value
        item.pre_tax = parseFloat((ctn * item.price_ex_tax).toFixed(2));
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        item.tax_inc_value = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));
      }

      // Recalculate empties_value and breakages_value when relevant fields change
      if (['ctn_qty', 'btl_qty', 'pack_unit', 'price_tax_inc', 'breakages_btl'].includes(field)) {
        const ctn = parseFloat(item?.ctn_qty) || 0;
        const priceTaxInc = parseFloat(item?.price_tax_inc) || 0;
        const packUnit = parseFloat(item?.pack_unit) || 1;
        const brkgesBtl = parseFloat(item?.breakages_btl) || 0;
        const isReturnable = item?._is_returnable === true;
        const bottleCost = parseFloat(item?._bottle_cost) || 0;
        const plasticCost = parseFloat(item?._plastic_cost) || 0;

        if (isReturnable) {
          // Empties Value = ctn_qty × (plastic_cost + bottle_cost)
          item.empties_value = parseFloat((ctn * (plasticCost + bottleCost)).toFixed(2));
          // Brkges Value = ((price_tax_inc + bottle_cost) / pack_unit) × brkges_btl
          item.breakages_value = parseFloat((((priceTaxInc + bottleCost) / packUnit) * brkgesBtl).toFixed(2));
        } else if (item?.product_id) {
          // Non-returnable: Empties Value = 0
          item.empties_value = 0;
          // Brkges Value = (price_tax_inc / pack_unit) × brkges_btl
          item.breakages_value = parseFloat(((priceTaxInc / packUnit) * brkgesBtl).toFixed(2));
        }
      }

      updated[idx] = item;

      // Auto-add new row when user starts typing in the last row
      const isLastRow = idx === updated.length - 1;
      const hasValue = value !== '' && value !== null && value !== undefined;
      if (isLastRow && hasValue) {
        return [...updated, emptyItem()];
      }

      return updated;
    });
  };

  const handleProductSelect = async (idx, productId) => {
    const prod = products?.find(p => p?.id === productId);
    if (!prod) return;

    const isReturnable = prod?.is_returnable === true;
    const bottleCost = parseFloat(prod?.bottle_cost) || 0;
    const plasticCost = parseFloat(prod?.plastic_cost) || 0;

    // Base update from product record
    const baseUpdate = {
      product_id: prod?.id,
      item_code: prod?.product_code,
      item_name: prod?.product_name,
      pack_unit: prod?.pack_unit || '',
      _price_from_list: false,
      _is_returnable: isReturnable,
      _bottle_cost: bottleCost,
      _plastic_cost: plasticCost,
      _empties_type: prod?.empties_type || 'Other',
      // empties_value and breakages_value will be recalculated after price is known
      empties_value: '',
      breakages_value: '',
    };

    // Apply base update immediately so UI feels responsive
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated?.[idx], ...baseUpdate };
      const isLastRow = idx === updated.length - 1;
      if (isLastRow) return [...updated, emptyItem()];
      return updated;
    });

    // Fetch price: price list first, then last purchase price as fallback
    const invoiceDate = form?.invoice_date || today();
    const vendorId = form?.supplier_id || null;
    let priceData = await fetchPriceForProduct(prod?.product_code, prod?.id, invoiceDate, vendorId, vendorPriceTypeCache);

    if (!priceData) {
      const lastPrice = await fetchLastPurchasePrice(prod?.id);
      if (lastPrice != null) {
        priceData = { price: lastPrice, price_tax_inc: lastPrice, pack_unit: null, unit_of_measure: null, tax_rate_percent: 0, vat_type: 'exclusive' };
      }
    }

    if (priceData) {
      setItems(prev => {
        const updated = [...prev];
        // Find the row by product_id (in case rows shifted)
        const targetIdx = updated.findIndex((it, i) => i === idx || (it?.product_id === prod?.id && it?.item_code === prod?.product_code));
        const rowIdx = targetIdx >= 0 ? targetIdx : idx;
        if (!updated[rowIdx]) return updated;

        const item = { ...updated[rowIdx] };

        // Auto-populate cost price: price_tax_inc = cost (tax-inclusive), price_ex_tax = cost (ex-tax)
        const taxRate = priceData.tax_rate_percent || 0;
        if (priceData.price !== null && priceData.price !== undefined) {
          item.price_ex_tax = priceData.price;
          item._price_from_list = true;
          item.price_tax_inc = (priceData.price_tax_inc != null && priceData.price_tax_inc > 0)
            ? priceData.price_tax_inc
            : parseFloat((priceData.price * (1 + taxRate / 100)).toFixed(6));
        } else if (priceData.price_tax_inc != null && priceData.price_tax_inc > 0) {
          item.price_tax_inc = priceData.price_tax_inc;
        }

        // Store tax_rate on the item for use in calculations
        item.tax_rate = priceData.tax_rate_percent || 0;

        // Auto-populate pack_unit from price list if available, else keep product value
        if (priceData.pack_unit !== null && priceData.pack_unit !== undefined) {
          item.pack_unit = priceData.pack_unit;
        }

        // Recalculate derived fields - keep ctn_qty blank when no quantity
        const btlRaw = item.btl_qty;
        const btl = parseFloat(btlRaw);
        const pack = parseFloat(item.pack_unit) || 1;
        const hasBtl = btlRaw !== '' && btlRaw !== null && !isNaN(btl);
        item.ctn_qty = (hasBtl && pack > 0) ? parseFloat((btl / pack).toFixed(4)) : '';
        const ctn = parseFloat(item.ctn_qty) || 0;
        const price = parseFloat(item.price_ex_tax) || 0;
        item.pre_tax = ctn * price;
        item.tax_amt = parseFloat((item.pre_tax * taxRate / 100).toFixed(2));
        // tax_inc_value = pre_tax + tax_amt (= ctn_qty * price_tax_inc when prices are consistent)
        item.tax_inc_value = parseFloat((item.pre_tax + item.tax_amt).toFixed(2));

        // Auto-calculate empties_value and breakages_value based on is_returnable
        const priceTaxInc = parseFloat(item.price_tax_inc) || 0;
        const packUnit = parseFloat(item.pack_unit) || 1;
        const brkgesBtl = parseFloat(item.breakages_btl) || 0;
        const isReturnable = item._is_returnable === true;
        const bottleCost = parseFloat(item._bottle_cost) || 0;
        const plasticCost = parseFloat(item._plastic_cost) || 0;

        if (isReturnable) {
          // Empties Value = ctn_qty × (plastic_cost + bottle_cost)
          item.empties_value = parseFloat((ctn * (plasticCost + bottleCost)).toFixed(2));
          // Brkges Value = ((price_tax_inc + bottle_cost) / pack_unit) × brkges_btl
          item.breakages_value = parseFloat((((priceTaxInc + bottleCost) / packUnit) * brkgesBtl).toFixed(2));
        } else {
          // Non-returnable: Empties Value = 0
          item.empties_value = 0;
          // Brkges Value = (price_tax_inc / pack_unit) × brkges_btl
          item.breakages_value = parseFloat(((priceTaxInc / packUnit) * brkgesBtl).toFixed(2));
        }

        updated[rowIdx] = item;
        return updated;
      });
    }
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev?.filter((_, i) => i !== idx));

  const totals = items?.reduce((acc, it) => ({
    btl_qty: acc?.btl_qty + (parseFloat(it?.btl_qty) || 0),
    ctn_qty: acc?.ctn_qty + (parseFloat(it?.ctn_qty) || 0),
    breakages_value: acc?.breakages_value + (parseFloat(it?.breakages_value) || 0),
    pre_tax: acc?.pre_tax + (parseFloat(it?.pre_tax) || 0),
    tax_amt: acc?.tax_amt + (parseFloat(it?.tax_amt) || 0),
    tax_inc_value: acc?.tax_inc_value + (parseFloat(it?.tax_inc_value) || 0),
    empties_value: acc?.empties_value + (parseFloat(it?.empties_value) || 0),
  }), { btl_qty: 0, ctn_qty: 0, breakages_value: 0, pre_tax: 0, tax_amt: 0, tax_inc_value: 0, empties_value: 0 });

  const fmt = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return '0.00';
    return n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format with exactly 6 decimal places for price accuracy
  const fmt6 = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return '0.000000';
    return n?.toLocaleString('en-GB', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  };

  const fmtNum = (v) => {
    const n = parseFloat(v);
    if (isNaN(n) || n === 0) return '';
    return n?.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const isEmptiesProduct = (item) => {
    const name = String(item?.item_name || '').toLowerCase();
    const code = String(item?.item_code || '').toLowerCase();
    return name.includes('empties') || code.includes('empties');
  };

  // Products value excludes empties purchased/refund; empties product line items go to empties position
  const productsValue = React.useMemo(() => {
    if (!items?.length) return 0;
    return items.reduce((sum, it) => {
      if (isEmptiesProduct(it)) return sum;
      return sum + (parseFloat(it?.tax_inc_value) || 0);
    }, 0);
  }, [items]);
  const emptiesProductsValue = React.useMemo(() => {
    if (!items?.length) return 0;
    return items.reduce((sum, it) => {
      if (!isEmptiesProduct(it)) return sum;
      return sum + (parseFloat(it?.tax_inc_value) || 0);
    }, 0);
  }, [items]);

  const expectedByType = React.useMemo(() => {
    const m = {};
    for (const it of items || []) {
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

  const emptiesSummary = React.useMemo(() => {
    const allTypes = new Set([
      ...Object.keys(emptiesOwed || {}),
      ...Object.keys(expectedByType || {}),
      ...Object.keys(emptiesReturned || {}),
    ].filter(Boolean));
    return [...allTypes].sort().map(et => {
      const owed = emptiesOwed?.[et] ?? 0;
      const expected = expectedByType?.[et] ?? 0;
      const returned = parseFloat(emptiesReturned?.[et]) || 0;
      const os = Math.max(0, owed + expected - returned);
      return { empties_type: et, owed, expected, returned, os };
    });
  }, [emptiesOwed, expectedByType, emptiesReturned]);

  const handleEmptiesReturnedChange = (emptiesType, value) => {
    setEmptiesReturned(prev => {
      const v = parseFloat(value);
      if (value === '' || value == null) {
        const next = { ...prev };
        delete next[emptiesType];
        return next;
      }
      return { ...prev, [emptiesType]: isNaN(v) ? value : v };
    });
  };

  const handleSave = async (andNew = false) => {
    if (!form?.supplier_id && !form?.supplier_name) {
      setError('Please select a supplier.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const invoiceData = {
        invoice_no: form?.invoice_no,
        supplier_id: form?.supplier_id || null,
        supplier_name: form?.supplier_name,
        location_id: form?.location_id || null,
        location_name: form?.location_name,
        invoice_date: form?.invoice_date,
        delivery_date: form?.delivery_date,
        due_date: form?.due_date || null,
        payment_date: form?.payment_date || null,
        pallet_qty: parseFloat(form?.pallet_qty) || 0,
        notes: form?.notes,
        transporter: form?.transporter,
        driver_name: form?.driver_name,
        vehicle_no: form?.vehicle_no,
        supplier_inv_no: form?.supplier_inv_no,
        empties_inv_no: form?.empties_inv_no,
        po_number: form?.po_number,
        delivery_note: form?.delivery_note,
        subtotal: totals?.pre_tax,
        total_tax_amt: totals?.tax_amt,
        total_pre_tax: totals?.pre_tax,
        total_tax_inc_value: totals?.tax_inc_value,
        total_empties_value: totals?.empties_value,
        total_breakages_value: totals?.breakages_value,
        posted_ap: true,
        posted_stock: !!form?.delivery_date,
        updated_at: new Date()?.toISOString(),
      };

      let invoiceIdToUse = invoiceId;
      if (isEdit) {
        const { error: updErr } = await supabase?.from('purchase_invoices')?.update(invoiceData)?.eq('id', invoiceIdToUse);
        if (updErr) throw updErr;
        await supabase?.from('purchase_invoice_items')?.delete()?.eq('purchase_invoice_id', invoiceIdToUse);
      } else {
        const { data: newInv, error: insErr } = await supabase?.from('purchase_invoices')?.insert(invoiceData)?.select()?.single();
        if (insErr) throw insErr;
        invoiceIdToUse = newInv?.id;
      }

      const validItems = items?.filter(it => {
        const hasCode = !!(it?.item_code || it?.item_name || it?.product_id);
        const ctnQty = parseFloat(it?.ctn_qty);
        const btlQty = parseFloat(it?.btl_qty);
        const preTax = parseFloat(it?.pre_tax);
        const priceTaxInc = parseFloat(it?.price_tax_inc);
        const hasQty = (!isNaN(ctnQty) && ctnQty !== 0) || (!isNaN(btlQty) && btlQty !== 0);
        const hasValue = (!isNaN(preTax) && preTax !== 0) || (!isNaN(priceTaxInc) && priceTaxInc !== 0);
        return hasCode || hasQty || hasValue;
      });
      if (validItems?.length > 0) {
        const itemsData = validItems?.map((it, i) => ({
          purchase_invoice_id: invoiceIdToUse,
          item_code: it?.item_code || '',
          item_name: it?.item_name || '',
          pack_unit: isNaN(parseFloat(it?.pack_unit)) ? 0 : parseFloat(it?.pack_unit),
          btl_qty: isNaN(parseFloat(it?.btl_qty)) ? 0 : parseFloat(it?.btl_qty),
          ctn_qty: isNaN(parseFloat(it?.ctn_qty)) ? 0 : parseFloat(it?.ctn_qty),
          breakages_btl: isNaN(parseFloat(it?.breakages_btl)) ? 0 : parseFloat(it?.breakages_btl),
          breakages_value: isNaN(parseFloat(it?.breakages_value)) ? 0 : parseFloat(it?.breakages_value),
          price_ex_tax: isNaN(parseFloat(it?.price_ex_tax)) ? 0 : parseFloat(it?.price_ex_tax),
          pre_tax: isNaN(parseFloat(it?.pre_tax)) ? 0 : parseFloat(it?.pre_tax),
          tax_amt: isNaN(parseFloat(it?.tax_amt)) ? 0 : parseFloat(it?.tax_amt),
          price_tax_inc: isNaN(parseFloat(it?.price_tax_inc)) ? 0 : parseFloat(it?.price_tax_inc),
          tax_inc_value: isNaN(parseFloat(it?.tax_inc_value)) ? 0 : parseFloat(it?.tax_inc_value),
          empties_value: isNaN(parseFloat(it?.empties_value)) ? 0 : parseFloat(it?.empties_value),
          product_id: it?.product_id || null,
          sort_order: i,
        }));
        const { error: itemsErr } = await supabase?.from('purchase_invoice_items')?.insert(itemsData);
        if (itemsErr) throw itemsErr;
      }

      await supabase?.from('purchase_invoice_empties')?.delete()?.eq('invoice_id', invoiceIdToUse);
      const emptiesToSave = emptiesSummary?.filter(r => (parseFloat(r?.returned) || 0) !== 0) || [];
      if (emptiesToSave.length > 0) {
        const emptiesData = emptiesToSave.map(r => ({
          invoice_id: invoiceIdToUse,
          empties_type: r?.empties_type,
          returned_qty: parseFloat(r?.returned) || 0,
        }));
        await supabase?.from('purchase_invoice_empties')?.insert(emptiesData);
      }

      // --- Supplier Ledger (Accounts Payable) entry using Invoice Date ---
      // Delete existing AP entry for this invoice (for edits) then re-insert
      await supabase?.from('supplier_ledger')
        ?.delete()
        ?.eq('reference_no', form?.invoice_no)
        ?.eq('transaction_type', 'purchase_invoice');

      const apEntry = {
        transaction_date: form?.invoice_date,
        transaction_type: 'purchase_invoice',
        reference_no: form?.invoice_no,
        supplier_id: form?.supplier_id || null,
        supplier_name: form?.supplier_name,
        description: 'Purchase Invoice',
        debit_amount: parseFloat(productsValue) || 0,
        credit_amount: 0,
        purchase_invoice_id: invoiceIdToUse,
      };
      const { error: apErr } = await supabase?.from('supplier_ledger')?.insert(apEntry);
      if (apErr) {
        console.warn('supplier_ledger insert warning:', apErr?.message);
      }

      await supabase?.from('supplier_ledger')?.delete()
        ?.eq('purchase_invoice_id', invoiceIdToUse)
        ?.eq('transaction_type', 'empties_invoice');
      const emptiesVal = parseFloat(totals?.empties_value) || 0;
      if (emptiesVal > 0 && form?.empties_inv_no) {
        const emptiesEntry = {
          transaction_date: form?.invoice_date,
          transaction_type: 'empties_invoice',
          reference_no: form?.empties_inv_no,
          supplier_id: form?.supplier_id || null,
          supplier_name: form?.supplier_name,
          description: 'Empties Invoice',
          debit_amount: emptiesVal,
          credit_amount: 0,
          purchase_invoice_id: invoiceIdToUse,
        };
        await supabase?.from('supplier_ledger')?.insert(emptiesEntry);
      }

      // Empties purchased (positive) or empties refund (negative) - affects empties position, not products
      await supabase?.from('supplier_ledger')?.delete()
        ?.eq('purchase_invoice_id', invoiceIdToUse)
        ?.eq('transaction_type', 'empties_purchase_invoice');
      const emptiesProdVal = parseFloat(emptiesProductsValue) || 0;
      const hasEmptiesValue = Math.abs(emptiesProdVal) >= 0.01;
      if (hasEmptiesValue) {
        const emptiesProdEntry = {
          transaction_date: form?.invoice_date,
          transaction_type: 'empties_purchase_invoice',
          reference_no: form?.invoice_no,
          supplier_id: form?.supplier_id || null,
          supplier_name: form?.supplier_name,
          description: emptiesProdVal > 0 ? 'Empties Purchase' : 'Empties Refund',
          debit_amount: emptiesProdVal > 0 ? emptiesProdVal : 0,
          credit_amount: emptiesProdVal < 0 ? Math.abs(emptiesProdVal) : 0,
          purchase_invoice_id: invoiceIdToUse,
        };
        await supabase?.from('supplier_ledger')?.insert(emptiesProdEntry);
      }

      // --- Stock Movements using Delivery Date (only if delivery_date is set) ---
      if (form?.delivery_date && form?.location_id && validItems?.length > 0) {
        // Delete existing stock movements for this invoice (for edits)
        await supabase?.from('stock_movements')
          ?.delete()
          ?.eq('reference_no', form?.invoice_no)
          ?.eq('transaction_type', 'receipt');

        for (const it of validItems) {
          if (!it?.product_id) continue;
          const btlQty = parseFloat(it?.btl_qty) || 0;
          const ctnQty = parseFloat(it?.ctn_qty) || 0;
          const qty = btlQty !== 0 ? btlQty : ctnQty;
          if (qty === 0) continue;

          // Insert stock movement record
          const movement = {
            movement_date: form?.delivery_date,
            product_id: it?.product_id,
            product_code: it?.item_code || '',
            product_name: it?.item_name || '',
            location: form?.location_name || form?.location_id,
            transaction_type: 'receipt',
            quantity: qty,
            unit_cost: parseFloat(it?.price_ex_tax) || 0,
            reference_no: form?.invoice_no,
            reason: `Purchase Invoice ${form?.invoice_no}`,
          };
          const { error: smErr } = await supabase?.from('stock_movements')?.insert(movement);
          if (smErr) console.warn('stock_movements insert warning:', smErr?.message);

          // Upsert stock_levels_by_location
          const { data: existing } = await supabase
            ?.from('stock_levels_by_location')
            ?.select('id, stock_on_hand')
            ?.eq('product_id', it?.product_id)
            ?.eq('location_id', form?.location_id)
            ?.maybeSingle();

          if (existing) {
            const newQty = parseFloat(existing?.stock_on_hand || 0) + qty;
            await supabase
              ?.from('stock_levels_by_location')
              ?.update({ stock_on_hand: newQty, last_movement_date: new Date()?.toISOString() })
              ?.eq('id', existing?.id);
          } else {
            await supabase?.from('stock_levels_by_location')?.insert({
              product_id: it?.product_id,
              location_id: form?.location_id,
              stock_on_hand: qty,
              last_movement_date: new Date()?.toISOString(),
            });
          }
        }
      }

      if (andNew) {
        onSaved?.();
      } else {
        onSaved?.();
      }
    } catch (err) {
      setError(err?.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const addTransporter = () => {
    if (newTransporter?.trim() && !transporters?.includes(newTransporter?.trim())) {
      setTransporters(prev => [...new Set([...prev, newTransporter?.trim()])]);
    }
    setForm(f => ({ ...f, transporter: newTransporter?.trim() }));
    setNewTransporter('');
  };

  const addDriver = () => {
    if (newDriver?.trim() && !drivers?.includes(newDriver?.trim())) {
      setDrivers(prev => [...new Set([...prev, newDriver?.trim()])]);
    }
    setForm(f => ({ ...f, driver_name: newDriver?.trim() }));
    setNewDriver('');
  };

  const addVehicle = () => {
    if (newVehicle?.trim() && !vehicles?.includes(newVehicle?.trim())) {
      setVehicles(prev => [...new Set([...prev, newVehicle?.trim()])]);
    }
    setForm(f => ({ ...f, vehicle_no: newVehicle?.trim() }));
    setNewVehicle('');
  };

  const inputCls = 'w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none bg-white';
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
      <div className="bg-white rounded-lg shadow-2xl flex flex-col" style={{ width: '96vw', maxWidth: '1280px', maxHeight: '95vh' }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 rounded-t-lg bg-primary shadow-sm">
          <h2 className="text-base font-semibold text-primary-foreground">{isEdit ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h2>
          <button onClick={onClose} className="text-primary-foreground hover:text-primary-foreground/80 text-xl leading-none font-bold">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
          )}

          {/* Header Fields Grid - 3 columns */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mb-4">
            {/* Column 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Supplier</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={formSearchField === 'supplier' ? formSearchQuery : (form?.supplier_name || '')}
                    onChange={e => { setFormSearchField('supplier'); setFormSearchQuery(e?.target?.value); }}
                    onFocus={() => { setFormSearchField('supplier'); setFormSearchQuery(form?.supplier_name || ''); }}
                    onBlur={() => setTimeout(() => setFormSearchField(null), 200)}
                    placeholder="Search supplier..."
                    className={inputCls}
                  />
                  {formSearchField === 'supplier' && getFilteredSuppliers(formSearchQuery)?.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-white border border-gray-300 shadow-lg rounded max-h-48 overflow-y-auto">
                      <button type="button" onMouseDown={e => { e.preventDefault(); handleSupplierChange(''); setFormSearchField(null); setFormSearchQuery(''); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 text-gray-500">— Clear —</button>
                      {getFilteredSuppliers(formSearchQuery).map(s => (
                        <button key={s?.id} type="button" onMouseDown={e => { e.preventDefault(); handleSupplierChange(s?.id); setFormSearchField(null); setFormSearchQuery(''); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-primary/10 block">{s?.supplier_code} - {s?.supplier_name}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Location-In</span>
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
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Due Date</span>
                <input type="date" value={form?.due_date} onChange={e => handleFormChange('due_date', e?.target?.value)} className={inputCls} />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Payment Date</span>
                <input type="date" value={form?.payment_date} onChange={e => handleFormChange('payment_date', e?.target?.value)} className={inputCls} />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Pallet Qty</span>
                <input type="number" value={form?.pallet_qty} onChange={e => handleFormChange('pallet_qty', e?.target?.value)} className={inputCls} placeholder="0" />
              </div>
              <div className="flex items-start">
                <span className={`${labelCls} w-28 pt-1`} style={{ color: 'var(--color-primary)' }}>Notes</span>
                <textarea
                  value={form?.notes}
                  onChange={e => handleFormChange('notes', e?.target?.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Invoice Date</span>
                <input type="date" value={form?.invoice_date} onChange={e => handleFormChange('invoice_date', e?.target?.value)} className={inputCls} />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Delivery Date</span>
                <input type="date" value={form?.delivery_date} onChange={e => handleFormChange('delivery_date', e?.target?.value)} className={inputCls} />
              </div>
              {/* Transporter with +/delete */}
              <div className="flex items-center gap-1">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Transporter</span>
                <select
                  value={form?.transporter}
                  onChange={e => handleFormChange('transporter', e?.target?.value)}
                  className="flex-1 h-7 px-1 text-xs border border-gray-300 rounded focus:outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  {transporters?.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => {
                    const val = prompt('Add new transporter:');
                    if (val?.trim()) {
                      setTransporters(prev => [...new Set([...prev, val.trim()])]);
                      setForm(f => ({ ...f, transporter: val?.trim() }));
                    }
                  }}
                  className="w-6 h-7 flex items-center justify-center rounded text-white text-sm font-bold"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  title="Add new"
                >+</button>
                <button
                  onClick={() => setForm(f => ({ ...f, transporter: '' }))}
                  className="w-6 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                  title="Clear"
                >🗑</button>
              </div>
              {/* Driver's Name with +/delete */}
              <div className="flex items-center gap-1">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Driver's Name</span>
                <select
                  value={form?.driver_name}
                  onChange={e => handleFormChange('driver_name', e?.target?.value)}
                  className="flex-1 h-7 px-1 text-xs border border-gray-300 rounded focus:outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  {drivers?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button
                  onClick={() => {
                    const val = prompt('Add new driver:');
                    if (val?.trim()) {
                      setDrivers(prev => [...new Set([...prev, val.trim()])]);
                      setForm(f => ({ ...f, driver_name: val?.trim() }));
                    }
                  }}
                  className="w-6 h-7 flex items-center justify-center rounded text-white text-sm font-bold"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  title="Add new"
                >+</button>
                <button
                  onClick={() => setForm(f => ({ ...f, driver_name: '' }))}
                  className="w-6 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                  title="Clear"
                >🗑</button>
              </div>
              {/* Vehicle No with +/delete */}
              <div className="flex items-center gap-1">
                <span className={`${labelCls} w-28`} style={{ color: 'var(--color-primary)' }}>Vehicle No.</span>
                <select
                  value={form?.vehicle_no}
                  onChange={e => handleFormChange('vehicle_no', e?.target?.value)}
                  className="flex-1 h-7 px-1 text-xs border border-gray-300 rounded focus:outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  {vehicles?.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <button
                  onClick={() => {
                    const val = prompt('Add new vehicle:');
                    if (val?.trim()) {
                      setVehicles(prev => [...new Set([...prev, val.trim()])]);
                      setForm(f => ({ ...f, vehicle_no: val?.trim() }));
                    }
                  }}
                  className="w-6 h-7 flex items-center justify-center rounded text-white text-sm font-bold"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  title="Add new"
                >+</button>
                <button
                  onClick={() => setForm(f => ({ ...f, vehicle_no: '' }))}
                  className="w-6 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                  title="Clear"
                >🗑</button>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-1.5">
              <div className="flex items-center">
                <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Invoice No.</span>
                <input type="text" value={form?.invoice_no} onChange={e => handleFormChange('invoice_no', e?.target?.value)} className={inputCls} />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Supplier Inv No.</span>
                <input type="text" value={form?.supplier_inv_no} onChange={e => handleFormChange('supplier_inv_no', e?.target?.value)} className={inputCls} />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Empties Inv No.</span>
                <input
                  type="text"
                  value={form?.empties_inv_no}
                  onChange={e => handleFormChange('empties_inv_no', e?.target?.value)}
                  className={inputCls}
                  placeholder="Auto (Supplier Inv No. + 1) when ret..."
                />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>PO Number</span>
                <input type="text" value={form?.po_number} onChange={e => handleFormChange('po_number', e?.target?.value)} className={inputCls} />
              </div>
              <div className="flex items-center">
                <span className={`${labelCls} w-32`} style={{ color: 'var(--color-primary)' }}>Delivery Note</span>
                <input type="text" value={form?.delivery_note} onChange={e => handleFormChange('delivery_note', e?.target?.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Posting Rule Info */}
          <div className="mb-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>Posting Rule:</strong> Invoice Date affects Supplier Accounts Payable &nbsp;|&nbsp; Delivery Date updates Stock at selected Location
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full border-collapse text-xs" style={{ minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th className={`${thCls} w-7`}>#</th>
                  <th className={`${thCls} w-16`} style={{ color: 'var(--color-primary)' }}>Item Code</th>
                  <th className={`${thCls} w-36`} style={{ color: 'var(--color-primary)' }}>Item Name</th>
                  <th className={`${thCls} w-14`} style={{ color: 'var(--color-primary)' }}>Pack Unit</th>
                  <th className={`${thCls} w-14`} style={{ color: 'var(--color-primary)' }}>Btl Qty</th>
                  <th className={`${thCls} w-14`} style={{ color: 'var(--color-primary)' }}>Ctn Qty</th>
                  <th className={`${thCls} w-16`} style={{ color: 'var(--color-primary)' }}>Brkges Btl</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Brkges Value</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Price Ex-Tax</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Pre Tax</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Tax Amt</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Price Tax-Inc</th>
                  <th className={`${thCls} w-24`} style={{ color: 'var(--color-primary)' }}>Tax Inc Value</th>
                  <th className={`${thCls} w-20`} style={{ color: 'var(--color-primary)' }}>Empties Value</th>
                  <th className={`${thCls} w-7`}></th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item, idx) => (
                  <tr key={item?._key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className={`${tdCls} text-center text-gray-400 text-xs`}>{idx + 1}</td>
                    {/* Item Code - filterable */}
                    <td className={`${tdCls} relative`}>
                      <input
                        type="text"
                        ref={getRef(idx, 'item_code')}
                        value={dropdownIdx === idx && dropdownField === 'code' ? dropdownQuery : (item?.item_code || '')}
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
                    </td>
                    {/* Item Name - filterable */}
                    <td className={`${tdCls} relative`}>
                      <input
                        type="text"
                        ref={getRef(idx, 'item_name')}
                        value={dropdownIdx === idx && dropdownField === 'name' ? dropdownQuery : (item?.item_name || '')}
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
                    </td>
                    <td className={tdCls}>
                      <input type="number" value={item?.pack_unit} onChange={e => handleItemChange(idx, 'pack_unit', e?.target?.value)} className={numInputCls} placeholder="" />
                    </td>
                    <td className={tdCls}>
                      <input type="number" value={item?.btl_qty} onChange={e => handleItemChange(idx, 'btl_qty', e?.target?.value)} className={numInputCls} placeholder="" />
                    </td>
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
                    <td className={tdCls}>
                      <input type="number" value={item?.breakages_btl} onChange={e => handleItemChange(idx, 'breakages_btl', e?.target?.value)} className={numInputCls} placeholder="" />
                    </td>
                    {/* Brkges Value - READ ONLY, auto-calculated */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">
                        {item?.product_id ? fmt(item?.breakages_value) : ''}
                      </span>
                    </td>
                    {/* Price Ex-Tax with auto-fill indicator - READ ONLY, 6 decimals, right-aligned */}
                    <td className={`${tdCls} relative bg-gray-50 text-right`}>
                      {item?._price_from_list && (
                        <span
                          className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-green-400"
                          style={{ margin: '2px' }}
                          title="Price auto-filled from price list"
                        />
                      )}
                      <span
                        className={readOnlyCls}
                        title={`Price Ex-Tax: ${fmt6(item?.price_ex_tax)}`}
                      >
                        {fmt6(item?.price_ex_tax)}
                      </span>
                    </td>
                    {/* Pre Tax - READ ONLY, 2 decimals */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">{fmt(item?.pre_tax) || '0.00'}</span>
                    </td>
                    {/* Tax Amt - READ ONLY, 2 decimals */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">{fmt(item?.tax_amt) || '0.00'}</span>
                    </td>
                    {/* Price Tax-Inc - EDITABLE, 2 decimals */}
                    <td className={`${tdCls} text-right`}>
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
                    </td>
                    {/* Tax Inc Value - READ ONLY, 2 decimals */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">{fmt(item?.tax_inc_value) || '0.00'}</span>
                    </td>
                    {/* Empties Value - READ ONLY, auto-calculated */}
                    <td className={`${tdCls} bg-gray-50 text-right`}>
                      <span className="px-1 text-xs text-gray-700">
                        {item?.product_id
                          ? (item?._is_returnable ? fmt(item?.empties_value) : '0.00')
                          : ''}
                      </span>
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Footer Totals */}
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={4} className="border border-gray-300 px-2 py-1 text-right text-xs text-gray-500"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmtNum(totals?.btl_qty) || ''}</td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmtNum(totals?.ctn_qty) || ''}</td>
                  <td className="border border-gray-300 px-1 py-1"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.breakages_value)}</td>
                  <td className="border border-gray-300 px-1 py-1"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.pre_tax)}</td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.tax_amt)}</td>
                  <td className="border border-gray-300 px-1 py-1"></td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.tax_inc_value)}</td>
                  <td className="border border-gray-300 px-1 py-1 text-right text-xs font-bold text-gray-800">{fmt(totals?.empties_value)}</td>
                  <td className="border border-gray-300 px-1 py-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legend for price auto-fill indicator */}
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-xs text-gray-500">Price auto-filled from price list (editable)</span>
          </div>

          {/* Empties - Expected & Returned */}
          <div className="mt-4 border border-gray-300 rounded overflow-hidden">
            <div className="px-3 py-2 bg-gray-100 border-b border-gray-300">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Empties - Expected &amp; Returned</span>
            </div>
            <table className="w-full border-collapse text-xs" style={{ minWidth: '400px' }}>
              <thead>
                <tr>
                  <th className={`${thCls} text-left`} style={{ color: 'var(--color-primary)' }}>PRODUCT</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>OWED</th>
                  <th className={`${thCls} w-20 text-right`} style={{ color: 'var(--color-primary)' }}>EXPECTED</th>
                  <th className={`${thCls} w-24 text-right`} style={{ color: 'var(--color-primary)' }}>RETURNED</th>
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
                      <td className={`${tdCls} px-2 py-1.5`}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={emptiesReturned?.[row?.empties_type] !== undefined ? emptiesReturned[row?.empties_type] : (row?.returned || '')}
                          onChange={e => handleEmptiesReturnedChange(row?.empties_type, e?.target?.value)}
                          className="w-full h-6 px-1 text-xs border border-gray-300 rounded text-right focus:outline-none focus:ring-1"
                          placeholder="0"
                          title="Returned to supplier"
                        />
                      </td>
                      <td className={`${tdCls} px-2 py-1.5 text-right tabular-nums font-semibold`}>{fmtNum(row?.os) || '0'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={`${tdCls} px-2 py-4 text-center text-gray-400`}>
                      Select a supplier and add returnable items to see empties summary
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#1565c0' }}
          >
            Save &amp; New
          </button>
          <button
            onClick={handlePrint}
            className="h-9 px-5 text-sm font-semibold text-white rounded transition-colors"
            style={{ backgroundColor: '#f9a825' }}
          >
            Print
          </button>
          <div className="flex-1" />
          {isEdit && (
            <button
              onClick={() => setShowHistory(true)}
              className="h-9 w-9 text-sm font-bold text-white rounded transition-colors flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
              title="View Invoice History"
            >
              H
            </button>
          )}
          <button
            onClick={onClose}
            className="h-9 px-5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Invoice History Modal */}
      {showHistory && (
        <InvoiceHistoryModal
          invoiceId={invoiceId}
          invoiceNo={form?.invoice_no}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default PurchaseInvoiceForm;
