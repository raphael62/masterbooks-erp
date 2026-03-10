import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const LineItemManager = ({ lineItems, onLineItemsUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    product: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: 0.125,
    discount: 0
  });
  const [barcodeScanning, setBarcodeScanning] = useState(false);

  const mockProducts = [
    { id: '1', name: 'Premium Widget A', price: 150.00, barcode: '1234567890' },
    { id: '2', name: 'Standard Widget B', price: 80.00, barcode: '0987654321' },
    { id: '3', name: 'Deluxe Widget C', price: 220.00, barcode: '1122334455' },
    { id: '4', name: 'Basic Widget D', price: 45.00, barcode: '5544332211' }
  ];

  const handleAddItem = () => {
    if (!newItem?.product || !newItem?.quantity || !newItem?.unitPrice) return;

    const item = {
      id: Date.now()?.toString(),
      ...newItem
    };

    onLineItemsUpdate([...lineItems, item]);
    setNewItem({
      product: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 0.125,
      discount: 0
    });
    setShowAddForm(false);
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = lineItems?.filter(item => item?.id !== itemId);
    onLineItemsUpdate(updatedItems);
  };

  const handleUpdateItem = (itemId, field, value) => {
    const updatedItems = lineItems?.map(item =>
      item?.id === itemId ? { ...item, [field]: value } : item
    );
    onLineItemsUpdate(updatedItems);
  };

  const handleBarcodeSearch = (barcode) => {
    const product = mockProducts?.find(p => p?.barcode === barcode);
    if (product) {
      setNewItem({
        ...newItem,
        product: product?.name,
        unitPrice: product?.price
      });
    }
    setBarcodeScanning(false);
  };

  const calculateLineTotal = (item) => {
    const lineTotal = item?.quantity * item?.unitPrice;
    const discountAmount = (lineTotal * (item?.discount || 0)) / 100;
    const netAmount = lineTotal - discountAmount;
    const vatAmount = netAmount * (item?.vatRate || 0);
    return netAmount + vatAmount;
  };

  return (
    <div className="space-y-4">
      {/* Existing Line Items */}
      {lineItems?.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Product</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Discount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">VAT</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineItems?.map((item) => (
                  <tr key={item?.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <Input
                          value={item?.product}
                          onChange={(e) => handleUpdateItem(item?.id, 'product', e?.target?.value)}
                          className="font-medium text-sm mb-1"
                          placeholder="Product name"
                        />
                        <Input
                          value={item?.description || ''}
                          onChange={(e) => handleUpdateItem(item?.id, 'description', e?.target?.value)}
                          className="text-sm text-muted-foreground"
                          placeholder="Description (optional)"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        value={item?.quantity}
                        onChange={(e) => handleUpdateItem(item?.id, 'quantity', parseFloat(e?.target?.value) || 0)}
                        className="w-20 text-right"
                        min="1"
                        step="1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        value={item?.unitPrice}
                        onChange={(e) => handleUpdateItem(item?.id, 'unitPrice', parseFloat(e?.target?.value) || 0)}
                        className="w-24 text-right"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        value={item?.discount || 0}
                        onChange={(e) => handleUpdateItem(item?.id, 'discount', parseFloat(e?.target?.value) || 0)}
                        className="w-20 text-right"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Select
                        value={(item?.vatRate * 100)?.toString()}
                        onValueChange={(value) => handleUpdateItem(item?.id, 'vatRate', parseFloat(value) / 100)}
                        options={[
                          { value: '0', label: '0%' },
                          { value: '12.5', label: '12.5%' },
                          { value: '15', label: '15%' }
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      GHS {calculateLineTotal(item)?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item?.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Add New Item Form */}
      {showAddForm && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-foreground">Add New Item</h4>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBarcodeScanning(true)}
                className="flex items-center space-x-2"
              >
                <Icon name="Scan" size={16} />
                <span>Scan Barcode</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Input
                label="Product Name"
                value={newItem?.product}
                onChange={(e) => setNewItem({ ...newItem, product: e?.target?.value })}
                placeholder="Enter product name"
              />
              <Input
                label="Description (Optional)"
                value={newItem?.description}
                onChange={(e) => setNewItem({ ...newItem, description: e?.target?.value })}
                placeholder="Product description"
                className="mt-2"
              />
            </div>
            <div>
              <Input
                label="Quantity"
                type="number"
                value={newItem?.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e?.target?.value) || 1 })}
                min="1"
                step="1"
              />
            </div>
            <div>
              <Input
                label="Unit Price (GHS)"
                type="number"
                value={newItem?.unitPrice}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e?.target?.value) || 0 })}
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Input
                label="Discount (%)"
                type="number"
                value={newItem?.discount}
                onChange={(e) => setNewItem({ ...newItem, discount: parseFloat(e?.target?.value) || 0 })}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Select
                label="VAT Rate"
                value={(newItem?.vatRate * 100)?.toString()}
                onValueChange={(value) => setNewItem({ ...newItem, vatRate: parseFloat(value) / 100 })}
                options={[
                  { value: '0', label: 'No VAT (0%)' },
                  { value: '12.5', label: 'Standard VAT (12.5%)' },
                  { value: '15', label: 'Higher VAT (15%)' }
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!newItem?.product || !newItem?.quantity || !newItem?.unitPrice}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      )}
      {/* Add Item Button */}
      {!showAddForm && (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-border hover:border-primary"
        >
          <Icon name="Plus" size={20} />
          <span>Add Line Item</span>
        </Button>
      )}
      {/* Barcode Scanner Modal */}
      {barcodeScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Scan Barcode</h3>
                <button
                  onClick={() => setBarcodeScanning(false)}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="text-center py-8">
                <Icon name="Scan" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Point your camera at the barcode to scan
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Or enter barcode manually:</p>
                  <Input
                    placeholder="Enter barcode"
                    onKeyDown={(e) => {
                      if (e?.key === 'Enter' && e?.target?.value) {
                        handleBarcodeSearch(e?.target?.value);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Empty State */}
      {lineItems?.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <Icon name="Package" size={48} className="mx-auto mb-4 opacity-50" />
          <p>No items added yet</p>
          <p className="text-sm">Click "Add Line Item" to get started</p>
        </div>
      )}
    </div>
  );
};

export default LineItemManager;