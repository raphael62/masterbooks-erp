import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const StockAdjustmentModal = ({ isOpen, onClose, selectedItem, selectedLocation }) => {
  const [formData, setFormData] = useState({
    itemCode: selectedItem?.itemCode || '',
    description: selectedItem?.description || '',
    location: selectedLocation !== 'all' ? selectedLocation : '',
    systemQuantity: selectedItem?.currentStock || 0,
    actualQuantity: selectedItem?.currentStock || 0,
    reasonCode: '',
    notes: '',
    requiresApproval: true
  });

  const [isScanning, setIsScanning] = useState(false);
  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchLocations = async () => {
        const { data, error } = await supabase?.from('locations')?.select('id, name')?.eq('is_active', true)?.order('name');
        if (!error && data) {
          setLocations(data);
        }
      };
      fetchLocations();
    }
  }, [isOpen]);

  const locationOptions = [
    { value: '', label: 'Select Location' },
    ...locations?.map(l => ({ value: l?.id, label: l?.name }))
  ];

  const reasonCodeOptions = [
    { value: 'damaged', label: 'Damaged Goods' },
    { value: 'expired', label: 'Expired Products' },
    { value: 'theft', label: 'Theft/Shrinkage' },
    { value: 'count_variance', label: 'Count Variance' },
    { value: 'system_error', label: 'System Error' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleBarcodeScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 2000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.itemCode?.trim()) {
      newErrors.itemCode = 'Item code is required';
    }
    
    if (!formData?.reasonCode) {
      newErrors.reasonCode = 'Reason code is required';
    }
    
    if (formData?.actualQuantity < 0) {
      newErrors.actualQuantity = 'Actual quantity cannot be negative';
    }
    
    if (formData?.reasonCode === 'other' && !formData?.notes?.trim()) {
      newErrors.notes = 'Notes are required when reason is "Other"';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const adjustmentData = {
      ...formData,
      adjustmentQuantity: formData?.actualQuantity - formData?.systemQuantity,
      totalValue: (formData?.actualQuantity - formData?.systemQuantity) * (selectedItem?.unitPrice || 0),
    };
    
    console.log('Stock adjustment submitted:', adjustmentData);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stock Adjustment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Record a stock count variance or correction</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Item Code"
                value={formData?.itemCode}
                onChange={(e) => handleInputChange('itemCode', e?.target?.value)}
                error={errors?.itemCode}
                placeholder="Enter item code"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBarcodeScanner}
                disabled={isScanning}
                className="mb-0"
              >
                <Icon name={isScanning ? 'Loader' : 'Scan'} size={16} className={isScanning ? 'animate-spin' : ''} />
                {isScanning ? 'Scanning...' : 'Scan'}
              </Button>
            </div>
          </div>

          <Input
            label="Description"
            value={formData?.description}
            onChange={(e) => handleInputChange('description', e?.target?.value)}
            placeholder="Item description"
            disabled
          />

          <Select
            label="Location"
            options={locationOptions}
            value={formData?.location}
            onChange={(value) => handleInputChange('location', value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="System Quantity"
              type="number"
              value={formData?.systemQuantity}
              disabled
            />
            <Input
              label="Actual Quantity"
              type="number"
              value={formData?.actualQuantity}
              onChange={(e) => handleInputChange('actualQuantity', parseInt(e?.target?.value) || 0)}
              error={errors?.actualQuantity}
            />
          </div>

          <Select
            label="Reason Code"
            options={reasonCodeOptions}
            value={formData?.reasonCode}
            onChange={(value) => handleInputChange('reasonCode', value)}
            error={errors?.reasonCode}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={formData?.notes}
              onChange={(e) => handleInputChange('notes', e?.target?.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors?.notes && <p className="text-xs text-red-500 mt-1">{errors?.notes}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Submit Adjustment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;