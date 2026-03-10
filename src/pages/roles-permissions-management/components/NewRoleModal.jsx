import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const NewRoleModal = ({ editItem, onClose, onSaved }) => {
  const isEdit = !!editItem;
  const [form, setForm] = useState({ role_name: '', description: '', status: 'Active' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (editItem) {
      setForm({
        role_name: editItem?.role_name || '',
        description: editItem?.description || '',
        status: editItem?.status || 'Active',
      });
    } else {
      setForm({ role_name: '', description: '', status: 'Active' });
    }
  }, [editItem]);

  const validate = () => {
    const errs = {};
    if (!form?.role_name?.trim()) errs.role_name = 'Role name is required';
    return errs;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      const roleName = form.role_name.trim();
      const payload = {
        role_name: roleName,
        description: form.description?.trim() || null,
        status: form.status,
      };
      if (isEdit) {
        const { error } = await supabase.from('roles').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const roleCode = roleName.replace(/\s+/g, '_').toUpperCase() || 'CUSTOM';
        const { error } = await supabase.from('roles').insert([{ ...payload, role_code: roleCode, is_system: false }]);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{isEdit ? 'Edit Role' : 'New Role'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {saveError && (
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{saveError}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Role name <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={form.role_name}
              onChange={(e) => handleChange('role_name', e.target.value)}
              placeholder="e.g. Supervisor"
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors?.role_name ? 'border-destructive' : 'border-border'}`}
            />
            {errors?.role_name && <p className="mt-1 text-xs text-destructive">{errors.role_name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Description</label>
            <textarea value={form?.description} onChange={e => handleChange('description', e?.target?.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRoleModal;
