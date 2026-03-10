import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Building2, AlertTriangle, X } from 'lucide-react';
import AppLayout from '../../components/ui/AppLayout';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import CompanyGrid from './components/CompanyGrid';
import EditCompanyModal from './components/EditCompanyModal';
import NewCompanyModal from '../customer-management/components/NewCompanyModal';
import { supabase } from '../../lib/supabase';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        ?.from('companies')
        ?.select('*')
        ?.order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setCompanies(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Filter companies based on search and status
  useEffect(() => {
    let result = companies || [];
    const q = searchQuery?.toLowerCase()?.trim();
    if (q) {
      result = result?.filter(
        (c) =>
          c?.name?.toLowerCase()?.includes(q) ||
          c?.code?.toLowerCase()?.includes(q) ||
          c?.address?.toLowerCase()?.includes(q) ||
          c?.email?.toLowerCase()?.includes(q) ||
          c?.phone?.toLowerCase()?.includes(q)
      );
    }
    if (statusFilter === 'active') {
      result = result?.filter((c) => c?.is_active !== false);
    } else if (statusFilter === 'inactive') {
      result = result?.filter((c) => c?.is_active === false);
    }
    setFilteredCompanies(result);
  }, [companies, searchQuery, statusFilter]);

  const handleNewCompanySaved = (newCompany) => {
    setCompanies((prev) => [...(prev || []), newCompany]);
  };

  const handleEditSaved = (updatedCompany) => {
    setCompanies((prev) =>
      prev?.map((c) => (c?.id === updatedCompany?.id ? updatedCompany : c))
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error: delError } = await supabase
        ?.from('companies')
        ?.delete()
        ?.eq('id', deleteTarget?.id);
      if (delError) throw delError;
      setCompanies((prev) => prev?.filter((c) => c?.id !== deleteTarget?.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.message || 'Failed to delete company.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = companies?.filter((c) => c?.is_active !== false)?.length || 0;
  const inactiveCount = companies?.filter((c) => c?.is_active === false)?.length || 0;

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-4">
          <BreadcrumbNavigation />

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Company Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage all companies in your organisation
              </p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus size={16} />
              New Company
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
              <Building2 size={14} className="text-purple-600" />
              <span className="text-xs font-medium text-gray-700">{companies?.length || 0} Total</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700">{activeCount} Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs font-medium text-gray-600">{inactiveCount} Inactive</span>
            </div>
            <button
              onClick={fetchCompanies}
              className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, address, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 text-gray-400"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e?.target?.value)}
              className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white min-w-[130px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={14} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Results count */}
          {!loading && searchQuery && (
            <p className="text-xs text-gray-500 mb-3">
              {filteredCompanies?.length} result{filteredCompanies?.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <CompanyGrid
            companies={filteredCompanies}
            loading={loading}
            onEdit={(company) => setEditCompany(company)}
            onDelete={(company) => setDeleteTarget(company)}
          />
        </div>
      </div>

      {/* New Company Modal */}
      <NewCompanyModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSaved={handleNewCompanySaved}
      />

      {/* Edit Company Modal */}
      <EditCompanyModal
        isOpen={!!editCompany}
        onClose={() => setEditCompany(null)}
        onSaved={handleEditSaved}
        company={editCompany}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Delete Company</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-8 px-4 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="h-8 px-4 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default CompanyManagement;
