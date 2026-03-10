import React, { useState, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useCompanyLocation } from '../../../contexts/CompanyLocationContext';

const ENTITY_META = {
  products: {
    label: 'Products',
    subtitle: 'Add or update products by SKU / product code',
    requiredCols: 'product_code (or sku), name, unit_of_measure',
    previewCols: ['product_code', 'product_name', 'unit_of_measure'],
    codeKey: 'product_code',
    nameKey: 'product_name',
    uomKey: 'unit_of_measure',
    codeAliases: ['product_code', 'sku'],
    nameAliases: ['product_name', 'name'],
  },
  customers: {
    label: 'Customers',
    subtitle: 'Add or update customer accounts',
    requiredCols: 'customer_code, customer_name',
    previewCols: ['customer_code', 'customer_name'],
    codeKey: 'customer_code',
    nameKey: 'customer_name',
    uomKey: null,
    codeAliases: ['customer_code'],
    nameAliases: ['customer_name'],
  },
  vendors: {
    label: 'Vendors',
    subtitle: 'Add or update vendor master data',
    requiredCols: 'vendor_code, vendor_name',
    previewCols: ['vendor_code', 'vendor_name'],
    codeKey: 'vendor_code',
    nameKey: 'vendor_name',
    uomKey: null,
    codeAliases: ['vendor_code'],
    nameAliases: ['vendor_name'],
  },
  business_executives: {
    label: 'Sales Reps',
    subtitle: 'Add or update business executives',
    requiredCols: 'exec_code, first_name, last_name, sales_rep_type',
    previewCols: ['exec_code', 'full_name', 'sales_rep_type'],
    codeKey: 'exec_code',
    nameKey: 'full_name',
    uomKey: null,
  },
  price_lists: {
    label: 'Product Prices',
    subtitle: 'Import price list headers',
    requiredCols: 'price_list_code, price_list_name',
    previewCols: ['price_list_code', 'price_list_name'],
  },
  opening_stocks: { label: 'Opening Stocks', subtitle: 'Import opening stock balances', requiredCols: 'Coming soon' },
  ssr_monthly_targets: { label: 'Shop Sales Rep Targets', subtitle: 'Import SSR monthly targets', requiredCols: 'Coming soon' },
  vsr_monthly_targets: { label: 'Van Sales Rep Targets', subtitle: 'Import VSR monthly targets', requiredCols: 'Coming soon' },
  sales_invoices: { label: 'Sales Invoices', subtitle: 'Import sales invoices', requiredCols: 'Coming soon' },
  purchase_invoices: { label: 'Purchase Invoices', subtitle: 'Import purchase invoices', requiredCols: 'Coming soon' },
};

const PREVIEW_ROW_OPTIONS = [10, 25, 50, 100];

