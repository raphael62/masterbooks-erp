import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const UserModal = ({ user, isInvite, roles, onClose, onSaved }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user?.full_name || '');
      setEmail(user?.email || '');
      setRoleId(user?.role_id || '');
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setRoleId(roles?.[0]?.value || '');
    }
    setError('');
  }, [user?.id, roles]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isInvite) {
        if (!email?.trim()) {
          setError('Email is required');
          setSaving(false);
          return;
        }
        if (!password?.trim() || password?.length < 6) {
          setError('Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email?.trim(),
          password: password?.trim(),
          options: { data: { full_name: fullName?.trim() || email?.split('@')?.[0] } },
        });
        if (signUpErr) throw signUpErr;
        const newUserId = data?.user?.id;
        if (newUserId && roleId) {
          await supabase.from('user_roles').upsert([{ user_id: newUserId, role_id: roleId }], {
            onConflict: 'user_id',
          });
        }
      } else {
        if (!user?.id) return;
        await supabase
          .from('user_profiles')
          .update({ full_name: fullName?.trim() || null, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (roleId) {
          await supabase.from('user_roles').upsert([{ user_id: user.id, role_id: roleId }], {
            onConflict: 'user_id',
          });
        } else {
          await supabase.from('user_roles').delete().eq('user_id', user.id);
        }
      }
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const title = isInvite ? 'Invite User' : 'Edit User';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e?.target === e?.currentTarget && onClose?.()}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e?.stopPropagation?.()}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose} iconName="X" />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">{error}</div>}
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e?.target?.value)}
            placeholder="e.g. John Doe"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e?.target?.value)}
            placeholder="user@example.com"
            disabled={!isInvite}
            description={!isInvite ? 'Email cannot be changed here' : null}
          />
          {isInvite && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e?.target?.value)}
              placeholder="Min 6 characters"
            />
          )}
          <Select
            label="Role"
            options={[{ value: '', label: '— No role —' }, ...(roles || [])]}
            value={roleId}
            onChange={setRoleId}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={saving} iconName="Save" iconPosition="left">
              {saving ? 'Saving...' : isInvite ? 'Invite' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
