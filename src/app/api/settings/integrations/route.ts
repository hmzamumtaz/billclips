import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch integrations";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: existing } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .eq("provider", body.provider)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("integration_settings")
        .update({
          api_key: body.api_key || existing.api_key,
          webhook_secret: body.webhook_secret || existing.webhook_secret,
          is_connected: body.is_connected !== undefined ? body.is_connected : existing.is_connected,
          settings: body.settings || existing.settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return Response.json(data);
    }

    const { data, error } = await supabase
      .from("integration_settings")
      .insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        provider: body.provider,
        api_key: body.api_key || null,
        webhook_secret: body.webhook_secret || null,
        is_connected: body.is_connected || false,
        settings: body.settings || {},
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save integration";
    return Response.json({ error: msg }, { status: 500 });
  }
}
