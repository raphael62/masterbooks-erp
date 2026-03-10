import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ImportSidebar from './components/ImportSidebar';
import ImportEntityView from './components/ImportEntityView';
import { ENTITY_CONFIGS } from './entityConfigs';

const ImportData = () => {
  const [activeEntity, setActiveEntity] = useState('products');
  const [stats, setStats] = useState({});

  const entityConfig = ENTITY_CONFIGS?.find((c) => c?.key === activeEntity);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const results = await Promise.all(
          ENTITY_CONFIGS?.map(async (cfg) => {
            const { count } = await supabase?.from(cfg?.table)?.select('*', { count: 'exact', head: true });
            return { key: cfg?.key, totalRecords: count || 0 };
          }) || []
        );
        const map = {};
        results?.forEach((r) => { map[r?.key] = { totalRecords: r?.totalRecords }; });
        setStats(map);
      } catch (err) {
        console.error('Failed to fetch import stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleImportComplete = () => {
    if (entityConfig?.table) {
      setStats((prev) => ({
        ...prev,
        [activeEntity]: { ...prev?.[activeEntity], totalRecords: (prev?.[activeEntity]?.totalRecords || 0) + 1 },
      }));
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <BreadcrumbNavigation />
        </div>
        <div className="flex-1 min-h-0 flex overflow-hidden px-6 pb-6">
          <ImportSidebar activeKey={activeEntity} onSelect={setActiveEntity} />
          <div className="flex-1 min-w-0 overflow-auto pl-6">
            <ImportEntityView
              entityKey={activeEntity}
              entityConfig={entityConfig}
              onImportComplete={handleImportComplete}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ImportData;
