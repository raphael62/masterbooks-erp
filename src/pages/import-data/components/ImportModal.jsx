import React, { useState, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const STEPS = ['upload', 'mapping', 'preview', 'summary'];

const ImportModal = ({ entityType, entityConfig, onClose, onImportComplete }) => {
  const [step, setStep] = useState('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationResults, setValidationResults] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const headers = entityConfig?.fields?.map(f => f?.key);
    const rows = [headers?.join(',')];
    if (entityConfig?.sampleRow) {
      const sampleValues = headers?.map(h => {
        const val = entityConfig?.sampleRow?.[h] ?? '';
        return String(val)?.includes(',') ? `"${val}"` : val;
      });
      rows?.push(sampleValues?.join(','));
    }
    const csv = rows?.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityConfig?.key}_import_template.csv`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text?.split(/\r?\n/)?.filter(l => l?.trim());
    if (lines?.length < 2) return { headers: [], rows: [] };
    const parseRow = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line?.length; i++) {
        if (line?.[i] === '"') { inQuotes = !inQuotes; }
        else if (line?.[i] === ',' && !inQuotes) { result?.push(current?.trim()); current = ''; }
        else { current += line?.[i]; }
      }
      result?.push(current?.trim());
      return result;
    };
    const hdrs = parseRow(lines?.[0]);
    const rows = lines?.slice(1)?.map((line, idx) => {
      const vals = parseRow(line);
      const row = { _rowIndex: idx + 2 };
      hdrs?.forEach((h, i) => { row[h] = vals?.[i] || ''; });
      return row;
    });
    return { headers: hdrs, rows };
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    const ext = f?.name?.split('.')?.pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls']?.includes(ext)) {
      alert('Please upload a CSV or Excel file.');
      return;
    }
    if (f?.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e?.target?.result;
      const { headers: hdrs, rows } = parseCSV(text);
      setHeaders(hdrs);
      setParsedData(rows);
      // Auto-map columns
      const autoMap = {};
      entityConfig?.fields?.forEach(field => {
        const match = hdrs?.find(h =>
          h?.toLowerCase()?.replace(/[^a-z0-9]/g, '') ===
          field?.key?.toLowerCase()?.replace(/[^a-z0-9]/g, '') ||
          h?.toLowerCase()?.includes(field?.label?.toLowerCase())
        );
        if (match) autoMap[field.key] = match;
      });
      setColumnMapping(autoMap);
      setStep('mapping');
    };
    reader?.readAsText(f);
  }, [entityConfig]);

  const handleDrop = useCallback((e) => {
    e?.preventDefault();
    setIsDragging(false);
    const f = e?.dataTransfer?.files?.[0];
    handleFile(f);
  }, [handleFile]);

  const validateData = () => {
    const results = parsedData?.map((row) => {
      const errors = [];
      entityConfig?.fields?.forEach(field => {
        const csvCol = columnMapping?.[field?.key];
        const value = csvCol ? row?.[csvCol] : '';
        if (field?.required && (!value || value?.toString()?.trim() === '')) {
          errors?.push({ field: field?.label, type: 'required', message: `${field?.label} is required` });
        }
        if (value && field?.type === 'number' && isNaN(Number(value))) {
          errors?.push({ field: field?.label, type: 'format', message: `${field?.label} must be a number` });
        }
        if (value && field?.type === 'email' && !/^[^@]+@[^@]+\.[^@]+$/?.test(value)) {
          errors?.push({ field: field?.label, type: 'format', message: `${field?.label} must be a valid email` });
        }
      });

      // Run entity-specific row validation if provided
      if (entityConfig?.rowValidateFn) {
        const mappedRecord = {};
        entityConfig?.fields?.forEach(field => {
          const csvCol = columnMapping?.[field?.key];
          if (csvCol) mappedRecord[field?.key] = row?.[csvCol] || '';
        });
        const extraErrors = entityConfig?.rowValidateFn(mappedRecord);
        if (extraErrors?.length) errors?.push(...extraErrors);
      }

      // Check exec_code uniqueness within the file itself (duplicate rows in CSV)
      if (entityConfig?.key === 'business_executives') {
        const execCodeField = columnMapping?.['exec_code'];
        const execCodeVal = execCodeField ? row?.[execCodeField]?.toString()?.trim() : '';
        if (execCodeVal) {
          const duplicateInFile = parsedData?.filter(r => {
            const v = execCodeField ? r?.[execCodeField]?.toString()?.trim() : '';
            return v === execCodeVal && r !== row;
          });
          if (duplicateInFile?.length > 0) {
            errors?.push({ field: 'Executive Code', type: 'duplicate', message: `Executive Code "${execCodeVal}" appears more than once in this file` });
          }
        }
      }

      return { row, errors, valid: errors?.length === 0 };
    });
    setValidationResults(results);
    setStep('preview');
  };

  const handleImport = async (skipInvalid = false) => {
    setImporting(true);
    const rowsToImport = skipInvalid
      ? validationResults?.filter(r => r?.valid)
      : validationResults;
    const validRows = rowsToImport?.filter(r => r?.valid);
    const invalidRows = validationResults?.filter(r => !r?.valid);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Pre-fetch validation data if validateFn exists
    let validationData = {};
    if (entityConfig?.validateFn) {
      try {
        validationData = await entityConfig?.validateFn();
      } catch (err) {
        console.error('Validation data fetch failed:', err);
      }
    }

    for (const { row } of validRows) {
      try {
        const record = {};
        entityConfig?.fields?.forEach(field => {
          const csvCol = columnMapping?.[field?.key];
          if (csvCol && row?.[csvCol] !== undefined) {
            if (field?.type === 'number') {
              record[field.key] = Number(row?.[csvCol]) || 0;
            } else if (field?.type === 'integer' || field?.type === 'boolean') {
              // Pass raw string value; insertFn handles type conversion
              record[field.key] = row?.[csvCol];
            } else {
              record[field.key] = row?.[csvCol];
            }
          }
        });
        const { error } = await entityConfig?.insertFn(
          record,
          validRows,
          validationData?.vsrExecCodes || validationData?.ssrExecCodes,
          validationData?.productCodes
        );
        if (error) { failCount++; errors?.push({ row: row?._rowIndex, error: error?.message }); }
        else { successCount++; }
      } catch (err) {
        failCount++;
        errors?.push({ row: row?._rowIndex, error: err?.message });
      }
    }

    setImportSummary({
      total: validRows?.length,
      success: successCount,
      failed: failCount,
      skipped: invalidRows?.length,
      errors
    });
    setImporting(false);
    setStep('summary');
    if (successCount > 0) onImportComplete?.();
  };

  const toggleRowExpand = (idx) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next?.has(idx) ? next?.delete(idx) : next?.add(idx);
      return next;
    });
  };

  const validCount = validationResults?.filter(r => r?.valid)?.length;
  const invalidCount = validationResults?.filter(r => !r?.valid)?.length;

  const stepIndex = STEPS?.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name={entityConfig?.icon} size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Import {entityConfig?.label}</h2>
              <p className="text-xs text-muted-foreground">CSV / Excel · Max 10MB</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {['Upload', 'Map Columns', 'Preview & Validate', 'Summary']?.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < stepIndex ? 'bg-primary text-primary-foreground' :
                    i === stepIndex ? 'bg-primary text-primary-foreground ring-2 ring-primary/30': 'bg-muted text-muted-foreground'
                  }`}>
                    {i < stepIndex ? <Icon name="Check" size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    i === stepIndex ? 'text-foreground' : 'text-muted-foreground'
                  }`}>{label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-px ${ i < stepIndex ? 'bg-primary' : 'bg-border'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e?.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef?.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e?.target?.files?.[0])} />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Upload" size={28} className="text-primary" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports CSV, XLSX, XLS · Maximum 10MB</p>
              </div>

              <div className="bg-muted/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">Required columns for {entityConfig?.label}:</p>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Icon name="Download" size={12} />
                    Download Template
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entityConfig?.fields?.map(f => (
                    <span key={f?.key} className={`px-2 py-0.5 rounded text-xs font-medium ${
                      f?.required ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {f?.label}{f?.required ? ' *' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Map CSV columns to database fields</p>
                  <p className="text-xs text-muted-foreground">{parsedData?.length} rows detected · {headers?.length} columns found</p>
                </div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Database Field</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Required</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Map to CSV Column</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entityConfig?.fields?.map(field => {
                      const mapped = columnMapping?.[field?.key];
                      const sample = mapped && parsedData?.[0] ? parsedData?.[0]?.[mapped] : '';
                      return (
                        <tr key={field?.key} className="hover:bg-accent/30">
                          <td className="px-4 py-2.5 font-medium text-foreground">{field?.label}</td>
                          <td className="px-4 py-2.5">
                            {field?.required
                              ? <span className="text-xs text-red-600 font-semibold">Required</span>
                              : <span className="text-xs text-muted-foreground">Optional</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={mapped || ''}
                              onChange={e => setColumnMapping(prev => ({ ...prev, [field?.key]: e?.target?.value || undefined }))}
                              className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">-- Not mapped --</option>
                              {headers?.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">{sample || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Validate */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Icon name="CheckCircle" size={14} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">{validCount} Valid</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Icon name="XCircle" size={14} className="text-red-600" />
                    <span className="text-xs font-semibold text-red-700 dark:text-red-400">{invalidCount} Invalid</span>
                  </div>
                )}
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-semibold w-12">Row</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-semibold w-16">Status</th>
                        {entityConfig?.fields?.filter(f => columnMapping?.[f?.key])?.map(f => (
                          <th key={f?.key} className="px-3 py-2 text-left text-muted-foreground font-semibold">{f?.label}</th>
                        ))}
                        <th className="px-3 py-2 text-left text-muted-foreground font-semibold">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {validationResults?.slice(0, 100)?.map(({ row, errors, valid }, idx) => (
                        <React.Fragment key={idx}>
                          <tr className={`${ valid ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}`}>
                            <td className="px-3 py-2 text-muted-foreground">{row?._rowIndex}</td>
                            <td className="px-3 py-2">
                              {valid
                                ? <span className="inline-flex items-center gap-1 text-green-600"><Icon name="Check" size={12} /> OK</span>
                                : <button onClick={() => toggleRowExpand(idx)} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                                    <Icon name="AlertCircle" size={12} /> {errors?.length} err
                                    <Icon name={expandedRows?.has(idx) ? 'ChevronUp' : 'ChevronDown'} size={10} />
                                  </button>
                              }
                            </td>
                            {entityConfig?.fields?.filter(f => columnMapping?.[f?.key])?.map(f => {
                              const val = row?.[columnMapping?.[f?.key]] || '';
                              const hasErr = errors?.some(e => e?.field === f?.label);
                              return (
                                <td key={f?.key} className={`px-3 py-2 max-w-[120px] truncate ${ hasErr ? 'text-red-600 font-medium' : 'text-foreground'}`}>
                                  {val || <span className="text-muted-foreground italic">empty</span>}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-muted-foreground">{errors?.length === 0 ? '—' : ''}</td>
                          </tr>
                          {!valid && expandedRows?.has(idx) && (
                            <tr className="bg-red-50 dark:bg-red-900/20">
                              <td colSpan={entityConfig?.fields?.filter(f => columnMapping?.[f?.key])?.length + 3} className="px-6 py-2">
                                <ul className="space-y-0.5">
                                  {errors?.map((err, ei) => (
                                    <li key={ei} className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                      <Icon name="AlertTriangle" size={10} />
                                      <span className="font-medium">{err?.field}:</span> {err?.message}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {validationResults?.length > 100 && (
                <p className="text-xs text-muted-foreground text-center">Showing first 100 rows of {validationResults?.length}</p>
              )}
            </div>
          )}

          {/* STEP 4: Summary */}
          {step === 'summary' && importSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Processed', value: importSummary?.total, color: 'text-foreground', bg: 'bg-muted/50' },
                  { label: 'Imported', value: importSummary?.success, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                  { label: 'Failed', value: importSummary?.failed, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Skipped', value: importSummary?.skipped, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                ]?.map(stat => (
                  <div key={stat?.label} className={`${stat?.bg} rounded-xl p-4 text-center`}>
                    <p className={`text-2xl font-bold ${stat?.color}`}>{stat?.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat?.label}</p>
                  </div>
                ))}
              </div>
              {importSummary?.success > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    Successfully imported {importSummary?.success} {entityConfig?.label?.toLowerCase()} records.
                  </p>
                </div>
              )}
              {importSummary?.errors?.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/50 flex items-center gap-2">
                    <Icon name="AlertCircle" size={14} className="text-red-500" />
                    <span className="text-xs font-semibold text-foreground">Error Details ({importSummary?.errors?.length})</span>
                  </div>
                  <div className="divide-y divide-border max-h-40 overflow-y-auto">
                    {importSummary?.errors?.map((err, i) => (
                      <div key={i} className="px-4 py-2 flex items-start gap-3">
                        <span className="text-xs text-muted-foreground w-12">Row {err?.row}</span>
                        <span className="text-xs text-red-600">{err?.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0 gap-3">
          <div>
            {step === 'mapping' && (
              <button onClick={() => setStep('upload')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="ArrowLeft" size={14} /> Back
              </button>
            )}
            {step === 'preview' && (
              <button onClick={() => setStep('mapping')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="ArrowLeft" size={14} /> Fix Errors
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step !== 'summary' && (
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Cancel
              </button>
            )}
            {step === 'mapping' && (
              <button
                onClick={validateData}
                disabled={!entityConfig?.fields?.some(f => f?.required && columnMapping?.[f?.key])}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Validate Data
              </button>
            )}
            {step === 'preview' && (
              <>
                {invalidCount > 0 && (
                  <button
                    onClick={() => handleImport(true)}
                    disabled={importing || validCount === 0}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    Skip Invalid ({invalidCount})
                  </button>
                )}
                <button
                  onClick={() => handleImport(false)}
                  disabled={importing || validCount === 0}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && <Icon name="Loader" size={14} className="animate-spin" />}
                  Import {validCount} Valid Rows
                </button>
              </>
            )}
            {step === 'summary' && (
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
