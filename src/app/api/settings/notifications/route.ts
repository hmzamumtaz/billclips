import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    let { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newPrefs, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: "00000000-0000-0000-0000-000000000000" })
        .select()
        .single();

      if (insertError) throw insertError;
      return Response.json(newPrefs);
    }

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notification preferences";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const allowed = ["daily_overdue_summary", "payment_received", "weekly_ar_report", "reminder_sent", "invoice_opened", "email"];
    const updates: Record<string, any> = {};
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("notification_preferences")
      .update(updates)
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update notification preferences";
    return Response.json({ error: msg }, { status: 500 });
  }
}
