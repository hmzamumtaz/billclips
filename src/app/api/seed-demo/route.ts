import { createServerSupabaseClient } from "@/lib/supabase";

const DEMO_EMAIL = "demo@billclips.com";
const DEMO_PASSWORD = "Demo123!";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    let userId: string;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", DEMO_EMAIL)
      .maybeSingle();

    if (existingUser) {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("user_id", existingUser.id)
        .limit(1)
        .maybeSingle();

      if (existingInvoice) {
        return Response.json({ message: "Demo account already exists", email: DEMO_EMAIL, password: DEMO_PASSWORD });
      }

      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      if (createError) throw new Error(createError.message);
      if (!newUser.user) throw new Error("Failed to create user");

      userId = newUser.user.id;
    }

    const clients = [
      { name: "Acme Corp", email: "billing@acme.com", phone: "+1 (212) 555-0101", address: "350 Fifth Avenue, New York, NY 10118", amount: 15000, status: "paid" },
      { name: "Globex Industries", email: "ap@globex.com", phone: "+1 (312) 555-0202", address: "233 S Wacker Dr, Chicago, IL 60606", amount: 25000, status: "paid" },
      { name: "Initech Solutions", email: "finance@initech.com", phone: "+1 (512) 555-0303", address: "741 Congress Ave, Austin, TX 78701", amount: 42000, status: "sent" },
      { name: "Stark Enterprises", email: "accounting@stark.com", phone: "+1 (415) 555-0505", address: "10880 Malibu Point, Malibu, CA 90265", amount: 120000, status: "overdue" },
      { name: "Wayne Logistics", email: "invoices@wayne.com", phone: "+1 (773) 555-0606", address: "1007 Mountain Drive, Gotham, NY 10001", amount: 8500, status: "overdue" },
      { name: "Oscorp Technologies", email: "billing@oscorp.com", phone: "+1 (212) 555-0707", address: "1 Times Square, New York, NY 10036", amount: 32000, status: "sent" },
      { name: "Cyberdyne Systems", email: "finance@cyberdyne.com", phone: "+1 (408) 555-0808", address: "4400 Stevens Creek Blvd, San Jose, CA 95129", amount: 18000, status: "draft" },
    ];

    const invoiceRows = clients.map((c, i) => {
      const d = new Date(); d.setDate(d.getDate() - (i * 7) + 3);
      return {
        user_id: userId, client_name: c.name, client_email: c.email,
        client_phone: c.phone, client_address: c.address,
        amount_cents: c.amount, due_date: d.toISOString().split("T")[0],
        status: c.status, notes: `Sample invoice for ${c.name}`,
      };
    });

    const { error: invErr } = await supabase.from("invoices").insert(invoiceRows);
    if (invErr) throw new Error(invErr.message);

    const { data: seq, error: seqErr } = await supabase.from("sequences").insert({
      user_id: userId, name: "Standard Reminder Flow",
      description: "Gentle at 3 days, escalate at 7, final at 14",
      applies_to_status: "overdue", is_active: true,
    }).select().single();
    if (seqErr) throw new Error(seqErr.message);

    await supabase.from("sequence_steps").insert([
      { sequence_id: seq.id, step_number: 1, delay_days: 3, subject: "Gentle reminder: Payment due", body_text: "Hi {{client_name}},\n\nJust a friendly reminder that invoice of ${{amount}} is due.\n\nPay here: {{payment_link}}\n\nThanks!", action: "send_email" },
      { sequence_id: seq.id, step_number: 2, delay_days: 7, subject: "Overdue: Invoice requires attention", body_text: "Hi {{client_name}},\n\nYour invoice of ${{amount}} is overdue.\n\nPlease pay: {{payment_link}}\n\nRegards", action: "send_email" },
      { sequence_id: seq.id, step_number: 3, delay_days: 14, subject: "Final notice", body_text: "Hi {{client_name}},\n\nFinal notice for ${{amount}}. Payment is 14 days overdue.\n\nPay now: {{payment_link}}", action: "send_email_and_mark_overdue" },
    ]);

    return Response.json({ message: "Demo account ready", email: DEMO_EMAIL, password: DEMO_PASSWORD });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
