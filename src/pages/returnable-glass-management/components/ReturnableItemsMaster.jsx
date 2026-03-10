import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const MOCK_ITEMS = [
  { id: '1', item_code: 'RG001', item_name: 'Standard Bottle 33cl', item_type: 'Bottle', deposit_amount: 0.50, stock_level: 2400, unit: 'Pcs' },
  { id: '2', item_code: 'RG002', item_name: 'Standard Bottle 50cl', item_type: 'Bottle', deposit_amount: 0.75, stock_level: 1800, unit: 'Pcs' },
  { id: '3', item_code: 'RG003', item_name: 'Large Bottle 1L', item_type: 'Bottle', deposit_amount: 1.20, stock_level: 960, unit: 'Pcs' },
  { id: '4', item_code: 'RG004', item_name: 'Plastic Crate 24-slot', item_type: 'Crate', deposit_amount: 8.00, stock_level: 320, unit: 'Pcs' },
  { id: '5', item_code: 'RG005', item_name: 'Plastic Crate 12-slot', item_type: 'Crate', deposit_amount: 5.00, stock_level: 480, unit: 'Pcs' },
  { id: '6', item_code: 'RG006', item_name: 'Metal Keg 30L', item_type: 'Keg', deposit_amount: 45.00, stock_level: 85, unit: 'Pcs' },
  { id: '7', item_code: 'RG007', item_name: 'Metal Keg 50L', item_type: 'Keg', deposit_amount: 65.00, stock_level: 42, unit: 'Pcs' },
  { id: '8', item_code: 'RG008', item_name: 'Wooden Crate', item_type: 'Crate', deposit_amount: 12.00, stock_level: 150, unit: 'Pcs' },
];

const TYPE_COLORS = {
  Bottle: 'bg-blue-100 text-blue-700',
  Crate: 'bg-amber-100 text-amber-700',
  Keg: 'bg-purple-100 text-purple-700',
};

const ReturnableItemsMaster = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase?.from('returnable_items')?.select('*')?.order('item_name');
        if (error) throw error;
        setItems(data?.length > 0 ? data : MOCK_ITEMS);
      } catch {
        setItems(MOCK_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const totalDeposit = items?.reduce((sum, i) => sum + parseFloat(i?.deposit_amount || 0), 0);
  const totalStock = items?.reduce((sum, i) => sum + parseInt(i?.stock_level || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-700">Returnable Items Master</h3>
        <p className="text-xs text-gray-500 mt-0.5">Deposit amounts &amp; stock levels</p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-left font-medium text-gray-700 whitespace-nowrap">#</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left font-medium text-gray-700 whitespace-nowrap">Item Name</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left font-medium text-gray-700 whitespace-nowrap">Type</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right font-medium text-gray-700 whitespace-nowrap">Deposit (GHS)</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right font-medium text-gray-700 whitespace-nowrap">Stock</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item, idx) => (
                <tr
                  key={item?.id}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#F9FAFB' }}
                >
                  <td className="border border-gray-200 px-2 py-1 text-gray-400">{idx + 1}</td>
                  <td className="border border-gray-200 px-2 py-1 text-gray-800 font-medium">{item?.item_name}</td>
                  <td className="border border-gray-200 px-2 py-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLORS?.[item?.item_type] || 'bg-gray-100 text-gray-600'}`}>
                      {item?.item_type}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right font-sans tabular-nums text-gray-700">
                    {parseFloat(item?.deposit_amount || 0)?.toFixed(2)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right font-sans tabular-nums">
                    <span className={parseInt(item?.stock_level) < 100 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                      {parseInt(item?.stock_level || 0)?.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-xs font-bold text-gray-700">Totals</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold font-sans tabular-nums text-gray-800">
                  {totalDeposit?.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-bold font-sans tabular-nums text-gray-800">
                  {totalStock?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Low Stock Alert */}
      {items?.some(i => parseInt(i?.stock_level) < 100) && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-600 font-medium">⚠ Low stock alert on some items</p>
        </div>
      )}
    </div>
  );
};

export default ReturnableItemsMaster;