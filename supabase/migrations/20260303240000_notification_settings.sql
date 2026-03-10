-- Notification Settings Migration
-- Stores per-alert-type configuration for email notifications

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  recipient_emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  threshold_days INTEGER DEFAULT 7,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_settings_alert_type
  ON public.notification_settings (alert_type);

CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled
  ON public.notification_settings (is_enabled);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_notification_settings" ON public.notification_settings;
CREATE POLICY "allow_all_notification_settings"
  ON public.notification_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default notification settings for all 4 alert types
INSERT INTO public.notification_settings (alert_type, is_enabled, recipient_emails, threshold_days, low_stock_threshold)
VALUES
  ('low_stock',        false, ARRAY[]::TEXT[], NULL, 10),
  ('tax_compliance',   false, ARRAY[]::TEXT[], 7,   NULL),
  ('audit_log',        false, ARRAY[]::TEXT[], NULL, NULL),
  ('payment_overdue',  false, ARRAY[]::TEXT[], NULL, NULL)
ON CONFLICT (alert_type) DO NOTHING;
