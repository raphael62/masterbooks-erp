import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const DEFAULT_CATEGORIES = [
  'Beverages', 'Dairy', 'Snacks', 'Grains & Cereals', 'Canned Goods',
  'Frozen Foods', 'Bakery', 'Condiments & Sauces', 'Personal Care',
  'Household', 'Tobacco', 'Confectionery', 'Raw Materials', 'Packaging', 'Other',
];

const DEFAULT_UNITS = [
  'Pieces', 'Cases', 'Bottles', 'Cartons', 'Bags', 'Boxes',
  'Litres', 'Kilograms', 'Grams', 'Dozens', 'Crates', 'Pallets', 'Units',
];

const EMPTIES_TYPES = ['None', 'Plastic Bottle', 'Glass Bottle', 'Plastic Crate', 'Returnable Keg'];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const INITIAL_FORM = {
  product_code: '',
  product_name: '',
  description: '',
  category: '',
  unit_of_measure: 'Pieces',
  pack_unit: '',
  reorder_level: '',
  reorder_quantity: '',
  vendor_id: '',
  barcode: '',
  sku: '',
  status: 'active',
  empties_type: 'None',
  is_taxable: false,
  is_returnable: false,
  plastic_cost: '',
  bottle_cost: '',
};

const NewProductModal = ({ isOpen, onClose, onSuccess, editItem }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [emptiesOptions, setEmptiesOptions] = useState(EMPTIES_TYPES);
  const firstInputRef = useRef(null);

  const isEditMode = !!editItem?.id;

  useEffect(() => {
    if (!isOpen) return;
    fetchDropdowns();
    if (editItem?.id) {
      setForm({
        product_code: editItem?.product_code || '',
        product_name: editItem?.product_name || '',
        description: editItem?.description || '',
        category: editItem?.category || '',
        unit_of_measure: editItem?.unitof_measure || 'Pieces',
        pack_unit: editItem?.pack_unit !== null && editItem?.pack_unit !== undefined ? String(editItem?.pack_unit) : '',
        reorder_level: editItem?.reorder_level !== null && editItem?.reorder_level !== undefined ? String(editItem?.reorder_level) : '',
        reorder_quantity: editItem?.reorder_quantity !== null && editItem?.reorder_quantity !== undefined ? String(editItem?.reorder_quantity) : '',
        vendor_id: editItem?.vendor_id || '',
        barcode: editItem?.barcode || '',
        sku: editItem?.sku || '',
        status: editItem?.status || 'active',
        empties_type: editItem?.empties_type || 'None',
        is_taxable: editItem?.is_taxable || false,
        is_returnable: editItem?.is_returnable || false,
        plastic_cost: editItem?.plastic_cost !== null && editItem?.plastic_cost !== undefined ? String(editItem?.plastic_cost) : '',
        bottle_cost: editItem?.bottle_cost !== null && editItem?.bottle_cost !== undefined ? String(editItem?.bottle_cost) : '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setSaveError('');
    setTimeout(() => firstInputRef?.current?.focus(), 100);
  }, [isOpen, editItem]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e?.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const fetchDropdowns = async () => {
    try {
      const [vendorRes, categoriesRes, unitsRes, emptiesRes] = await Promise.all([
        supabase?.from('vendors')?.select('id, vendor_name')?.eq('status', 'active')?.order('vendor_name', { ascending: true }),
        supabase?.from('product_categories')?.select('category_name')?.eq('status', 'active')?.order('category_name'),
        supabase?.from('units_of_measure')?.select('uom_code, uom_name')?.eq('status', 'active')?.order('uom_code'),
        supabase?.from('empties_types')?.select('empties_name')?.eq('status', 'active')?.order('empties_name'),
      ]);

      if (!vendorRes?.error && vendorRes?.data?.length > 0) {
        setVendors(vendorRes?.data);
      }

      if (!categoriesRes?.error && categoriesRes?.data?.length > 0) {
        setCategories(categoriesRes?.data?.map(c => c?.category_name));
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      if (!unitsRes?.error && unitsRes?.data?.length > 0) {
        setUnits(unitsRes?.data?.map(u => u?.uom_code));
      } else {
        setUnits(DEFAULT_UNITS);
      }

      if (!emptiesRes?.error && emptiesRes?.data?.length > 0) {
        setEmptiesOptions(['None', ...emptiesRes?.data?.map(e => e?.empties_name)]);
      } else {
        setEmptiesOptions(EMPTIES_TYPES);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setSaveError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form?.product_code?.trim()) newErrors.product_code = 'Product Code is required';
    if (!form?.product_name?.trim()) newErrors.product_name = 'Product Name is required';
    if (!form?.category) newErrors.category = 'Category is required';
    if (!form?.unit_of_measure) newErrors.unit_of_measure = 'Unit of Measure is required';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        product_code: form?.product_code?.trim(),
        product_name: form?.product_name?.trim(),
        description: form?.description?.trim() || null,
        category: form?.category || null,
        unit_of_measure: form?.unit_of_measure,
        pack_unit: form?.pack_unit !== '' ? parseInt(form?.pack_unit) : null,
        reorder_level: form?.reorder_level !== '' ? parseInt(form?.reorder_level) : 0,
        reorder_quantity: form?.reorder_quantity !== '' ? parseInt(form?.reorder_quantity) : 0,
        vendor_id: form?.vendor_id || null,
        barcode: form?.barcode?.trim() || null,
        sku: form?.sku?.trim() || null,
        status: form?.status,
        empties_type: form?.empties_type,
        is_taxable: form?.is_taxable,
        is_returnable: form?.is_returnable,
        plastic_cost: form?.plastic_cost !== '' ? parseFloat(form?.plastic_cost) : 0,
        bottle_cost: form?.bottle_cost !== '' ? parseFloat(form?.bottle_cost) : 0,
      };

      let data, error;
      if (isEditMode) {
        const result = await supabase?.from('products')?.update(payload)?.eq('id', editItem?.id)?.select()?.single();
        data = result?.data;
        error = result?.error;
      } else {
        const result = await supabase?.from('products')?.insert(payload)?.select()?.single();
        data = result?.data;
        error = result?.error;
      }
      if (error) throw error;
      onSuccess?.(data, isEditMode);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field) =>
    `w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary ${
      errors?.[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  const selectCls = (field) =>
    `w-full h-7 px-2 text-xs border rounded focus:outline-none focus:border-primary bg-white ${
      errors?.[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-lg">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-white" />
            <h2 className="text-sm font-semibold text-white">{isEditMode ? 'Edit Product' : 'New Product'}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/70 transition-colors p-0.5 rounded"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {saveError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">

            {/* Product Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Product Code <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form?.product_code}
                onChange={e => handleChange('product_code', e?.target?.value)}
                placeholder="e.g. P001"
                className={inputCls('product_code')}
              />
              {errors?.product_code && <p className="text-xs text-red-500 mt-0.5">{errors?.product_code}</p>}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form?.product_name}
                onChange={e => handleChange('product_name', e?.target?.value)}
                placeholder="Enter product name"
                className={inputCls('product_name')}
              />
              {errors?.product_name && <p className="text-xs text-red-500 mt-0.5">{errors?.product_name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form?.category}
                onChange={e => handleChange('category', e?.target?.value)}
                className={selectCls('category')}
              >
                <option value="">Select Category</option>
                {categories?.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors?.category && <p className="text-xs text-red-500 mt-0.5">{errors?.category}</p>}
            </div>

            {/* Unit of Measure */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <select
                value={form?.unit_of_measure}
                onChange={e => handleChange('unit_of_measure', e?.target?.value)}
                className={selectCls('unit_of_measure')}
              >
                <option value="">Select Unit</option>
                {units?.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              {errors?.unit_of_measure && <p className="text-xs text-red-500 mt-0.5">{errors?.unit_of_measure}</p>}
            </div>

            {/* Pack Unit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Pack Unit</label>
              <input
                type="number"
                min="1"
                value={form?.pack_unit}
                onChange={e => handleChange('pack_unit', e?.target?.value)}
                placeholder="e.g. 24"
                className={inputCls('pack_unit')}
              />
            </div>

            {/* Empties Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Empties Type</label>
              <select
                value={form?.empties_type}
                onChange={e => handleChange('empties_type', e?.target?.value)}
                className={selectCls('empties_type')}
              >
                {emptiesOptions?.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>

            {/* Plastic Cost */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Plastic Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form?.plastic_cost}
                onChange={e => handleChange('plastic_cost', e?.target?.value)}
                placeholder="0.00"
                className={inputCls('plastic_cost')}
              />
            </div>

            {/* Bottle Cost */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Bottle Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form?.bottle_cost}
                onChange={e => handleChange('bottle_cost', e?.target?.value)}
                placeholder="0.00"
                className={inputCls('bottle_cost')}
              />
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Reorder Level</label>
              <input
                type="number"
                min="0"
                value={form?.reorder_level}
                onChange={e => handleChange('reorder_level', e?.target?.value)}
                placeholder="Min stock level"
                className={inputCls('reorder_level')}
              />
            </div>

            {/* Reorder Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Reorder Quantity</label>
              <input
                type="number"
                min="0"
                value={form?.reorder_quantity}
                onChange={e => handleChange('reorder_quantity', e?.target?.value)}
                placeholder="Qty to reorder"
                className={inputCls('reorder_quantity')}
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Barcode</label>
              <input
                type="text"
                value={form?.barcode}
                onChange={e => handleChange('barcode', e?.target?.value)}
                placeholder="Scan or enter barcode"
                className={inputCls('barcode')}
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">SKU</label>
              <input
                type="text"
                value={form?.sku}
                onChange={e => handleChange('sku', e?.target?.value)}
                placeholder="Stock Keeping Unit"
                className={inputCls('sku')}
              />
            </div>

            {/* Vendor / Supplier */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Vendor / Supplier</label>
              <select
                value={form?.vendor_id}
                onChange={e => handleChange('vendor_id', e?.target?.value)}
                className={selectCls('vendor_id')}
              >
                <option value="">Select Vendor</option>
                {vendors?.map(v => (
                  <option key={v?.id} value={v?.id}>{v?.vendor_name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={form?.status}
                onChange={e => handleChange('status', e?.target?.value)}
                className={selectCls('status')}
              >
                {STATUS_OPTIONS?.map(opt => (
                  <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
              </select>
            </div>

            {/* Description - full width */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
              <textarea
                value={form?.description}
                onChange={e => handleChange('description', e?.target?.value)}
                placeholder="Product description"
                rows={2}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Flags - full width */}
            <div className="col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form?.is_taxable}
                  onChange={e => handleChange('is_taxable', e?.target?.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-700">Taxable</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form?.is_returnable}
                  onChange={e => handleChange('is_returnable', e?.target?.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-700">Returnable</span>
              </label>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-4 text-xs font-semibold bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                {isEditMode ? 'Update' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProductModal;
