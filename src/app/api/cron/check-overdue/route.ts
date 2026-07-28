import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function POST(_request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const today = new Date().toISOString().split("T")[0];

    const { data: overdueInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("status", "sent")
      .lt("due_date", today);

    if (fetchError) {
      console.error("Failed to fetch overdue invoices:", fetchError);
      return Response.json({ error: "Failed to fetch overdue invoices" }, { status: 500 });
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return Response.json({ processed: 0, message: "No overdue invoices" });
    }

    const { data: activeSequences } = await supabase
      .from("sequences")
      .select("*, steps:sequence_steps(*)")
      .eq("is_active", true);

    const defaultSteps = [
      { step_number: 1, delay_days: 3, subject: "Gentle reminder: Invoice is due", body_text: "Hi {{client_name}},\n\nThis is a friendly reminder that your invoice of ${{amount}} is now overdue.\n\nPlease pay here: {{payment_link}}\n\nThank you!", action: "send_email" },
      { step_number: 2, delay_days: 7, subject: "Urgent: Overdue invoice requires payment", body_text: "Hi {{client_name}},\n\nYour invoice of ${{amount}} is now 7 days overdue.\n\nImmediate payment is required: {{payment_link}}\n\nPlease remit payment immediately.\n\nThank you.", action: "send_email_and_mark_overdue" },
    ];

    let processedCount = 0;

    for (const invoice of overdueInvoices) {
      try {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        const { data: todayReminders } = await supabase
          .from("reminders_log")
          .select("*")
          .eq("invoice_id", invoice.id)
          .gte("sent_at", `${today}T00:00:00Z`);

        if (todayReminders && todayReminders.length > 0) continue;

        let sequence = activeSequences?.find((s) => s.id === invoice.sequence_id);
        if (!sequence) sequence = { steps: defaultSteps } as any;

        const steps = (sequence?.steps || defaultSteps) as any[];
        const dueStep = steps.find((s) => s.delay_days === daysOverdue);

        if (!dueStep) continue;

        const amount = (invoice.amount_cents / 100).toFixed(2);
        const paymentLink = invoice.stripe_invoice_id
          ? `https://pay.stripe.com/invoice/${invoice.stripe_invoice_id}`
          : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/${invoice.id}`;

        const subject = dueStep.subject
          .replace(/\{\{client_name\}\}/g, invoice.client_name)
          .replace(/\{\{amount\}\}/g, amount)
          .replace(/\{\{payment_link\}\}/g, paymentLink);

        const body = dueStep.body_text
          .replace(/\{\{client_name\}\}/g, invoice.client_name)
          .replace(/\{\{amount\}\}/g, amount)
          .replace(/\{\{payment_link\}\}/g, paymentLink);

        if (dueStep.action === "send_email" || dueStep.action === "send_email_and_mark_overdue") {
          await sendEmail(invoice.client_email, subject, body);
        }

        if (dueStep.action === "mark_overdue" || dueStep.action === "send_email_and_mark_overdue") {
          await supabase.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);
        }

        await supabase.from("reminders_log").insert({
          invoice_id: invoice.id,
          step_number: dueStep.step_number,
          step_id: dueStep.id || null,
        });

        processedCount++;
        console.log(`Processed step ${dueStep.step_number} for invoice ${invoice.id}`);
      } catch (invErr) {
        console.error(`Error processing invoice ${invoice.id}:`, invErr);
      }
    }

    return Response.json({ processed: processedCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cron error";
    console.error("Cron error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.FROM_EMAIL || "noreply@billclips.app", name: "BillClips" },
          subject,
          content: [{ type: "text/plain", value: body }],
        }),
      });
      if (!res.ok) console.error(`SendGrid error for ${to}: ${await res.text()}`);
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
    }
  } else {
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
  }
}
