import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import LocationTabs from './components/LocationTabs';
import StockLevelsSpreadsheet from './components/StockLevelsSpreadsheet';
import StockSummaryPanel from './components/StockSummaryPanel';

// Mock locations
const MOCK_LOCATIONS = [
  { id: 'loc-1', location_code: 'WH-MAIN', location_name: 'Main Warehouse', location_type: 'warehouse', is_active: true },
  { id: 'loc-2', location_code: 'BR-ACCRA', location_name: 'Accra Branch', location_type: 'branch', is_active: true },
  { id: 'loc-3', location_code: 'BR-KUMASI', location_name: 'Kumasi Branch', location_type: 'branch', is_active: true },
  { id: 'loc-4', location_code: 'WH-TEMA', location_name: 'Tema Warehouse', location_type: 'warehouse', is_active: true },
];

// Mock stock data generator
const generateMockStockData = (locations) => {
  const products = [
    { id: 'p1', product_code: 'P001', product_name: 'Malta Guinness 33cl', category: 'Beverages', pack_unit: 24, cost_price: 85, reorder_level: 50 },
    { id: 'p2', product_code: 'P002', product_name: 'Coca-Cola 50cl PET', category: 'Beverages', pack_unit: 12, cost_price: 72, reorder_level: 100 },
    { id: 'p3', product_code: 'P003', product_name: 'Fanta Orange 33cl', category: 'Beverages', pack_unit: 24, cost_price: 68, reorder_level: 80 },
    { id: 'p4', product_code: 'P004', product_name: 'Indomie Chicken 70g', category: 'Snacks', pack_unit: 40, cost_price: 45, reorder_level: 200 },
    { id: 'p5', product_code: 'P005', product_name: 'Peak Milk 170g Tin', category: 'Dairy', pack_unit: 12, cost_price: 120, reorder_level: 60 },
    { id: 'p6', product_code: 'P006', product_name: 'Milo 400g Tin', category: 'Beverages', pack_unit: 12, cost_price: 95, reorder_level: 40 },
    { id: 'p7', product_code: 'P007', product_name: 'Omo Washing Powder 1kg', category: 'Household', pack_unit: 10, cost_price: 55, reorder_level: 30 },
    { id: 'p8', product_code: 'P008', product_name: 'Cowbell Sachet Milk', category: 'Dairy', pack_unit: 50, cost_price: 38, reorder_level: 150 },
    { id: 'p9', product_code: 'P009', product_name: 'Sprite 50cl PET', category: 'Beverages', pack_unit: 12, cost_price: 70, reorder_level: 80 },
    { id: 'p10', product_code: 'P010', product_name: 'Pringles Original 165g', category: 'Snacks', pack_unit: 6, cost_price: 180, reorder_level: 20 },
    { id: 'p11', product_code: 'P011', product_name: 'Nestle Pure Life 1.5L', category: 'Beverages', pack_unit: 12, cost_price: 30, reorder_level: 120 },
    { id: 'p12', product_code: 'P012', product_name: 'Maggi Chicken Cubes', category: 'Condiments & Sauces', pack_unit: 24, cost_price: 25, reorder_level: 100 },
  ];

  const stockValues = [
    [320, 180, 95, 210],
    [540, 0, 120, 300],
    [210, 85, 60, 140],
    [1200, 400, 250, 600],
    [180, 45, 30, 90],
    [95, 20, 15, 40],
    [140, 60, 35, 80],
    [620, 200, 150, 350],
    [380, 120, 80, 200],
    [45, 10, 5, 20],
    [800, 300, 200, 450],
    [560, 180, 120, 280],
  ];

  return products?.map((p, i) => {
    const locStocks = {};
    let total = 0;
    locations?.forEach((loc, j) => {
      const s = stockValues?.[i]?.[j] || 0;
      locStocks[loc?.id] = s;
      total += s;
    });
    let status = 'ok';
    if (total <= 0) status = 'out';
    else if (total <= p?.reorder_level) status = 'low';
    else if (total > p?.reorder_level * 3) status = 'overstock';
    return { ...p, location_stocks: locStocks, total_stock: total, status };
  });
};

