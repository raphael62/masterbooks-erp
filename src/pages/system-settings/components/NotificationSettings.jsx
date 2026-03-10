import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ALERT_TYPES = [
  {
    id: 'low_stock',
    label: 'Low Stock Alerts',
    icon: 'Package',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    description: 'Triggered when product stock on hand falls below the reorder level threshold.',
    hasThresholdDays: false,
    hasLowStockThreshold: true,
  },
  {
    id: 'tax_compliance',
    label: 'Tax Compliance Date Alerts',
    icon: 'Calendar',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    description: 'Triggered before tax effective dates. Notifies when a tax rate becomes effective within the configured days.',
    hasThresholdDays: true,
    hasLowStockThreshold: false,
  },
  {
    id: 'audit_log',
    label: 'Audit Log Change Alerts',
    icon: 'Shield',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    description: 'Triggered on sensitive audit events: DELETE actions and role/permission changes in the last 24 hours.',
    hasThresholdDays: false,
    hasLowStockThreshold: false,
  },
  {
    id: 'payment_overdue',
    label: 'Payment Overdue Alerts',
    icon: 'CreditCard',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    description: 'Triggered when purchase invoice payment date has passed without payment being recorded.',
    hasThresholdDays: false,
    hasLowStockThreshold: false,
  },
];

const defaultSettings = () => ({
  is_enabled: false,
  recipient_emails: [],
  threshold_days: 7,
  low_stock_threshold: 10,
});

