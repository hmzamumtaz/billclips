import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("sequences")
      .select("*, steps:sequence_steps(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json({ error: "Sequence not found" }, { status: 404 });
      }
      throw error;
    }

    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch sequence";
    console.error("GET /api/sequences/[id] error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("sequences")
      .update({
        name: body.name,
        description: body.description,
        is_active: body.is_active,
        applies_to_status: body.applies_to_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update sequence";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("sequences").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete sequence";
    return Response.json({ error: msg }, { status: 500 });
  }
}
