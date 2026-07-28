import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (error) throw error;
    return Response.json(user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch profile";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: body.full_name,
        business_name: body.business_name,
        timezone: body.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return Response.json({ error: msg }, { status: 500 });
  }
}