const ImportEntityView = ({ entityKey, entityConfig, onImportComplete }) => {
  const { selectedCompany } = useCompanyLocation();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationResults, setValidationResults] = useState([]);
  const [previewRows, setPreviewRows] = useState(25);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  const fileInputRef = useRef(null);

  // Reset state when switching entity
  React.useEffect(() => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({});
    setValidationResults([]);
    setImportSuccess(null);
  }, [entityKey]);

  const meta = ENTITY_META[entityKey] || { label: entityKey, subtitle: '', requiredCols: '' };
  const isImplemented = !!entityConfig;

  const parseCSV = (text) => {
    const lines = text?.split(/\r?\n/)?.filter((l) => l?.trim());
    if (lines?.length < 2) return { headers: [], rows: [] };
    const parseRow = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line?.length; i++) {
        if (line?.[i] === '"') inQuotes = !inQuotes;
        else if (line?.[i] === ',' && !inQuotes) {
          result.push(current?.trim());
          current = '';
        } else current += line?.[i];
      }
      result.push(current?.trim());
      return result;
    };
    const hdrs = parseRow(lines[0]);
    const rows = lines.slice(1).map((line, idx) => {
      const vals = parseRow(line);
      const row = { _rowIndex: idx + 2 };
      hdrs.forEach((h, i) => { row[h] = vals[i] || ''; });
      return row;
    });
    return { headers: hdrs, rows };
  };

  const downloadTemplate = () => {
    if (!entityConfig) return;
    const hs = entityConfig.fields?.map((f) => f.key) || [];
    const rows = [hs.join(',')];
    if (entityConfig.sampleRow) {
      const vals = hs.map((h) => {
        const v = entityConfig.sampleRow[h] ?? '';
        return String(v).includes(',') ? `"${v}"` : v;
      });
      rows.push(vals.join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityKey}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = useCallback(
    (f) => {
      if (!f) return;
      const ext = f.name?.split('.')?.pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        alert('Please upload a CSV or Excel file.');
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        alert('File size must be under 10MB.');
        return;
      }
      setFile(f);
      setImportSuccess(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e?.target?.result;
        const { headers: hdrs, rows } = parseCSV(text);
        setHeaders(hdrs);
        setParsedData(rows);

        const autoMap = {};
        entityConfig?.fields?.forEach((field) => {
          const match = hdrs?.find(
            (h) =>
              h?.toLowerCase()?.replace(/[^a-z0-9]/g, '') === field?.key?.toLowerCase()?.replace(/[^a-z0-9]/g, '') ||
              h?.toLowerCase()?.includes(field?.label?.toLowerCase()) ||
              (field.key === 'product_code' && /sku/i.test(h)) ||
              (field.key === 'product_name' && /^name$/i.test(h))
          );
          if (match) autoMap[field.key] = match;
        });
        setColumnMapping(autoMap);
        validateDataInline(hdrs, rows, autoMap);
      };
      reader.readAsText(f);
    },
    [entityConfig]
  );

  const validateDataInline = (hdrs, rows, mapping) => {
    if (!entityConfig) return;
    const results = rows.map((row) => {
      const errors = [];
      entityConfig.fields?.forEach((field) => {
        const csvCol = mapping?.[field.key];
        const value = csvCol ? row?.[csvCol] : '';
        if (field.required && (!value || value?.toString()?.trim() === '')) {
          errors.push({ field: field.label, message: `${field.label} is required` });
        }
      });
      return { row, errors, valid: errors.length === 0 };
    });
    setValidationResults(results);
  };

  const handleImport = async () => {
    if (!entityConfig) return;
    const validRows = validationResults.filter((r) => r.valid);
    if (validRows.length === 0) return;
    setImporting(true);
    setImportSuccess(null);
    let successCount = 0;
    let failCount = 0;
    let validationData = {};
    if (entityConfig.validateFn) {
      try {
        validationData = await entityConfig.validateFn();
      } catch {}
    }
    for (const { row } of validRows) {
      try {
        const record = {};
        entityConfig.fields?.forEach((field) => {
          const csvCol = columnMapping?.[field.key];
          if (csvCol && row?.[csvCol] !== undefined) record[field.key] = row[csvCol];
        });
        const res = await entityConfig.insertFn(
          record,
          validRows,
          validationData?.vsrExecCodes || validationData?.ssrExecCodes,
          validationData?.productCodes,
          validationData
        );
        const err = res?.error;
        if (err) failCount++;
        else successCount++;
      } catch {
        failCount++;
      }
    }
    setImporting(false);
    setImportSuccess({ success: successCount, failed: failCount });
    if (successCount > 0) onImportComplete?.();
  };

  const validCount = validationResults?.filter((r) => r.valid)?.length || 0;
  const rowsLoaded = parsedData?.length || 0;
  const displayRows = validationResults?.slice(0, previewRows) || [];

  if (!isImplemented) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imports — {meta.label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta.subtitle}</p>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-8 text-center text-muted-foreground">
          <p className="font-medium">Coming soon</p>
          <p className="text-sm mt-1">This import type is not yet implemented.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imports — {meta.label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: {meta.requiredCols}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate} iconName="Download" iconPosition="left">
            Download template
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => fileInputRef?.current?.click()}
            iconName="Upload"
            iconPosition="left"
          >
            Choose CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e?.target?.files?.[0])}
          />
        </div>
      </div>

      {/* Config card */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <p className="text-sm text-foreground mb-2">
          Company: {selectedCompany?.name || '—'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">Upload a CSV file exported from Excel.</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Preview rows</label>
            <select
              value={previewRows}
              onChange={(e) => setPreviewRows(Number(e.target.value))}
              className="h-9 px-3 text-sm border border-border rounded bg-background"
            >
              {PREVIEW_ROW_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-muted-foreground">Rows loaded: {rowsLoaded}</span>
          <span className="text-sm text-muted-foreground">Valid rows: {validCount}</span>
          <Button
            variant="default"
            size="sm"
            onClick={handleImport}
            disabled={importing || validCount === 0}
            iconName={importing ? 'Loader' : 'Upload'}
            iconPosition="left"
          >
            {importing ? 'Importing...' : 'Import valid rows'}
          </Button>
        </div>
        {importSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-3">
            Imported {importSuccess.success} rows.
            {importSuccess.failed > 0 && ` ${importSuccess.failed} failed.`}
          </p>
        )}
      </div>

      {/* Preview card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Preview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Required columns: {meta.requiredCols}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-14">Row</th>
                {entityConfig?.fields?.slice(0, 4)?.map((f) => (
                  <th key={f.key} className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    {f.label}
                  </th>
                ))}
                {(entityConfig?.fields?.length || 0) < 4 && (
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">—</th>
                )}
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={(entityConfig?.fields?.length || 2) + 2} className="px-4 py-12 text-center text-muted-foreground">
                    No preview yet. Choose a CSV file to get started.
                  </td>
                </tr>
              ) : (
                displayRows.map(({ row, errors, valid }, idx) => (
                  <tr key={idx} className={valid ? '' : 'bg-red-50/50 dark:bg-red-900/10'}>
                    <td className="px-4 py-2.5 text-muted-foreground">{row?._rowIndex}</td>
                    {entityConfig?.fields?.slice(0, 4)?.map((f) => {
                      const csvCol = columnMapping?.[f.key];
                      const val = csvCol ? row?.[csvCol] : '';
                      return (
                        <td key={f.key} className="px-4 py-2.5">
                          {val || '—'}
                        </td>
                      );
                    })}
                    {(entityConfig?.fields?.length || 0) < 4 && <td className="px-4 py-2.5">—</td>}
                    <td className="px-4 py-2.5 text-red-600 text-xs">
                      {errors?.length > 0 ? errors.map((e) => e.message).join('; ') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: In Excel, use File → Save As → CSV.
      </p>
    </div>
  );
};

export default ImportEntityView;
