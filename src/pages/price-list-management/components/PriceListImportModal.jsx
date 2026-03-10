import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, FileText, ChevronDown, Download, ArrowLeft, ArrowRight, Database } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Template headers as requested
const TEMPLATE_HEADERS = ['product_code', 'product_name', 'price_type', 'effective_date', 'price_tax_inc', 'tax_rate', 'vat_type'];

// System fields with labels
const SYSTEM_FIELDS = [
  { key: 'product_code', label: 'Product Code', required: true },
  { key: 'product_name', label: 'Product Name', required: false },
  { key: 'price_type', label: 'Price Type', required: false },
  { key: 'effective_date', label: 'Effective Date', required: false },
  { key: 'price_tax_inc', label: 'Price (Tax Inc)', required: true },
  { key: 'tax_rate', label: 'Tax Rate', required: false },
  { key: 'vat_type', label: 'VAT Type', required: false },
];

// Column aliases for auto-mapping
const COLUMN_ALIASES = {
  product_code: ['product_code', 'product code', 'productcode', 'code', 'sku', 'item code', 'itemcode', 'prod code'],
  product_name: ['product_name', 'product name', 'productname', 'name', 'description', 'item name', 'itemname'],
  price_type: ['price_type', 'price type', 'pricetype', 'customer type', 'customertype', 'type'],
  effective_date: ['effective_date', 'effective date', 'effectivedate', 'date', 'start date', 'startdate'],
  price_tax_inc: ['price_tax_inc', 'price tax inc', 'price (tax inc)', 'price incl tax', 'price incl', 'selling price', 'price', 'unit price', 'unitprice'],
  tax_rate: ['tax_rate', 'tax rate', 'taxrate', 'tax', 'vat rate', 'vatrate', 'tax %', 'tax percent'],
  vat_type: ['vat_type', 'vat type', 'vattype', 'vat', 'tax type', 'taxtype', 'inclusive/exclusive', 'incl/excl'],
};

const normalizeHeader = (h) => (h || '')?.toString()?.trim()?.toLowerCase();

const autoMapColumns = (headers) => {
  const mapping = {};
  headers?.forEach((header, idx) => {
    const norm = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (mapping?.[field] === undefined && aliases?.includes(norm)) {
        mapping[field] = idx;
      }
    }
  });
  return mapping;
};

const STEPS = [
  { key: 'upload', num: '1', label: 'Upload File' },
  { key: 'mapping', num: '2', label: 'Map Columns' },
  { key: 'preview', num: '3', label: 'Validate' },
  { key: 'confirm', num: '4', label: 'Import' },
];