const StockLevelsByLocation = () => {
  const [locations, setLocations] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [activeLocation, setActiveLocation] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase?.from('locations')?.select('*')?.eq('is_active', true)?.order('location_name');
      if (error) throw error;
      return data?.length > 0 ? data : MOCK_LOCATIONS;
    } catch {
      return MOCK_LOCATIONS;
    }
  }, []);

  const fetchStockData = useCallback(async (locs) => {
    setIsLoading(true);
    try {
      const { data: products, error: prodError } = await supabase
        ?.from('products')
        ?.select('id, product_code, product_name, category, pack_unit, cost_price, reorder_level')
        ?.eq('status', 'active')
        ?.order('product_name');

      if (prodError) throw prodError;

      if (products?.length > 0) {
        const { data: stockLevels, error: stockError } = await supabase
          ?.from('stock_levels_by_location')
          ?.select('product_id, location_id, stock_on_hand, reorder_level');

        if (stockError) throw stockError;

        const enriched = products?.map(p => {
          const locStocks = {};
          let total = 0;
          locs?.forEach(loc => {
            const entry = stockLevels?.find(s => s?.product_id === p?.id && s?.location_id === loc?.id);
            const s = entry?.stock_on_hand || 0;
            locStocks[loc?.id] = s;
            total += s;
          });
          const reorder = p?.reorder_level || 0;
          let status = 'ok';
          if (total <= 0) status = 'out';
          else if (total <= reorder) status = 'low';
          else if (total > reorder * 3) status = 'overstock';
          return { ...p, location_stocks: locStocks, total_stock: total, status };
        });
        setStockData(enriched);
      } else {
        setStockData(generateMockStockData(locs));
      }
    } catch {
      setStockData(generateMockStockData(locs));
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  const loadAll = useCallback(async () => {
    const locs = await fetchLocations();
    setLocations(locs);
    await fetchStockData(locs);
  }, [fetchLocations, fetchStockData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeLocationName = activeLocation === 'all' ?'All Locations'
    : locations?.find(l => l?.id === activeLocation)?.location_name || 'All Locations';

  // Filter stock data for active location summary
  const summaryData = activeLocation === 'all'
    ? stockData
    : stockData?.map(r => ({
        ...r,
        total_stock: r?.location_stocks?.[activeLocation] || 0,
        status: (() => {
          const s = r?.location_stocks?.[activeLocation] || 0;
          if (s <= 0) return 'out';
          if (s <= r?.reorder_level) return 'low';
          if (s > r?.reorder_level * 3) return 'overstock';
          return 'ok';
        })(),
      }));

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200 flex-shrink-0">
          <BreadcrumbNavigation />
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventory</h1>
              <p className="text-xs text-gray-500">Multi-location stock visibility and management</p>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Icon name="Clock" size={12} />
                Last updated: {lastUpdated?.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Module Tab Navigation */}
          <div className="flex items-end gap-0 mt-3 -mb-px">
            <a href="/inventory-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Overview</a>
            <a href="/product-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Products</a>
            <span
              className="px-4 py-2 text-xs font-semibold border border-b-0 rounded-t mr-0.5"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }}
            >
              Stock by Location
            </span>
            <a href="/stock-movements" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white mr-0.5">Stock Movements</a>
            <a href="/returnable-glass-management" className="px-4 py-2 text-xs font-medium border border-b-0 border-gray-300 rounded-t text-gray-600 hover:bg-gray-50 bg-white">Returnable Glass</a>
          </div>
        </div>

        {/* Location Tabs */}
        <div className="px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
          <LocationTabs
            locations={locations}
            activeLocation={activeLocation}
            onLocationChange={setActiveLocation}
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <StockLevelsSpreadsheet
              stockData={stockData}
              locations={locations}
              activeLocation={activeLocation}
              isLoading={isLoading}
              onRefresh={loadAll}
            />
          </div>
          <StockSummaryPanel
            stockData={summaryData}
            activeLocationName={activeLocationName}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default StockLevelsByLocation;
