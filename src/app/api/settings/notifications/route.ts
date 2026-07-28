import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

const defaults = {
  daily_overdue_summary: true,
  payment_received: true,
  weekly_ar_report: false,
  reminder_sent: true,
  invoice_opened: false,
};

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      return Response.json({ user_id: user.id, email: user.email, ...defaults });
    }
    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notification preferences";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        email: user.email,
        daily_overdue_summary: body.daily_overdue_summary ?? defaults.daily_overdue_summary,
        payment_received: body.payment_received ?? defaults.payment_received,
        weekly_ar_report: body.weekly_ar_report ?? defaults.weekly_ar_report,
        reminder_sent: body.reminder_sent ?? defaults.reminder_sent,
        invoice_opened: body.invoice_opened ?? defaults.invoice_opened,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save notification preferences";
    return Response.json({ error: msg }, { status: 500 });
  }
}