const PriceListImportModal = ({ isOpen, onClose, onSuccess, priceListHeader }) => {
  const [step, setStep] = useState('upload');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [lookupLoaded, setLookupLoaded] = useState(false);
  const fileInputRef = useRef(null);

  // Load lookup data once
  const loadLookups = useCallback(async () => {
    if (lookupLoaded) return;
    try {
      const [prodsResult, taxesResult, ptsResult] = await Promise.all([
        supabase?.from('products')?.select('id, product_code, product_name, unit_of_measure, pack_unit')?.order('product_name'),
        supabase?.from('tax_rates')?.select('id, tax_code, tax_name, rate, rate_percent')?.order('tax_name'),
        supabase?.from('price_types')?.select('id, price_type_code, price_type_name')?.order('price_type_name'),
      ]);
      setProducts(prodsResult?.data || []);
      setTaxRates(taxesResult?.data || []);
      setPriceTypes(ptsResult?.data || []);
      setLookupLoaded(true);
    } catch (err) {
      console.error('Failed to load lookups:', err);
    }
  }, [lookupLoaded]);

  const resetState = () => {
    setStep('upload');
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setPreviewRows([]);
    setFileName('');
    setParseError('');
    setIsParsing(false);
    setIsDragOver(false);
    setIsImporting(false);
    setImportResult(null);
    if (fileInputRef?.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // CSV parser
  const parseCSV = (text) => {
    const lines = text?.split(/\r?\n/)?.filter(l => l?.trim());
    if (!lines || lines?.length < 2) throw new Error('File must have at least a header row and one data row.');
    const parseRow = (line) => {
      const result = [];
      let inQuote = false;
      let cell = '';
      for (let i = 0; i < line?.length; i++) {
        const ch = line?.[i];
        if (ch === '"') {
          if (inQuote && line?.[i + 1] === '"') { cell += '"'; i++; }
          else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
          result?.push(cell?.trim());
          cell = '';
        } else {
          cell += ch;
        }
      }
      result?.push(cell?.trim());
      return result;
    };
    const headers = parseRow(lines?.[0]);
    const rows = lines?.slice(1)?.map(l => parseRow(l));
    return { headers, rows };
  };

  const processFile = async (file) => {
    if (!file) return;
    setParseError('');
    setIsParsing(true);
    setFileName(file?.name);
    await loadLookups();
    try {
      let headers = [];
      let rows = [];
      const ext = file?.name?.split('.')?.pop()?.toLowerCase();
      if (ext === 'csv') {
        const text = await file?.text();
        ({ headers, rows } = parseCSV(text));
      } else {
        throw new Error('Please upload a .csv file. Use the Download Template button to get the correct format.');
      }
      const nonEmpty = rows?.filter(r => r?.some(c => c?.toString()?.trim() !== ''));
      if (nonEmpty?.length === 0) throw new Error('No data rows found in the file.');
      setRawHeaders(headers);
      setRawRows(nonEmpty);
      setColumnMapping(autoMapColumns(headers));
      setStep('mapping');
    } catch (err) {
      setParseError(err?.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragOver(false);
    const file = e?.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => { e?.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleMappingChange = (field, colIdx) => {
    setColumnMapping(prev => ({ ...prev, [field]: colIdx === '' ? undefined : parseInt(colIdx) }));
  };

  const getCellValue = (row, colIdx) => {
    if (colIdx === undefined || colIdx === null || colIdx === '') return '';
    return (row?.[colIdx] ?? '')?.toString()?.trim();
  };

  const downloadTemplate = () => {
    const sampleRow = ['PRD-001', 'Mineral Water 500ml', 'Wholesale', '2026-01-01', '14.38', '15', 'inclusive'];
    const csv = [TEMPLATE_HEADERS?.join(','), sampleRow?.join(',')]?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_list_import_template.csv';
    a?.click();
    URL.revokeObjectURL(url);
  };

  const buildPreview = useCallback(() => {
    const rows = rawRows?.map((row, idx) => {
      const productCode = getCellValue(row, columnMapping?.product_code);
      const productName = getCellValue(row, columnMapping?.product_name);
      const priceTypeRaw = getCellValue(row, columnMapping?.price_type);
      const effectiveDateRaw = getCellValue(row, columnMapping?.effective_date);
      const priceTaxIncRaw = getCellValue(row, columnMapping?.price_tax_inc);
      const taxRateRaw = getCellValue(row, columnMapping?.tax_rate);
      const vatTypeRaw = getCellValue(row, columnMapping?.vat_type);

      const errors = [];

      // Validate product code — must exist in products
      let matchedProduct = null;
      if (productCode) {
        matchedProduct = products?.find(p =>
          p?.product_code?.toLowerCase() === productCode?.toLowerCase()
        );
        if (!matchedProduct) errors?.push(`Product code "${productCode}" not found`);
      } else {
        errors?.push('Missing required field: product_code');
      }

      // Validate price_tax_inc — strip comma thousand-separators before parsing
      const priceTaxIncCleaned = priceTaxIncRaw?.replace(/,/g, '');
      const priceTaxInc = parseFloat(priceTaxIncCleaned);
      if (!priceTaxIncRaw) {
        errors?.push('Missing required field: price_tax_inc');
      } else if (isNaN(priceTaxInc) || priceTaxInc < 0) {
        errors?.push(`Invalid price "${priceTaxIncRaw}" — must be a positive number`);
      }

      // Validate tax rate — match by rate value or name
      let matchedTaxRate = null;
      if (taxRateRaw !== '') {
        const taxNum = parseFloat(taxRateRaw);
        if (!isNaN(taxNum)) {
          matchedTaxRate = taxRates?.find(t => parseFloat(t?.rate) === taxNum || parseFloat(t?.rate_percent) === taxNum);
        }
        if (!matchedTaxRate) {
          matchedTaxRate = taxRates?.find(t =>
            t?.tax_name?.toLowerCase()?.includes(taxRateRaw?.toLowerCase())
          );
        }
        if (!matchedTaxRate) errors?.push(`Tax rate "${taxRateRaw}" not matched`);
      }

      // Match price type by name
      let matchedPriceType = null;
      if (priceTypeRaw) {
        matchedPriceType = priceTypes?.find(pt =>
          pt?.price_type_name?.toLowerCase() === priceTypeRaw?.toLowerCase()
        );
        if (!matchedPriceType) errors?.push(`Price type "${priceTypeRaw}" not found`);
      }

      // Validate effective date
      let effectiveDate = null;
      if (effectiveDateRaw) {
        const d = new Date(effectiveDateRaw);
        if (isNaN(d?.getTime())) {
          errors?.push(`Invalid date "${effectiveDateRaw}"`);
        } else {
          effectiveDate = d?.toISOString()?.split('T')?.[0];
        }
      }

      // Normalize vat_type
      let vatType = 'exclusive';
      if (vatTypeRaw) {
        const v = vatTypeRaw?.toLowerCase();
        if (v?.includes('incl')) vatType = 'inclusive';
        else if (v?.includes('excl')) vatType = 'exclusive';
      }

      return {
        _rowIdx: idx,
        product_code: matchedProduct?.product_code || productCode,
        product_name: matchedProduct?.product_name || productName,
        product_id: matchedProduct?.id || null,
        price_type_id: matchedPriceType?.id || null,
        price_type_name: matchedPriceType?.price_type_name || priceTypeRaw || '',
        effective_date: effectiveDate,
        price_tax_inc: !isNaN(priceTaxInc) ? priceTaxInc : null,
        tax_rate_id: matchedTaxRate?.id || null,
        tax_rate_name: matchedTaxRate ? `${matchedTaxRate?.tax_name} (${matchedTaxRate?.rate || matchedTaxRate?.rate_percent}%)` : taxRateRaw || '',
        vat_type: vatType,
        unit_of_measure: matchedProduct?.unit_of_measure || 'Pieces',
        _errors: errors,
        _valid: errors?.length === 0,
      };
    });
    setPreviewRows(rows);
    setStep('preview');
  }, [rawRows, columnMapping, products, taxRates, priceTypes]);

  const validRows = previewRows?.filter(r => r?._valid);
  const invalidRows = previewRows?.filter(r => !r?._valid);

  const downloadErrorReport = () => {
    const headers = ['Row', 'Product Code', 'Product Name', 'Errors'];
    const rows = invalidRows?.map((r, i) => [
      r?._rowIdx + 1,
      r?.product_code || '',
      r?.product_name || '',
      `"${r?._errors?.join('; ')}"`
    ]?.join(','));
    const csv = [headers?.join(','), ...rows]?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    a?.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = async () => {
    if (!priceListHeader?.id) {
      alert('No price list selected. Please select a price list header before importing.');
      return;
    }
    if (validRows?.length === 0) {
      alert('No valid rows to import.');
      return;
    }
    setIsImporting(true);
    try {
      const records = validRows?.map((r, i) => ({
        price_list_header_id: priceListHeader?.id,
        header_id: priceListHeader?.id,
        product_id: r?.product_id || null,
        product_code: r?.product_code || null,
        product_name: r?.product_name || '',
        price_tax_inc: r?.price_tax_inc || 0,
        unit_price: r?.price_tax_inc || 0,
        price: r?.price_tax_inc || 0,
        tax_rate_id: r?.tax_rate_id || null,
        vat_type: r?.vat_type || 'exclusive',
        unit_of_measure: r?.unit_of_measure || 'Pieces',
        sort_order: i,
      }));

      const { data, error } = await supabase?.from('price_list_items')?.insert(records)?.select();

      if (error) throw error;

      setImportResult({
        imported: data?.length || records?.length,
        skipped: invalidRows?.length,
        errors: invalidRows,
      });
      setStep('done');
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Import failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const currentStepIdx = STEPS?.findIndex(s => s?.key === step || (step === 'done' && s?.key === 'confirm'));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e?.target === e?.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full mx-4 flex flex-col" style={{ maxWidth: '820px', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg shrink-0">
          <div className="flex items-center gap-2">
            <Upload size={15} className="text-white" />
            <h2 className="text-sm font-semibold text-white">
              Import CSV — Price List Items
              {priceListHeader && (
                <span className="ml-2 text-white/70 font-normal">
                  → {priceListHeader?._name || priceListHeader?.name || priceListHeader?.price_list_name || 'Selected List'}
                </span>
              )}
            </h2>
          </div>
          <button onClick={handleClose} className="text-white hover:text-white/70 transition-colors p-0.5 rounded">
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center border-b border-gray-200 px-5 bg-gray-50 shrink-0">
          {STEPS?.map((s, i) => {
            const isActive = step === s?.key || (step === 'done' && s?.key === 'confirm');
            const isCompleted = i < currentStepIdx;
            return (
              <div key={s?.key} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                isActive ? 'border-primary text-primary' :
                isCompleted ? 'border-green-400 text-green-600': 'border-transparent text-gray-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-primary text-white' :
                  isCompleted ? 'bg-green-500 text-white': 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : s?.num}
                </span>
                {s?.label}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              {/* Drag-drop zone */}
              <div
                className={`w-full max-w-lg border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/10' :'border-gray-300 hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => fileInputRef?.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isDragOver ? 'bg-primary/20' : 'bg-gray-100'
                }`}>
                  <Upload size={24} className={isDragOver ? 'text-primary' : 'text-gray-400'} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    {isDragOver ? 'Drop your CSV file here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports .csv files only</p>
                </div>
                {isParsing && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Parsing file...
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />

              {parseError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 max-w-lg w-full">
                  <AlertTriangle size={13} className="shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Template info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-lg w-full">
                <p className="text-xs font-semibold text-gray-600 mb-2">Required CSV columns:</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TEMPLATE_HEADERS?.map(h => (
                    <span key={h} className="text-[10px] px-2 py-0.5 bg-white border border-gray-300 rounded font-mono text-gray-600">{h}</span>
                  ))}
                </div>
                <button
                  onClick={e => { e?.stopPropagation(); downloadTemplate(); }}
                  className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-primary text-primary rounded hover:bg-primary/5 transition-colors"
                >
                  <Download size={12} />
                  Download Template
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'mapping' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  File: <span className="font-medium text-gray-700">{fileName}</span>
                  <span className="ml-2 text-gray-400">— {rawRows?.length} data rows</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Auto-detected column mapping below. Adjust dropdowns if any column is incorrectly mapped.</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {SYSTEM_FIELDS?.map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600 w-32 shrink-0">
                      {label}
                      {required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <div className="relative flex-1">
                      <select
                        value={columnMapping?.[key] !== undefined ? columnMapping?.[key] : ''}
                        onChange={e => handleMappingChange(key, e?.target?.value)}
                        className="w-full h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary bg-white appearance-none pr-6"
                      >
                        <option value="">— Not mapped —</option>
                        {rawHeaders?.map((h, i) => (
                          <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {columnMapping?.[key] !== undefined ? (
                      <CheckCircle size={13} className="text-green-500 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Sample preview */}
              {rawRows?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">File preview (first 3 rows):</p>
                  <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          {rawHeaders?.map((h, i) => (
                            <th key={i} className="px-2 py-1.5 text-left font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">{h || `Col ${i + 1}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawRows?.slice(0, 3)?.map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            {rawHeaders?.map((_, ci) => (
                              <td key={ci} className="px-2 py-1 text-gray-600 border-b border-gray-100 whitespace-nowrap">{row?.[ci] ?? ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Validation Preview */}
          {step === 'preview' && (
            <div>
              {/* Summary badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2.5 py-1 font-medium">
                  <CheckCircle size={12} /> {validRows?.length} valid
                </span>
                {invalidRows?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1 font-medium">
                    <AlertTriangle size={12} /> {invalidRows?.length} invalid
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-1">{previewRows?.length} total rows</span>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="overflow-x-auto" style={{ maxHeight: '340px' }}>
                  <table className="w-full text-xs border-collapse" style={{ minWidth: '700px' }}>
                    <thead className="sticky top-0">
                      <tr className="bg-gray-50">
                        <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500 w-8">#</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500 w-24">Product Code</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500">Product Name</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500 w-28">Price Type</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500 w-24">Eff. Date</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-right font-medium text-gray-500 w-24">Price (Tax Inc)</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500 w-28">Tax Rate</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-center font-medium text-gray-500 w-16">VAT</th>
                        <th className="border-b border-gray-200 px-2 py-1.5 text-center font-medium text-gray-500 w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows?.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`${
                            !row?._valid
                              ? 'bg-red-50'
                              : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="border-b border-gray-100 px-2 py-1 text-gray-400">{idx + 1}</td>
                          <td className="border-b border-gray-100 px-2 py-1 font-mono text-gray-600">{row?.product_code || '—'}</td>
                          <td className="border-b border-gray-100 px-2 py-1">
                            <div className="font-medium text-gray-700">{row?.product_name || '—'}</div>
                            {!row?._valid && row?._errors?.length > 0 && (
                              <div className="text-red-500 text-[10px] mt-0.5 leading-tight">{row?._errors?.join('; ')}</div>
                            )}
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1">
                            {row?.price_type_name ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{row?.price_type_name}</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1 text-gray-500 whitespace-nowrap">{row?.effective_date || '—'}</td>
                          <td className="border-b border-gray-100 px-2 py-1 text-right tabular-nums font-medium text-gray-700">
                            {row?.price_tax_inc != null ? Number(row?.price_tax_inc)?.toFixed(2) : '—'}
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1 text-gray-500 text-[10px]">{row?.tax_rate_name || <span className="text-gray-300">—</span>}</td>
                          <td className="border-b border-gray-100 px-2 py-1 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              row?.vat_type === 'inclusive' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {row?.vat_type === 'inclusive' ? 'Incl.' : 'Excl.'}
                            </span>
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1 text-center">
                            {row?._valid ? (
                              <CheckCircle size={13} className="text-green-500 mx-auto" />
                            ) : (
                              <AlertTriangle size={13} className="text-red-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Import Confirmation */}
          {step === 'confirm' && (
            <div className="py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Database size={14} className="text-primary" />
                  Import Summary
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{validRows?.length}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Rows to Import</div>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{invalidRows?.length}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Rows to Skip</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-700">{previewRows?.length}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Total Rows</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded p-3">
                  <p className="font-medium text-gray-700 mb-1">Target price list:</p>
                  <p className="text-primary font-semibold">
                    {priceListHeader?._name || priceListHeader?.name || priceListHeader?.price_list_name || 'Selected Price List'}
                  </p>
                  {invalidRows?.length > 0 && (
                    <p className="mt-2 text-amber-600">
                      ⚠ {invalidRows?.length} invalid row{invalidRows?.length !== 1 ? 's' : ''} will be skipped. Download the error report to review.
                    </p>
                  )}
                </div>
              </div>

              {/* Valid rows preview */}
              {validRows?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Rows to be imported ({validRows?.length}):</p>
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '200px' }}>
                      <table className="w-full text-xs border-collapse" style={{ minWidth: '500px' }}>
                        <thead className="sticky top-0">
                          <tr className="bg-green-50">
                            <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500">#</th>
                            <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500">Product Code</th>
                            <th className="border-b border-gray-200 px-2 py-1.5 text-left font-medium text-gray-500">Product Name</th>
                            <th className="border-b border-gray-200 px-2 py-1.5 text-right font-medium text-gray-500">Price (Tax Inc)</th>
                            <th className="border-b border-gray-200 px-2 py-1.5 text-center font-medium text-gray-500">VAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validRows?.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="border-b border-gray-100 px-2 py-1 text-gray-400">{idx + 1}</td>
                              <td className="border-b border-gray-100 px-2 py-1 font-mono text-gray-600">{row?.product_code || '—'}</td>
                              <td className="border-b border-gray-100 px-2 py-1 text-gray-700">{row?.product_name || '—'}</td>
                              <td className="border-b border-gray-100 px-2 py-1 text-right tabular-nums font-medium text-gray-700">
                                {row?.price_tax_inc != null ? Number(row?.price_tax_inc)?.toFixed(2) : '—'}
                              </td>
                              <td className="border-b border-gray-100 px-2 py-1 text-center">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  row?.vat_type === 'inclusive' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {row?.vat_type === 'inclusive' ? 'Incl.' : 'Excl.'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DONE state */}
          {step === 'done' && importResult && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-gray-800">Import Successful!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-green-600">{importResult?.imported}</span> rows imported successfully.
                  {importResult?.skipped > 0 && (
                    <span className="ml-1 text-red-500">{importResult?.skipped} rows skipped.</span>
                  )}
                </p>
              </div>
              {importResult?.errors?.length > 0 && (
                <button
                  onClick={downloadErrorReport}
                  className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  <Download size={12} />
                  Download Error Report ({importResult?.errors?.length} rows)
                </button>
              )}
              <button
                onClick={handleClose}
                className="h-8 px-5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'done' && (
          <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg shrink-0">
            <div>
              {(step === 'mapping' || step === 'preview' || step === 'confirm') && (
                <button
                  onClick={() => {
                    if (step === 'mapping') setStep('upload');
                    else if (step === 'preview') setStep('mapping');
                    else if (step === 'confirm') setStep('preview');
                  }}
                  className="flex items-center gap-1 h-7 px-3 text-xs font-medium border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={12} /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="h-7 px-4 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              {step === 'mapping' && (
                <button
                  onClick={buildPreview}
                  className="flex items-center gap-1.5 h-7 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Preview & Validate <ArrowRight size={12} />
                </button>
              )}
              {step === 'preview' && (
                <>
                  {invalidRows?.length > 0 && (
                    <button
                      onClick={downloadErrorReport}
                      className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Download size={12} /> Error Report
                    </button>
                  )}
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={validRows?.length === 0}
                    className="flex items-center gap-1.5 h-7 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Import <ArrowRight size={12} />
                  </button>
                </>
              )}
              {step === 'confirm' && (
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting || validRows?.length === 0}
                  className="flex items-center gap-1.5 h-7 px-4 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database size={12} /> Confirm Import ({validRows?.length} rows)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceListImportModal;
