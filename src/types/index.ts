export interface User {
  id: string;
  email: string;
  business_name: string;
  stripe_account_id: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  amount_cents: number;
  due_date: string;
  status: 'sent' | 'paid' | 'overdue';
  stripe_invoice_id: string | null;
  created_at: string;
}

export interface ReminderLog {
  id: string;
  invoice_id: string;
  step_number: number;
  sent_at: string;
}

export interface DashboardStats {
  totalOutstanding: number;
  cashCollectedThisMonth: number;
  overdueCount: number;
}
