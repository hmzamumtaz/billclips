import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

const clients = [
  { name: "Acme Corp", email: "billing@acme.com", phone: "+1 (212) 555-0101", address: "350 Fifth Avenue, New York, NY 10118" },
  { name: "Globex Industries", email: "ap@globex.com", phone: "+1 (312) 555-0202", address: "233 S Wacker Dr, Chicago, IL 60606" },
  { name: "Initech Solutions", email: "finance@initech.com", phone: "+1 (512) 555-0303", address: "741 Congress Ave, Austin, TX 78701" },
  { name: "Umbrella Medical", email: "payments@umbrella.com", phone: "+44 20 7946 0404", address: "123 Oxford St, London W1D 1AN" },
  { name: "Stark Enterprises", email: "accounting@stark.com", phone: "+1 (415) 555-0505", address: "10880 Malibu Point, Malibu, CA 90265" },
  { name: "Wayne Logistics", email: "invoices@wayne.com", phone: "+1 (773) 555-0606", address: "1007 Mountain Drive, Gotham, NY 10001" },
  { name: "Oscorp Technologies", email: "billing@oscorp.com", phone: "+1 (212) 555-0707", address: "1 Times Square, New York, NY 10036" },
  { name: "Cyberdyne Systems", email: "finance@cyberdyne.com", phone: "+1 (408) 555-0808", address: "4400 Stevens Creek Blvd, San Jose, CA 95129" },
  { name: "Soylent Corp", email: "ap@soylent.com", phone: "+1 (202) 555-0909", address: "1600 Pennsylvania Ave, Washington, DC 20500" },
  { name: "Wonka Industries", email: "orders@wonka.com", phone: "+1 (303) 555-1010", address: "555 Chocolate Factory Ln, Denver, CO 80202" },
];

const statuses = ["draft", "sent", "sent", "paid", "paid", "paid", "overdue", "overdue", "sent", "cancelled"] as const;

function randomAmount() {
  const amounts = [15000, 25000, 42000, 7500, 120000, 8500, 32000, 18000, 9500, 65000];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function randomDate(index: number) {
  const d = new Date();
  d.setDate(d.getDate() - (index * 7) + Math.floor(Math.random() * 5));
  return d.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser(request);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();

    const { data: existing } = await supabase.from("invoices").select("id").eq("user_id", user.id).limit(1);
    if (existing && existing.length > 0) {
      return Response.json({ error: "Sample data already exists. Delete your invoices first to re-seed." }, { status: 409 });
    }

    const invoiceRows = clients.map((c, i) => ({
      user_id: user.id,
      client_name: c.name,
      client_email: c.email,
      client_phone: c.phone,
      client_address: c.address,
      amount_cents: randomAmount(),
      due_date: randomDate(i),
      status: statuses[i],
      notes: `Sample invoice for ${c.name}`,
    }));

    const { error: invErr } = await supabase.from("invoices").insert(invoiceRows);
    if (invErr) throw invErr;

    const { data: seq, error: seqErr } = await supabase
      .from("sequences")
      .insert({
        user_id: user.id,
        name: "Standard Reminder Flow",
        description: "Friendly reminder at 3 days, escalate at 7, final notice at 14",
        applies_to_status: "overdue",
        is_active: true,
      })
      .select()
      .single();
    if (seqErr) throw seqErr;

    await supabase.from("sequence_steps").insert([
      { sequence_id: seq.id, step_number: 1, delay_days: 3, subject: "Gentle reminder: Payment due", body_text: "Hi {{client_name}},\n\nJust a friendly reminder that invoice amount ${{amount}} is due soon.\n\nPay here: {{payment_link}}\n\nThanks!", action: "send_email" },
      { sequence_id: seq.id, step_number: 2, delay_days: 7, subject: "Overdue: Invoice requires attention", body_text: "Hi {{client_name}},\n\nYour invoice of ${{amount}} is now overdue.\n\nPlease pay as soon as possible: {{payment_link}}\n\nRegards", action: "send_email" },
      { sequence_id: seq.id, step_number: 3, delay_days: 14, subject: "Final notice: Immediate payment required", body_text: "Hi {{client_name}},\n\nThis is your final notice. Invoice ${{amount}} is now 14 days overdue.\n\nPay immediately: {{payment_link}}\n\nFailure to pay may result in service suspension.", action: "send_email_and_mark_overdue" },
    ]);

    return Response.json({ message: `Seeded ${invoiceRows.length} invoices and 1 sequence with 3 steps` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to seed data";
    console.error("POST /api/seed error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
