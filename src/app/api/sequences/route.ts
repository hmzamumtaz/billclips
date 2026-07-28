import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET() {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("sequences")
      .select("*, steps:sequence_steps(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch sequences";
    console.error("GET /api/sequences error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.name) {
      return Response.json({ error: "Sequence name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sequences")
      .insert({
        user_id: body.user_id || "00000000-0000-0000-0000-000000000000",
        name: body.name,
        description: body.description || "",
        is_active: body.is_active !== false,
        applies_to_status: body.applies_to_status || "sent",
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create sequence";
    console.error("POST /api/sequences error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
