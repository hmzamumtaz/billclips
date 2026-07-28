import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return Response.json({ error: "invoiceId is required" }, { status: 400 });
    }

    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    const amount = (invoice.amount_cents / 100).toFixed(2);
    const paymentLink = invoice.stripe_invoice_id
      ? `https://pay.stripe.com/invoice/${invoice.stripe_invoice_id}`
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/${invoice.id}`;

    const subject = `Payment reminder for invoice of $${amount}`;
    const body = `Hi ${invoice.client_name},\n\nThis is a manual reminder that your invoice of $${amount} is due.\n\nPlease pay here: ${paymentLink}\n\nThank you!`;

    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: invoice.client_email }] }],
          from: { email: process.env.FROM_EMAIL || "noreply@billclips.app", name: "BillClips" },
          subject,
          content: [{ type: "text/plain", value: body }],
        }),
      });
    } else {
      console.log(`[Mock Nudge] To: ${invoice.client_email}`);
    }

    await supabase.from("reminders_log").insert({
      invoice_id: invoice.id,
      step_number: 0,
    });

    return Response.json({ success: true, sent_to: invoice.client_email });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send nudge";
    console.error("POST /api/send-nudge error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
