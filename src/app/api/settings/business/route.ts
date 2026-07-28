import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    let { data, error } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newProfile, error: insertError } = await supabase
        .from("business_profiles")
        .insert({ user_id: "00000000-0000-0000-0000-000000000000" })
        .select()
        .single();

      if (insertError) throw insertError;
      return Response.json(newProfile);
    }

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch business profile";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("business_profiles")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update business profile";
    return Response.json({ error: msg }, { status: 500 });
  }
}