const NotificationSettings = () => {
  const [settings, setSettings] = useState({});
  const [emailInputs, setEmailInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase?.from('notification_settings')?.select('*');
      if (error) throw error;

      const mapped = {};
      const inputs = {};
      ALERT_TYPES?.forEach((at) => {
        const row = data?.find((r) => r?.alert_type === at?.id);
        mapped[at.id] = row
          ? {
              is_enabled: row?.is_enabled,
              recipient_emails: row?.recipient_emails ?? [],
              threshold_days: row?.threshold_days ?? 7,
              low_stock_threshold: row?.low_stock_threshold ?? 10,
            }
          : defaultSettings();
        inputs[at.id] = '';
      });
      setSettings(mapped);
      setEmailInputs(inputs);
    } catch (err) {
      showToast('Failed to load notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (alertType, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [alertType]: { ...prev?.[alertType], [field]: value },
    }));
  };

  const addEmail = (alertType) => {
    const email = emailInputs?.[alertType]?.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex?.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    const current = settings?.[alertType]?.recipient_emails ?? [];
    if (current?.includes(email)) {
      showToast('Email already added', 'error');
      return;
    }
    updateSetting(alertType, 'recipient_emails', [...current, email]);
    setEmailInputs((prev) => ({ ...prev, [alertType]: '' }));
  };

  const removeEmail = (alertType, email) => {
    const current = settings?.[alertType]?.recipient_emails ?? [];
    updateSetting(
      alertType,
      'recipient_emails',
      current?.filter((e) => e !== email)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const at of ALERT_TYPES) {
        const s = settings?.[at?.id];
        const { error } = await supabase?.from('notification_settings')?.upsert(
            {
              alert_type: at?.id,
              is_enabled: s?.is_enabled ?? false,
              recipient_emails: s?.recipient_emails ?? [],
              threshold_days: s?.threshold_days ?? 7,
              low_stock_threshold: s?.low_stock_threshold ?? 10,
              updated_at: new Date()?.toISOString(),
            },
            { onConflict: 'alert_type' }
          );
        if (error) throw error;
      }
      showToast('Notification settings saved successfully');
    } catch (err) {
      showToast('Failed to save settings: ' + err?.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async (alertType) => {
    setTesting((prev) => ({ ...prev, [alertType]: true }));
    try {
      const { data, error } = await supabase?.functions?.invoke('send-notifications', {
        body: { alert_type: alertType },
      });
      if (error) throw error;
      const sent = data?.emails_sent ?? 0;
      showToast(
        sent > 0
          ? `Test alert sent — ${sent} email(s) dispatched`
          : 'No matching data found or notifications are disabled'
      );
    } catch (err) {
      showToast('Test failed: ' + err?.message, 'error');
    } finally {
      setTesting((prev) => ({ ...prev, [alertType]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" size={24} className="animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading notification settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast?.type === 'error' ?'bg-red-600 text-white' :'bg-green-600 text-white'
          }`}
        >
          <Icon name={toast?.type === 'error' ? 'XCircle' : 'CheckCircle'} size={16} />
          {toast?.message}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Email Notification Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated email alerts via Resend for critical business events
          </p>
        </div>
        <Button
          variant="default"
          onClick={handleSave}
          loading={saving}
          iconName="Save"
          iconPosition="left"
        >
          Save Settings
        </Button>
      </div>
      {/* Alert Type Cards */}
      {ALERT_TYPES?.map((at) => {
        const s = settings?.[at?.id] ?? defaultSettings();
        const isEnabled = s?.is_enabled;

        return (
          <div
            key={at?.id}
            className={`rounded-lg border-2 transition-all ${
              isEnabled ? at?.border : 'border-border'
            } bg-card`}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${at?.bg}`}>
                  <Icon name={at?.icon} size={20} className={at?.color} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{at?.label}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5 max-w-lg">{at?.description}</p>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => updateSetting(at?.id, 'is_enabled', !isEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  isEnabled ? 'bg-primary' : 'bg-muted'
                }`}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {/* Expanded Config */}
            {isEnabled && (
              <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                {/* Threshold Days */}
                {at?.hasThresholdDays && (
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-foreground w-48 flex-shrink-0">
                      Alert Days Before Due Date
                    </label>
                    <div className="w-32">
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={s?.threshold_days ?? 7}
                        onChange={(e) =>
                          updateSetting(at?.id, 'threshold_days', parseInt(e?.target?.value) || 7)
                        }
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                )}

                {/* Low Stock Threshold */}
                {at?.hasLowStockThreshold && (
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-foreground w-48 flex-shrink-0">
                      Low Stock Threshold
                    </label>
                    <div className="w-32">
                      <Input
                        type="number"
                        min={1}
                        value={s?.low_stock_threshold ?? 10}
                        onChange={(e) =>
                          updateSetting(
                            at?.id,
                            'low_stock_threshold',
                            parseInt(e?.target?.value) || 10
                          )
                        }
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                )}

                {/* Recipient Emails */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Recipient Email Addresses
                  </label>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={emailInputs?.[at?.id] ?? ''}
                        onChange={(e) =>
                          setEmailInputs((prev) => ({ ...prev, [at?.id]: e?.target?.value }))
                        }
                        onKeyDown={(e) => {
                          if (e?.key === 'Enter') {
                            e?.preventDefault();
                            addEmail(at?.id);
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => addEmail(at?.id)}
                      iconName="Plus"
                      iconPosition="left"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Email Tags */}
                  {s?.recipient_emails?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {s?.recipient_emails?.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                        >
                          <Icon name="Mail" size={12} />
                          {email}
                          <button
                            onClick={() => removeEmail(at?.id, email)}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <Icon name="X" size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No recipients added. Add at least one email to receive alerts.
                    </p>
                  )}
                </div>

                {/* Test Button */}
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    onClick={() => handleTestAlert(at?.id)}
                    loading={testing?.[at?.id]}
                    iconName="Send"
                    iconPosition="left"
                  >
                    Send Test Alert
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Icon name="Info" size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">How alerts work</p>
          <p>
            Alerts are sent via Resend email service. Use the <strong>Send Test Alert</strong> button to
            verify your configuration. Alerts check live data — if no matching records exist, no email is sent.
            Ensure your Resend API key is configured in the Edge Function environment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
