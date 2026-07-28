import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const supabase = createServerSupabaseClient();

    const rawBody = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return Response.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
      return Response.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(env.stripeSecretKey, {
      apiVersion: '2026-06-24.dahlia',
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        env.stripeWebhookSecret
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Signature verification failed';
      console.error(`Webhook verification failed: ${message}`);
      return Response.json(
        { error: `Webhook Error: ${message}` },
        { status: 400 }
      );
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeInvoiceId = invoice.id;

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('stripe_invoice_id', stripeInvoiceId);

      if (updateError) {
        console.error(
          `Failed to update invoice ${stripeInvoiceId}:`,
          updateError
        );
        return Response.json(
          { error: 'Failed to update invoice status' },
          { status: 500 }
        );
      }

      console.log(`Invoice ${stripeInvoiceId} marked as paid via webhook`);
    }

    return Response.json({ received: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Webhook handler error';
    console.error('Webhook error:', message);
    return Response.json({ error: message }, { status: 400 });
  }
}
