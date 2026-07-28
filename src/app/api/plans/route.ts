import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly_cents", { ascending: true });

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch plans";
    return Response.json({ error: msg }, { status: 500 });
  }
}
