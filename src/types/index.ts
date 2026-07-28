export interface User {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  avatar_url: string | null;
  timezone: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  logo_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  amount_cents: number;
  currency: string;
  due_date: string;
  issue_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  stripe_invoice_id: string | null;
  sequence_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sequence {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_active: boolean;
  applies_to_status: 'sent' | 'overdue';
  created_at: string;
  updated_at: string;
  steps?: SequenceStep[];
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body_text: string;
  action: 'send_email' | 'mark_overdue' | 'send_email_and_mark_overdue';
  created_at: string;
}

export interface ReminderLog {
  id: string;
  invoice_id: string;
  step_id: string | null;
  step_number: number;
  sent_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  features: string[];
  max_invoices: number;
  max_clients: number;
  max_sequences: number;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSetting {
  id: string;
  user_id: string;
  provider: string;
  api_key: string | null;
  webhook_secret: string | null;
  is_connected: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  daily_overdue_summary: boolean;
  payment_received: boolean;
  weekly_ar_report: boolean;
  reminder_sent: boolean;
  invoice_opened: boolean;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalOutstanding: number;
  cashCollectedThisMonth: number;
  overdueCount: number;
  sentCount: number;
  paidCount: number;
  draftCount: number;
  totalInvoiced: number;
  avgPaymentDays: number;
  collectionRate: number;
}
