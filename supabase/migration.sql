-- BillClips Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'paid', 'overdue')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Reminders log table
CREATE TABLE reminders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_reminders_log_invoice_id ON reminders_log(invoice_id);
