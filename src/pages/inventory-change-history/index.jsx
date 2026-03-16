import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useCompanyLocation } from '../../contexts/CompanyLocationContext';
import { useAuth } from '../../contexts/AuthContext';
import InventoryMovementModal from './components/InventoryMovementModal';
import TemplateEditModal from './components/TemplateEditModal';

const defaultFrom = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};
const defaultTo = () => new Date().toISOString().slice(0, 10);

const PHYSI_EMPTIES = 'physi empties';

const DEFAULT_COL_WIDTHS = [72, 140, 48, 88, 88, 88, 88, 88, 72];
const COL_KEYS = ['ITEM CODE', 'ITEM NAME', 'UNIT', 'OPENING', 'PURCHASES', 'SALES', 'CLOSING', 'ORDER', 'BTLQTY'];

const buildDefaultColumns = () => COL_KEYS.map((key, i) => ({ key, label: key, width: DEFAULT_COL_WIDTHS[i], visible: true, order: i }));

const InventoryChangeHistory = () => {
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('inventory-change-history-columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === COL_KEYS.length) {
          const valid = parsed.every(c => c && typeof c.key === 'string' && typeof c.label === 'string' && typeof c.width === 'number' && c.width >= 40 && typeof c.visible === 'boolean' && typeof c.order === 'number');
          if (valid) return parsed;
        }
      }
    } catch {}
    return buildDefaultColumns();
  });
  const [resizingCol, setResizingCol] = useState(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible).sort((a, b) => a.order - b.order), [columns]);
  const tableWidth = useMemo(() => visibleColumns.reduce((s, c) => s + c.width, 0), [visibleColumns]);

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [hideZero, setHideZero] = useState(true);
  const [locationSelected, setLocationSelected] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [itemSelected, setItemSelected] = useState([]);
  const [itemInput, setItemInput] = useState('');
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [reportType, setReportType] = useState('Summary');
  const [productCategorySelected, setProductCategorySelected] = useState([]);
  const [productCategoryInput, setProductCategoryInput] = useState('');
  const [productCategoryDropdownOpen, setProductCategoryDropdownOpen] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateSettingsOpen, setTemplateSettingsOpen] = useState(false);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [basedOnIndividualLocation, setBasedOnIndividualLocation] = useState(true);
  const { user: authUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [movementsBefore, setMovementsBefore] = useState([]);
  const [breakages, setBreakages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [modalMovements, setModalMovements] = useState([]);
  const [modalBreakages, setModalBreakages] = useState([]);
  const [optionOpen, setOptionOpen] = useState(false);
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);
  const optionRef = useRef(null);
  const printRef = useRef(null);
  const excelRef = useRef(null);
  const searchPanelRef = useRef(null);
  const { selectedCompany } = useCompanyLocation();

  useEffect(() => {
    if (!optionOpen) return;
    const close = (e) => { if (optionRef.current && !optionRef.current.contains(e?.target)) setOptionOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [optionOpen]);
  useEffect(() => {
    if (!printOpen) return;
    const close = (e) => { if (printRef.current && !printRef.current.contains(e?.target)) setPrintOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [printOpen]);
  useEffect(() => {
    if (!excelOpen) return;
    const close = (e) => { if (excelRef.current && !excelRef.current.contains(e?.target)) setExcelOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [excelOpen]);
  useEffect(() => {
    if (!searchPanelOpen) return;
    const close = (e) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e?.target)) setSearchPanelOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [searchPanelOpen]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let prodRes = { data: [] };
      let movInPeriodRes = { data: [] };
      let movBeforeRes = { data: [] };
      let locRes = { data: [] };
      try {
        prodRes = await supabase.from('products').select('id, product_code, product_name, pack_unit, category').eq('status', 'active').order('product_code');
      } catch (_) {}
      try {
        movInPeriodRes = await supabase.from('stock_movements').select('id, movement_date, product_id, product_code, product_name, location, transaction_type, quantity, reference_no, reason, created_at').lte('movement_date', dateTo).gte('movement_date', dateFrom).order('movement_date', { ascending: true });
      } catch (_) {}
      try {
        movBeforeRes = await supabase.from('stock_movements').select('product_id, quantity, location').lt('movement_date', dateFrom);
      } catch (_) {}
      try {
        locRes = await supabase.from('locations').select('id, name').eq('is_active', true).order('name');
      } catch (_) {}

      setProducts(prodRes?.data ?? []);
      setMovements(movInPeriodRes?.data ?? []);
      setMovementsBefore(movBeforeRes?.data ?? []);
      setLocations(locRes?.data ?? []);

      try {
        const breakRes = await supabase.from('purchase_invoice_items').select('product_id, breakages_btl, purchase_invoice_id').not('product_id', 'is', null);
        const invItems = breakRes?.data || [];
        if (breakRes?.error || invItems.length === 0) {
          setBreakages([]);
        } else {
          const ids = [...new Set(invItems.map(r => r.purchase_invoice_id).filter(Boolean))];
          const invMap = {};
          if (ids.length > 0) {
            const invRes = await supabase.from('purchase_invoices').select('id, delivery_date, invoice_no, posted_stock').in('id', ids);
            (invRes?.data || []).forEach(inv => { invMap[inv.id] = inv; });
          }
          const withDate = invItems.filter(row => {
            const pi = invMap[row.purchase_invoice_id];
            if (!pi?.posted_stock || !pi?.delivery_date) return false;
            const d = String(pi.delivery_date);
            return d >= dateFrom && d <= dateTo;
          });
          setBreakages(withDate.map(row => {
            const pi = invMap[row.purchase_invoice_id];
            return {
              product_id: row.product_id,
              breakages_btl: parseFloat(row.breakages_btl) || 0,
              movement_date: pi?.delivery_date,
              reference_no: pi?.invoice_no,
              reason: 'Breakage (purchase invoice)',
            };
          }));
        }
      } catch (_) {
        setBreakages([]);
      }
    } catch (e) {
      console.error('Inventory change history fetch:', e);
      setProducts([]);
      setMovements([]);
      setMovementsBefore([]);
      setBreakages([]);
      setLocations([]);
    } finally {
      setIsLoading(false);
      setReportGeneratedAt(new Date());
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onKey = (e) => {
      if (e?.key === 'F3') { e.preventDefault(); setSearchPanelOpen(prev => !prev); }
      if (e?.key === 'F8' && searchPanelOpen) { e.preventDefault(); setSearchPanelOpen(false); fetchData(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchPanelOpen, fetchData]);

  const handleResizeStart = useCallback((colKey, startWidth, e) => {
    e.preventDefault();
    setResizingCol(colKey);
    startXRef.current = e.clientX;
    startWidthRef.current = startWidth;
  }, []);
  useEffect(() => {
    if (resizingCol === null) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newWidth = Math.max(40, startWidthRef.current + dx);
      setColumns(prev => prev.map(c => c.key === resizingCol ? { ...c, width: newWidth } : c));
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
      try { localStorage.setItem('inventory-change-history-columns', JSON.stringify(columns)); } catch {}
    }
  }, [resizingCol, columns]);

  const saveColumnLayout = useCallback(() => {
    try { localStorage.setItem('inventory-change-history-columns', JSON.stringify(columns)); } catch {}
  }, [columns]);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await supabase.from('inventory_change_history_templates').select('id, name, is_default, column_settings, sort_subtotal_settings').order('name');
      setTemplates(data ?? []);
    } catch (_) {
      setTemplates([]);
    }
  }, []);

  const mergeColumnSettings = useCallback((saved) => {
    if (!Array.isArray(saved) || saved.length === 0) return buildDefaultColumns();
    const byKey = {};
    saved.forEach(c => { if (c?.key) byKey[c.key] = c; });
    return COL_KEYS.map((key, i) => {
      const c = byKey[key];
      const def = buildDefaultColumns()[i];
      return c ? { key, label: c.label ?? key, width: Math.max(40, Number(c.width) || def.width), visible: c.visible !== false, order: Number(c.order) ?? i } : { ...def, order: i };
    });
  }, []);

  const applyTemplate = useCallback((template) => {
    if (!template) return;
    setAppliedTemplateId(template.id);
    if (template.column_settings != null) setColumns(mergeColumnSettings(template.column_settings));
    const s = template.sort_subtotal_settings || {};
    setSortConfig({ key: s.sortKeyIndex != null ? s.sortKeyIndex : null, direction: s.sortDirection || 'asc' });
  }, [mergeColumnSettings]);

  const hasAppliedDefaultRef = useRef(false);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => {
    if (templates.length === 0 || hasAppliedDefaultRef.current) return;
    const defaultTpl = templates.find(t => t.is_default);
    if (defaultTpl) {
      applyTemplate(defaultTpl);
      hasAppliedDefaultRef.current = true;
    }
  }, [templates, applyTemplate]);

  const thCls = 'px-3 py-2 text-xs font-semibold bg-primary/10 border border-border relative select-none';
  const tdCls = 'px-3 py-1.5 text-xs border border-border';

  const getCellForKeyIndex = useCallback((row, keyIndex) => {
    switch (keyIndex) {
      case 0: return { content: row.product_code || '—', align: 'left', mono: true, neg: false };
      case 1: return { content: row.product_name || '—', align: 'left', mono: false, neg: false };
      case 2: return { content: row.pack_unit ?? '—', align: 'right', mono: false, neg: false };
      case 3: return { content: (row.openingCtn ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', mono: true, neg: false };
      case 4: return { content: (row.purchasesCtn ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', mono: true, neg: false };
      case 5: return { content: (row.salesCtn ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', mono: true, neg: false };
      case 6: return { content: (row.closingCtn ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', mono: true, neg: (row.closingCtn || 0) < 0 };
      case 7: return { content: (row.orderCtn ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', mono: true, neg: (row.orderCtn || 0) < 0 };
      case 8: return { content: row.btlQty != null ? row.btlQty.toLocaleString('en-GB') : '—', align: 'right', mono: true, neg: (row.btlQty || 0) < 0 };
      default: return { content: '—', align: 'left', mono: false, neg: false };
    }
  }, []);

  const productMap = useMemo(() => {
    const m = {};
    (products || []).forEach(p => { m[p?.id] = p; });
    return m;
  }, [products]);

  const productCategories = useMemo(() => {
    const cats = [...new Set((products || []).map(p => p?.category).filter(Boolean))];
    return cats.sort((a, b) => String(a).localeCompare(String(b)));
  }, [products]);

  const productCategoryOptions = useMemo(() => {
    const q = productCategoryInput.trim().toLowerCase();
    if (!q) return productCategories.filter(c => !productCategorySelected.includes(c));
    return productCategories.filter(c => !productCategorySelected.includes(c) && String(c).toLowerCase().includes(q));
  }, [productCategories, productCategorySelected, productCategoryInput]);

  const { summary, itemRows } = useMemo(() => {
    const openingByProduct = {};
    const locSet = locationSelected.length > 0 ? new Set(locationSelected) : null;
    const movBefore = locSet ? (movementsBefore || []).filter(m => locSet.has(m?.location || '')) : (movementsBefore || []);
    movBefore.forEach(m => {
      const pid = m?.product_id;
      if (!pid) return;
      openingByProduct[pid] = (openingByProduct[pid] || 0) + (Number(m.quantity) || 0);
    });

    const movFiltered = locSet ? (movements || []).filter(m => locSet.has(m?.location || '')) : (movements || []);
    const breakagesByProduct = {};
    (breakages || []).forEach(b => {
      const pid = b?.product_id;
      if (!pid) return;
      breakagesByProduct[pid] = (breakagesByProduct[pid] || 0) + (Number(b.breakages_btl) || 0);
    });

    const byProduct = {};
    movFiltered.forEach(m => {
      const pid = m?.product_id || 'unknown';
      if (!byProduct[pid]) byProduct[pid] = { purchases: 0, sales: 0, transferIn: 0, transferOut: 0, adjustments: 0, totalQty: 0, receipt: 0, emptiesInvoice: 0, emptiesPurchase: 0, emptiesDispatch: 0, salesDispatch: 0, issue: 0 };
      const qty = Number(m.quantity) || 0;
      byProduct[pid].totalQty += qty;
      const type = (m.transaction_type || m.movement_type || '').toLowerCase();
      if (type === 'receipt' || type === 'purchase_invoice') { byProduct[pid].purchases += qty; byProduct[pid].receipt += qty; }
      else if (type === 'sales_dispatch') { byProduct[pid].sales += Math.abs(qty); byProduct[pid].salesDispatch += Math.abs(qty); }
      else if (type === 'issue' || type === 'sale') { byProduct[pid].sales += Math.abs(qty); byProduct[pid].issue += Math.abs(qty); }
      else if (type === 'transfer') { if (qty > 0) { byProduct[pid].transferIn += qty; byProduct[pid].purchases += qty; } else { byProduct[pid].transferOut += Math.abs(qty); byProduct[pid].sales += Math.abs(qty); } }
      else if (type === 'adjustment') byProduct[pid].adjustments += qty;
      else if (type === 'empties_invoice') { byProduct[pid].emptiesInvoice += qty; byProduct[pid].purchases += qty; }
      else if (type === 'empties_purchase_invoice') { byProduct[pid].emptiesPurchase += qty; byProduct[pid].purchases += qty; }
      else if (type === 'empties_dispatch') { byProduct[pid].emptiesDispatch += Math.abs(qty); byProduct[pid].sales += Math.abs(qty); }
    });

    let openingCtns = 0;
    let purchasesCtns = 0;
    let salesCtns = 0;
    let closingCtns = 0;
    let orderCtns = 0;

    let prods = products || [];
    if (productCategorySelected.length > 0) {
      const catSet = new Set(productCategorySelected);
      prods = prods.filter(p => catSet.has(p?.category));
    }

    const rows = prods.map(p => {
      const pid = p?.id;
      const pack = Math.max(1, parseFloat(p?.pack_unit) || 1);
      const isPhysiEmpties = (p?.product_name || '').toLowerCase().includes(PHYSI_EMPTIES);
      const openQty = openingByProduct[pid] || 0;
      const data = byProduct[pid] || {};
      const brk = breakagesByProduct[pid] || 0;

      let purchasesQty;
      let salesQty;
      if (isPhysiEmpties) {
        purchasesQty = (data.emptiesInvoice || 0) + (data.emptiesPurchase || 0);
        salesQty = (data.emptiesDispatch || 0) + (data.issue || 0);
      } else {
        purchasesQty = (data.receipt || 0) + (data.transferIn || 0) - brk;
        salesQty = (data.salesDispatch || 0) + (data.issue || 0) + (data.transferOut || 0);
      }
      const periodNetQty = (data.totalQty || 0) - (isPhysiEmpties ? 0 : brk);
      const closingQty = openQty + periodNetQty;
      const openCtn = pack > 0 ? openQty / pack : openQty;
      const closingCtn = pack > 0 ? closingQty / pack : closingQty;
      const purchasesCtn = pack > 0 ? purchasesQty / pack : purchasesQty;
      const salesCtn = pack > 0 ? salesQty / pack : salesQty;
      const orderCtn = salesCtn - closingCtn;
      const btlQty = Math.round(closingQty * pack);
      openingCtns += openCtn;
      purchasesCtns += purchasesCtn;
      salesCtns += salesCtn;
      closingCtns += closingCtn;
      orderCtns += orderCtn;
      return {
        product_id: pid,
        product_code: p?.product_code,
        product_name: p?.product_name,
        pack_unit: pack,
        openingQty: openQty,
        closingQty,
        closingCtn,
        orderCtn,
        btlQty,
        purchasesQty,
        salesQty,
        purchasesCtn,
        salesCtn,
        openingCtn: openCtn,
        isPhysiEmpties,
      };
    });

    return {
      summary: { openingCtns, purchasesCtns, salesCtns, closingCtns, orderCtns },
      itemRows: rows,
    };
  }, [movements, movementsBefore, products, breakages, locationSelected, productCategorySelected]);

  const filteredRows = useMemo(() => {
    let list = itemRows;
    if (itemSelected.length > 0) {
      const terms = itemSelected.map(s => s.toLowerCase().trim()).filter(Boolean);
      list = list.filter(r => terms.some(q => (r.product_code || '').toLowerCase().includes(q) || (r.product_name || '').toLowerCase().includes(q)));
    }
    if (!hideZero) return list;
    return list.filter(r => (r.closingCtn !== 0 && r.closingCtn !== undefined) || (r.orderCtn !== 0 && r.orderCtn !== undefined) || (r.closingQty !== 0 && r.closingQty !== undefined));
  }, [itemRows, hideZero, itemSelected]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        opening: acc.opening + (r.openingCtn || 0),
        purchases: acc.purchases + (r.purchasesCtn || 0),
        sales: acc.sales + (r.salesCtn || 0),
        closing: acc.closing + (r.closingCtn || 0),
        order: acc.order + (r.orderCtn || 0),
        btlqty: acc.btlqty + (r.btlQty || 0),
      }),
      { opening: 0, purchases: 0, sales: 0, closing: 0, order: 0, btlqty: 0 }
    );
  }, [filteredRows]);

  const getTotalForKeyIndex = useCallback((keyIndex) => {
    switch (keyIndex) {
      case 0: case 1: case 2: return { content: '', align: 'right', neg: false };
      case 3: return { content: totals.opening.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', neg: false };
      case 4: return { content: totals.purchases.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', neg: false };
      case 5: return { content: totals.sales.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', neg: false };
      case 6: return { content: totals.closing.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', neg: totals.closing < 0 };
      case 7: return { content: totals.order.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 4 }), align: 'right', neg: totals.order < 0 };
      case 8: return { content: totals.btlqty.toLocaleString('en-GB'), align: 'right', neg: false };
      default: return { content: '', align: 'right', neg: false };
    }
  }, [totals]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const getSortValue = useCallback((row, colIdx) => {
    switch (colIdx) {
      case 0: return (row.product_code || '').toLowerCase();
      case 1: return (row.product_name || '').toLowerCase();
      case 2: return parseFloat(row.pack_unit) || 0;
      case 3: return parseFloat(row.openingCtn) || 0;
      case 4: return parseFloat(row.purchasesCtn) || 0;
      case 5: return parseFloat(row.salesCtn) || 0;
      case 6: return parseFloat(row.closingCtn) || 0;
      case 7: return parseFloat(row.orderCtn) || 0;
      case 8: return parseFloat(row.btlQty) || 0;
      default: return null;
    }
  }, []);
  const sortedFilteredRows = useMemo(() => {
    if (sortConfig.key == null) return filteredRows;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = getSortValue(a, sortConfig.key);
      const vb = getSortValue(b, sortConfig.key);
      if (va === vb) return 0;
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return dir * (cmp < 0 ? -1 : 1);
    });
  }, [filteredRows, sortConfig.key, sortConfig.direction, getSortValue]);
  const handleSort = useCallback((keyIndex) => {
    setSortConfig(prev =>
      prev.key === keyIndex && prev.direction === 'asc'
        ? { key: keyIndex, direction: 'desc' }
        : prev.key === keyIndex && prev.direction === 'desc'
          ? { key: null, direction: 'asc' }
          : { key: keyIndex, direction: 'asc' }
    );
  }, []);

  const handleOpenMovement = useCallback((row) => {
    const locSetForModal = locationSelected.length > 0 ? new Set(locationSelected) : null;
    const locFiltered = locSetForModal ? (movements || []).filter(m => locSetForModal.has(m?.location || '')) : (movements || []);
    const productMovements = locFiltered.filter(m => m?.product_id === row?.product_id);
    const productBreakages = (breakages || []).filter(b => b?.product_id === row?.product_id);
    setModalItem(row);
    setModalMovements(productMovements);
    setModalBreakages(productBreakages);
  }, [movements, breakages, locationSelected]);

  const handleExportCsv = useCallback(() => {
    const headers = visibleColumns.map(c => c.label);
    const lines = [headers.join(',')];
    const rowFields = ['product_code', 'product_name', 'pack_unit', 'openingCtn', 'purchasesCtn', 'salesCtn', 'closingCtn', 'orderCtn', 'btlQty'];
    filteredRows.forEach(r => {
      const cells = visibleColumns.map(col => {
        const ki = COL_KEYS.indexOf(col.key);
        const val = r[rowFields[ki]];
        if (ki === 1 && typeof val === 'string') return val.replace(/,/g, ' ');
        return val ?? '';
      });
      lines.push(cells.join(','));
    });
    const totalCells = visibleColumns.map((col, i) => {
      const ki = COL_KEYS.indexOf(col.key);
      if (ki < 3) return i === 0 ? 'Total' : '';
      const t = { 3: totals.opening, 4: totals.purchases, 5: totals.sales, 6: totals.closing, 7: totals.order, 8: totals.btlqty }[ki];
      return t ?? '';
    });
    lines.push(totalCells.join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inventory-change-history-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [filteredRows, totals, dateFrom, dateTo, visibleColumns]);

  const handleExportExcel = useCallback(() => {
    handleExportCsv();
  }, [handleExportCsv]);

  const formatReportTime = (d) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ampm = d.getHours() < 12 ? 'AM' : 'PM';
    const h12 = d.getHours() % 12 || 12;
    return `${y}-${m}-${day} ${h12}:${min}:${s} ${ampm}`;
  };

  return (
    <AppLayout>
      <div className="p-6">
        <BreadcrumbNavigation />
        <div className="flex flex-col gap-4 overflow-x-auto" style={{ minWidth: tableWidth }}>
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="relative" ref={searchPanelRef}>
                <button
                  type="button"
                  onClick={() => setSearchPanelOpen(prev => !prev)}
                  className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <Icon name="Search" size={14} />
                  Search (F3)
                </button>
                {searchPanelOpen && (
                  <div className="absolute left-0 top-full mt-1 z-[100] w-[420px] max-h-[85vh] overflow-auto bg-card border border-border rounded-lg shadow-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Inventory Change History</span>
                      <button type="button" onClick={() => setSearchPanelOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                        <Icon name="X" size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                        <div className="flex gap-4">
                          {['Summary', 'Daily', 'Monthly'].map(t => (
                            <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input type="radio" name="reportType" checked={reportType === t} onChange={() => setReportType(t)} className="rounded-full border-border" />
                              {t}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="text-muted-foreground">From</span>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e?.target?.value)} className="h-8 px-2 border border-border rounded bg-background text-foreground text-xs" />
                          </label>
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="text-muted-foreground">To</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e?.target?.value)} className="h-8 px-2 border border-border rounded bg-background text-foreground text-xs" />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button type="button" onClick={() => { const t = defaultTo(); setDateTo(t); setDateFrom(t); }} className="h-7 px-2 text-xs border border-border rounded hover:bg-muted">Today</button>
                          <button type="button" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); const t = d.toISOString().slice(0, 10); setDateFrom(t); setDateTo(t); }} className="h-7 px-2 text-xs border border-border rounded hover:bg-muted">Prev. Day</button>
                          <button type="button" onClick={() => { const d = new Date(); const to = d.toISOString().slice(0, 10); const from = new Date(d); from.setDate(from.getDate() - 6); setDateFrom(from.toISOString().slice(0, 10)); setDateTo(to); }} className="h-7 px-2 text-xs border border-border rounded hover:bg-muted">This Week (~ Today)</button>
                          <button type="button" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); const to = d.toISOString().slice(0, 10); const from = new Date(d); from.setDate(from.getDate() - 6); setDateFrom(from.toISOString().slice(0, 10)); setDateTo(to); }} className="h-7 px-2 text-xs border border-border rounded hover:bg-muted">Prev. Week</button>
                          <button type="button" onClick={() => { setDateFrom(defaultFrom()); setDateTo(defaultTo()); setLocationSelected([]); setLocationInput(''); setItemSelected([]); setItemInput(''); setProductCategorySelected([]); setProductCategoryInput(''); }} className="h-7 px-2 text-xs border border-border rounded hover:bg-muted">Reset</button>
                        </div>
                      </div>

                      <div>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="text-muted-foreground">Location</span>
                          <div className="relative mb-1">
                            <Icon name="Search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={locationInput}
                              onChange={e => setLocationInput(e?.target?.value)}
                              onKeyDown={e => { if (e?.key === 'Enter' && locationInput.trim()) { const v = locationInput.trim(); if (!locationSelected.includes(v)) setLocationSelected(prev => [...prev, v]); setLocationInput(''); } }}
                              placeholder="Location"
                              className="h-8 w-full pl-8 pr-2 border border-border rounded bg-background text-foreground text-xs"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {locationSelected.map((loc, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                                {loc}
                                <button type="button" onClick={() => setLocationSelected(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                  <Icon name="X" size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer mt-2">
                          <input type="checkbox" checked={basedOnIndividualLocation} onChange={e => setBasedOnIndividualLocation(e?.target?.checked)} className="rounded border-border" />
                          Based on Individual Location
                        </label>
                      </div>

                      <div>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="text-muted-foreground">Item</span>
                          <div className="relative mb-1">
                            <Icon name="Search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={itemInput}
                              onChange={e => setItemInput(e?.target?.value)}
                              onKeyDown={e => { if (e?.key === 'Enter' && itemInput.trim()) { const v = itemInput.trim(); if (!itemSelected.includes(v)) setItemSelected(prev => [...prev, v]); setItemInput(''); } }}
                              placeholder="Item"
                              className="h-8 w-full pl-8 pr-2 border border-border rounded bg-background text-foreground text-xs"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {itemSelected.map((it, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                                {it}
                                <button type="button" onClick={() => setItemSelected(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                  <Icon name="X" size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Product category</p>
                      <div className="relative">
                        <Icon name="Search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                        <input
                          type="text"
                          value={productCategoryInput}
                          onChange={e => { setProductCategoryInput(e?.target?.value); setProductCategoryDropdownOpen(true); }}
                          onFocus={() => setProductCategoryDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setProductCategoryDropdownOpen(false), 150)}
                          onKeyDown={e => {
                            if (e?.key === 'Enter') {
                              e.preventDefault();
                              const first = productCategoryOptions[0];
                              if (first) { setProductCategorySelected(prev => prev.includes(first) ? prev : [...prev, first]); setProductCategoryInput(''); }
                              else if (productCategoryInput.trim() && productCategories.some(c => c.toLowerCase() === productCategoryInput.trim().toLowerCase())) {
                                const exact = productCategories.find(c => c.toLowerCase() === productCategoryInput.trim().toLowerCase());
                                if (exact && !productCategorySelected.includes(exact)) { setProductCategorySelected(prev => [...prev, exact]); setProductCategoryInput(''); }
                              }
                            }
                          }}
                          placeholder="Search category..."
                          className="h-8 w-full pl-8 pr-2 border border-border rounded bg-background text-foreground text-xs"
                        />
                        {productCategoryDropdownOpen && (
                          <div
                            className="absolute left-0 right-0 top-full mt-0.5 z-50 max-h-48 overflow-y-auto bg-card border border-border rounded shadow-lg py-1"
                            onMouseDown={e => e.preventDefault()}
                          >
                            {productCategoryOptions.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">No matching categories</div>
                            ) : (
                              productCategoryOptions.slice(0, 200).map(cat => (
                                <button
                                  key={cat}
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
                                  onClick={() => { setProductCategorySelected(prev => prev.includes(cat) ? prev : [...prev, cat]); setProductCategoryInput(''); setProductCategoryDropdownOpen(false); }}
                                >
                                  {cat}
                                </button>
                              ))
                            )}
                            {productCategoryOptions.length > 200 && (
                              <div className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border">Type to narrow down ({productCategoryOptions.length} total)</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2" onClick={() => setProductCategoryDropdownOpen(false)}>
                        {productCategorySelected.map((cat, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                            {cat}
                            <button type="button" onClick={() => setProductCategorySelected(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                              <Icon name="X" size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Applied template</span>
                      <select
                        value={appliedTemplateId ?? ''}
                        onChange={e => { const id = e.target.value || null; setAppliedTemplateId(id); const t = templates.find(x => x.id === id); if (t) applyTemplate(t); }}
                        className="h-8 w-full px-2 border border-border rounded bg-background text-foreground text-xs"
                      >
                        <option value="">— None —</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}{t.is_default ? ' (default)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                      <button type="button" className="h-8 px-3 text-xs font-medium border border-border rounded bg-background hover:bg-muted flex items-center gap-1">
                        Stock & Sa
                        <Icon name="ChevronDown" size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSearchPanelOpen(false); fetchData(); }}
                        className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"
                      >
                        Search (F8)
                        <Icon name="ChevronDown" size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={optionRef}>
                <button
                  type="button"
                  onClick={() => setOptionOpen(prev => !prev)}
                  className="h-8 px-3 text-xs font-medium border border-border rounded bg-background hover:bg-muted flex items-center gap-1.5"
                >
                  Option
                </button>
                {optionOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] py-1 bg-card border border-border rounded shadow-lg">
                    <div className="relative">
                      <button type="button" onMouseEnter={() => setTemplateSettingsOpen(true)} onMouseLeave={() => setTemplateSettingsOpen(false)} className="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center justify-between">
                        Template Settings
                        <Icon name="ChevronRight" size={12} />
                      </button>
                      {templateSettingsOpen && (
                        <div className="absolute left-full top-0 ml-0 min-w-[160px] py-1 bg-card border border-border rounded shadow-lg" onMouseEnter={() => setTemplateSettingsOpen(true)} onMouseLeave={() => setTemplateSettingsOpen(false)}>
                          {templates.map(t => (
                            <button key={t.id} type="button" onClick={() => { applyTemplate(t); setOptionOpen(false); setTemplateSettingsOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center gap-2">
                              {t.is_default && <Icon name="Check" size={12} />}
                              {t.name}
                            </button>
                          ))}
                          <button type="button" onClick={() => { setTemplateToEdit(null); setTemplateEditOpen(true); setOptionOpen(false); setTemplateSettingsOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted border-t border-border">
                            New Template
                          </button>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => { const t = templates.find(x => x.id === appliedTemplateId); if (t) { setTemplateToEdit(t); setTemplateEditOpen(true); } setOptionOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Edit current template</button>
                    <button type="button" onClick={() => { saveColumnLayout(); setOptionOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Save layout</button>
                    <button type="button" onClick={() => { setColumns(buildDefaultColumns()); try { localStorage.removeItem('inventory-change-history-columns'); } catch {}; setOptionOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Reset columns</button>
                    <button type="button" onClick={() => { handleExportCsv(); setOptionOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">CSV</button>
                    <button type="button" onClick={() => { handleExportExcel(); setOptionOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Excel</button>
                    <button type="button" className="w-full px-3 py-2 text-left text-xs hover:bg-muted text-muted-foreground">Search Field Settings</button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="h-8 px-3 text-xs font-medium border border-border rounded bg-background hover:bg-muted"
              >
                Help
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-foreground">Inventory Change History</h1>
            <span className="text-sm text-muted-foreground shrink-0">{dateFrom} ~ {dateTo}</span>
          </div>

          {selectedCompany?.name && (
            <p className="text-sm text-muted-foreground">Company Name : {selectedCompany.name}</p>
          )}

          <div className="text-sm text-muted-foreground">
            {filteredRows.length} items
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e?.target?.checked)} className="rounded border-border" />
            Hide items with zero
          </label>

          <div className="overflow-auto rounded-lg border border-border bg-card">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader" size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <table
                className="text-xs border-collapse border border-border"
                style={{ tableLayout: 'fixed', width: tableWidth }}
              >
                <colgroup>
                  {visibleColumns.map(col => <col key={col.key} style={{ width: col.width }} />)}
                </colgroup>
                <thead>
                  <tr>
                    {visibleColumns.map((col) => {
                      const keyIndex = COL_KEYS.indexOf(col.key);
                      const isLeft = keyIndex <= 1;
                      return (
                        <th
                          key={col.key}
                          role="button"
                          tabIndex={0}
                          onClick={e => { if (!e?.target?.closest?.('[data-resize]')) handleSort(keyIndex); }}
                          onKeyDown={e => { if (e?.key === 'Enter' || e?.key === ' ') { e.preventDefault(); handleSort(keyIndex); } }}
                          className={`${thCls} cursor-pointer hover:bg-primary/20 ${isLeft ? 'text-left' : 'text-right'}`}
                          style={{ width: col.width, minWidth: 40 }}
                        >
                          {col.label}
                          <div
                            data-resize
                            onMouseDown={e => handleResizeStart(col.key, col.width, e)}
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30"
                            style={{ touchAction: 'none' }}
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredRows.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length} className={`${tdCls} py-8 text-center text-muted-foreground`}>No items found</td></tr>
                  ) : (
                    sortedFilteredRows.map((row, idx) => (
                      <tr
                        key={row.product_id}
                        onClick={() => handleOpenMovement(row)}
                        className={`cursor-pointer hover:bg-primary/5 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                      >
                        {visibleColumns.map((col) => {
                          const keyIndex = COL_KEYS.indexOf(col.key);
                          const cell = getCellForKeyIndex(row, keyIndex);
                          return (
                            <td
                              key={col.key}
                              className={`${tdCls} ${cell.mono ? 'font-mono' : ''} ${cell.align === 'right' ? 'text-right tabular-nums' : 'text-left'} ${cell.neg ? 'text-destructive' : ''}`}
                            >
                              {keyIndex === 1 && typeof cell.content === 'string' ? cell.content.replace(/,/g, ' ') : cell.content}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/20 font-semibold">
                    <td colSpan={visibleColumns.filter(c => COL_KEYS.indexOf(c.key) < 3).length} className={tdCls}>Total</td>
                    {visibleColumns.filter(c => COL_KEYS.indexOf(c.key) >= 3).map((col) => {
                      const keyIndex = COL_KEYS.indexOf(col.key);
                      const cell = getTotalForKeyIndex(keyIndex);
                      return (
                        <td key={col.key} className={`${tdCls} text-right tabular-nums ${cell.neg ? 'text-destructive' : ''}`}>{cell.content}</td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">[P.1]</span>
              <div className="relative" ref={printRef}>
                <button
                  type="button"
                  onClick={() => setPrintOpen(prev => !prev)}
                  className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1.5"
                >
                  Print
                  <Icon name="ChevronDown" size={12} />
                </button>
                {printOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] py-1 bg-card border border-border rounded shadow-lg">
                    <button type="button" onClick={() => { window.print(); setPrintOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Print current</button>
                  </div>
                )}
              </div>
              <div className="relative" ref={excelRef}>
                <button
                  type="button"
                  onClick={() => setExcelOpen(prev => !prev)}
                  className="h-8 px-3 text-xs font-medium border border-border rounded bg-background hover:bg-muted flex items-center gap-1.5"
                >
                  Excel
                  <Icon name="ChevronDown" size={12} />
                </button>
                {excelOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] py-1 bg-card border border-border rounded shadow-lg">
                    <button type="button" onClick={() => { handleExportCsv(); setExcelOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Export CSV</button>
                    <button type="button" onClick={() => { handleExportExcel(); setExcelOpen(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">Export Excel</button>
                  </div>
                )}
              </div>
            </div>
            {reportGeneratedAt && (
              <span className="text-xs text-muted-foreground shrink-0">{formatReportTime(reportGeneratedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <InventoryMovementModal
        isOpen={!!modalItem}
        onClose={() => { setModalItem(null); setModalMovements([]); setModalBreakages([]); }}
        item={modalItem}
        dateFrom={dateFrom}
        dateTo={dateTo}
        movements={modalMovements}
        breakages={modalBreakages}
      />

      <TemplateEditModal
        isOpen={templateEditOpen}
        onClose={() => { setTemplateEditOpen(false); setTemplateToEdit(null); }}
        template={templateToEdit}
        currentColumns={columns}
        currentSortConfig={sortConfig}
        onSave={(savedTemplate) => { if (savedTemplate && savedTemplate.id === appliedTemplateId) applyTemplate(savedTemplate); }}
        onTemplatesChange={fetchTemplates}
      />
    </AppLayout>
  );
};

export default InventoryChangeHistory;
