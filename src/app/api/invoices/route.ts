import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateEnv } from '@/lib/env';

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch invoices:', error);
      return Response.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return Response.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch invoices';
    console.error('GET /api/invoices error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const body = await request.json();

    if (
      !body.client_name ||
      !body.client_email ||
      !body.amount_cents ||
      !body.due_date
    ) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: body.user_id || '00000000-0000-0000-0000-000000000000',
        client_name: body.client_name,
        client_email: body.client_email,
        amount_cents: Math.round(body.amount_cents),
        due_date: body.due_date,
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create invoice:', error);
      return Response.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to create invoice';
    console.error('POST /api/invoices error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
