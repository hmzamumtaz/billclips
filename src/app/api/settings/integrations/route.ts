import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    return Response.json(data || []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch integrations";
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
      .from("integration_settings")
      .upsert({
        user_id: user.id,
        provider: body.provider,
        api_key: body.api_key || null,
        webhook_secret: body.webhook_secret || null,
        is_connected: body.is_connected ?? false,
        settings: body.settings || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id, provider" })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save integration";
    return Response.json({ error: msg }, { status: 500 });
  }
}
