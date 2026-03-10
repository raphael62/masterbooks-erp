import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DB_NAME = 'masterbooks_offline';
const DB_VERSION = 1;
const COMPANIES_STORE = 'companies';
const LOCATIONS_STORE = 'locations';
const CONTEXT_STORE = 'context';

// IndexedDB helpers
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(COMPANIES_STORE)) {
        db.createObjectStore(COMPANIES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LOCATIONS_STORE)) {
        db.createObjectStore(LOCATIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CONTEXT_STORE)) {
        db.createObjectStore(CONTEXT_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const idbGet = async (storeName, key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
};

const idbGetAll = async (storeName) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch { return []; }
};

const idbPutAll = async (storeName, items) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items?.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* silent fail */ }
};

const idbPut = async (storeName, item) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* silent fail */ }
};

const CompanyLocationContext = createContext({});

export const useCompanyLocation = () => {
  const context = useContext(CompanyLocationContext);
  if (!context) {
    throw new Error('useCompanyLocation must be used within CompanyLocationProvider');
  }
  return context;
};

export const CompanyLocationProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCompany, setSelectedCompanyState] = useState(null);
  const [selectedLocation, setSelectedLocationState] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved context from IndexedDB
  const loadSavedContext = useCallback(async () => {
    const savedCompany = await idbGet(CONTEXT_STORE, 'selectedCompany');
    const savedLocation = await idbGet(CONTEXT_STORE, 'selectedLocation');
    return { savedCompany: savedCompany?.value, savedLocation: savedLocation?.value };
  }, []);

  // Fetch companies from Supabase
  const fetchFromSupabase = useCallback(async () => {
    try {
      const { data: companiesData, error: companiesError } = await supabase?.from('companies')?.select('*')?.eq('is_active', true)?.order('name');

      if (companiesError) throw companiesError;

      const { data: locationsData, error: locationsError } = await supabase?.from('locations')?.select('*')?.eq('is_active', true)?.order('name');

      if (locationsError) throw locationsError;

      // Cache to IndexedDB
      await idbPutAll(COMPANIES_STORE, companiesData || []);
      await idbPutAll(LOCATIONS_STORE, locationsData || []);
      setLastSync(new Date());

      return { companies: companiesData || [], locations: locationsData || [] };
    } catch (err) {
      console.error('Failed to fetch from Supabase:', err);
      return null;
    }
  }, []);

  // Load from IndexedDB (offline fallback)
  const loadFromIndexedDB = useCallback(async () => {
    const companies = await idbGetAll(COMPANIES_STORE);
    const locations = await idbGetAll(LOCATIONS_STORE);
    return { companies, locations };
  }, []);

  // Initialize: load data and restore context
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const { savedCompany, savedLocation } = await loadSavedContext();

        let companiesData = [];
        let locationsData = [];

        if (isOnline) {
          const result = await fetchFromSupabase();
          if (result) {
            companiesData = result?.companies;
            locationsData = result?.locations;
          } else {
            // Fallback to IndexedDB
            const cached = await loadFromIndexedDB();
            companiesData = cached?.companies;
            locationsData = cached?.locations;
          }
        } else {
          const cached = await loadFromIndexedDB();
          companiesData = cached?.companies;
          locationsData = cached?.locations;
        }

        setCompanies(companiesData);
        setLocations(locationsData);

        // Restore or set default company
        let activeCompany = null;
        if (savedCompany) {
          activeCompany = companiesData?.find(c => c?.id === savedCompany?.id) || null;
        }
        if (!activeCompany) {
          activeCompany = companiesData?.find(c => c?.is_default) || companiesData?.[0] || null;
        }
        setSelectedCompanyState(activeCompany);

        // Restore or set default location for the company
        if (activeCompany) {
          const companyLocations = locationsData?.filter(l => l?.company_id === activeCompany?.id);
          let activeLocation = null;
          if (savedLocation) {
            activeLocation = companyLocations?.find(l => l?.id === savedLocation?.id) || null;
          }
          if (!activeLocation) {
            activeLocation = companyLocations?.find(l => l?.is_default) || companyLocations?.[0] || null;
          }
          setSelectedLocationState(activeLocation);
        }
      } catch (err) {
        console.error('CompanyLocationContext init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Re-sync when coming back online
  useEffect(() => {
    if (isOnline && !loading) {
      fetchFromSupabase()?.then(result => {
        if (result) {
          setCompanies(result?.companies);
          setLocations(result?.locations);
        }
      });
    }
  }, [isOnline]);

  const setSelectedCompany = useCallback(async (company) => {
    setSelectedCompanyState(company);
    await idbPut(CONTEXT_STORE, { key: 'selectedCompany', value: company });

    // Auto-select default location for new company
    if (company) {
      const companyLocations = locations?.filter(l => l?.company_id === company?.id);
      const defaultLoc = companyLocations?.find(l => l?.is_default) || companyLocations?.[0] || null;
      setSelectedLocationState(defaultLoc);
      await idbPut(CONTEXT_STORE, { key: 'selectedLocation', value: defaultLoc });
    } else {
      setSelectedLocationState(null);
      await idbPut(CONTEXT_STORE, { key: 'selectedLocation', value: null });
    }
  }, [locations]);

  const setSelectedLocation = useCallback(async (location) => {
    setSelectedLocationState(location);
    await idbPut(CONTEXT_STORE, { key: 'selectedLocation', value: location });
  }, []);

  // Get locations filtered by selected company
  const activeLocations = selectedCompany
    ? locations?.filter(l => l?.company_id === selectedCompany?.id)
    : locations;

  const syncNow = useCallback(async () => {
    if (!isOnline) return;
    const result = await fetchFromSupabase();
    if (result) {
      setCompanies(result?.companies);
      setLocations(result?.locations);
    }
  }, [isOnline, fetchFromSupabase]);

  const refreshLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase?.from('locations')?.select('*')?.eq('is_active', true)?.order('name');
      if (error) throw error;
      let locationsData = data || [];
      await idbPutAll(LOCATIONS_STORE, locationsData);
      setLocations(locationsData);

      // If selected company has no location yet, auto-select the first one
      if (selectedCompany) {
        const companyLocations = locationsData?.filter(l => l?.company_id === selectedCompany?.id);
        if (!selectedLocation && companyLocations?.length > 0) {
          const defaultLoc = companyLocations?.find(l => l?.is_default) || companyLocations?.[0];
          setSelectedLocationState(defaultLoc);
          await idbPut(CONTEXT_STORE, { key: 'selectedLocation', value: defaultLoc });
        }
      }
    } catch (err) {
      console.error('Failed to refresh locations:', err);
    }
  }, [selectedCompany, selectedLocation, fetchFromSupabase]);

  const refreshCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase?.from('companies')?.select('*')?.eq('is_active', true)?.order('name');
      if (error) throw error;
      let companiesData = data || [];
      await idbPutAll(COMPANIES_STORE, companiesData);
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to refresh companies:', err);
    }
  }, []);

  const value = {
    companies,
    locations,
    activeLocations,
    selectedCompany,
    selectedLocation,
    setSelectedCompany,
    setSelectedLocation,
    isOnline,
    loading,
    lastSync,
    syncNow,
    refreshLocations,
    refreshCompanies,
  };

  return (
    <CompanyLocationContext.Provider value={value}>
      {children}
    </CompanyLocationContext.Provider>
  );
};

export default CompanyLocationContext;
