CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  business_email TEXT,
  business_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  due_date DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  notes TEXT DEFAULT '',
  stripe_invoice_id TEXT,
  sequence_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  applies_to_status TEXT DEFAULT 'sent' CHECK (applies_to_status IN ('sent', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  action TEXT DEFAULT 'send_email' CHECK (action IN ('send_email', 'mark_overdue', 'send_email_and_mark_overdue')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reminders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  step_id UUID REFERENCES sequence_steps(id) ON DELETE SET NULL,
  step_number INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  max_invoices INTEGER DEFAULT -1,
  max_clients INTEGER DEFAULT -1,
  max_sequences INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT,
  webhook_secret TEXT,
  is_connected BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_sequence ON invoices(sequence_id);
CREATE INDEX idx_sequences_user_id ON sequences(user_id);
CREATE INDEX idx_sequence_steps_sequence ON sequence_steps(sequence_id);
CREATE INDEX idx_reminders_log_invoice ON reminders_log(invoice_id);
CREATE INDEX idx_business_profiles_user ON business_profiles(user_id);
CREATE INDEX idx_integrations_user ON integration_settings(user_id);
CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);

INSERT INTO plans (id, name, description, price_monthly_cents, price_yearly_cents, features, max_invoices, max_clients, max_sequences) VALUES
('free', 'Free', 'For freelancers just getting started', 0, 0, '["Up to 10 invoices/month", "Basic email reminders", "1 reminder sequence", "Email support"]', 10, 10, 1),
('pro', 'Pro', 'For growing businesses', 2900, 29000, '["Unlimited invoices", "Custom reminder sequences", "SendGrid integration", "Stripe integration", "Priority support", "Analytics dashboard"]', -1, -1, 5),
('enterprise', 'Enterprise', 'For large teams and agencies', 9900, 99000, '["Everything in Pro", "Unlimited sequences", "Team members", "Custom branding", "API access", "Dedicated support", "SLA guarantee"]', -1, -1, -1);
