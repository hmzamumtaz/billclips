import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    validateEnv();
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const updates: Record<string, any> = {};
    const allowed = ["step_number", "delay_days", "subject", "body_text", "action"];
    for (const f of allowed) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    const { data, error } = await supabase.from("sequence_steps").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update step";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    validateEnv();
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("sequence_steps").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete step";
    return Response.json({ error: msg }, { status: 500 });
  }
}
