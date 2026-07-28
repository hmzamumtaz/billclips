import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateEnv } from '@/lib/env';

export async function POST(_request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const today = new Date().toISOString().split('T')[0];

    const { data: overdueInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'sent')
      .lt('due_date', today);

    if (fetchError) {
      console.error('Failed to fetch overdue invoices:', fetchError);
      return Response.json(
        { error: 'Failed to fetch overdue invoices' },
        { status: 500 }
      );
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return Response.json({ processed: 0, message: 'No overdue invoices' });
    }

    let processedCount = 0;

    for (const invoice of overdueInvoices) {
      try {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor(
          (new Date().getTime() - dueDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const { data: existingReminders } = await supabase
          .from('reminders_log')
          .select('*')
          .eq('invoice_id', invoice.id)
          .gte(
            'sent_at',
            new Date().toISOString().split('T')[0] + 'T00:00:00Z'
          );

        if (existingReminders && existingReminders.length > 0) {
          continue;
        }

        let stepNumber = 0;

        if (daysOverdue === 3) {
          stepNumber = 1;
        } else if (daysOverdue === 7) {
          stepNumber = 2;
          await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('id', invoice.id);
        }

        if (stepNumber > 0) {
          const amount = (invoice.amount_cents / 100).toFixed(2);
          const paymentLink = invoice.stripe_invoice_id
            ? `https://pay.stripe.com/invoice/${invoice.stripe_invoice_id}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`;

          const { subject, body } = buildReminderEmail(
            invoice.client_name,
            amount,
            paymentLink,
            stepNumber
          );

          await sendEmail(invoice.client_email, subject, body);

          await supabase.from('reminders_log').insert({
            invoice_id: invoice.id,
            step_number: stepNumber,
          });

          processedCount++;
        }
      } catch (invoiceError) {
        console.error(
          `Error processing invoice ${invoice.id}:`,
          invoiceError
        );
      }
    }

    return Response.json({ processed: processedCount });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown cron error';
    console.error('Cron handler error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

function buildReminderEmail(
  clientName: string,
  amount: string,
  paymentLink: string,
  stepNumber: number
): { subject: string; body: string } {
  const subjects: Record<number, string> = {
    1: `Gentle reminder: Invoice of $${amount} is due`,
    2: `Urgent: Overdue invoice of $${amount} requires payment`,
  };

  const bodies: Record<number, string> = {
    1: `Hi ${clientName},\n\nThis is a friendly reminder that your invoice of $${amount} is now overdue.\n\nPlease pay at your earliest convenience: ${paymentLink}\n\nThank you!`,
    2: `Hi ${clientName},\n\nYour invoice of $${amount} is now 7 days overdue.\n\nImmediate payment is required: ${paymentLink}\n\nPlease remit payment at your earliest convenience to avoid any service interruption.\n\nThank you.`,
  };

  return {
    subject: subjects[stepNumber] || 'Payment reminder',
    body: bodies[stepNumber] || bodies[1],
  };
}

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: {
            email: process.env.FROM_EMAIL || 'noreply@billclips.app',
            name: 'BillClips',
          },
          subject,
          content: [{ type: 'text/plain', value: body }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SendGrid error for ${to}: ${errorText}`);
      }
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
    }
  } else {
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
  }
}
