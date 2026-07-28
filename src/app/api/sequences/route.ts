import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("sequences")
      .select("*, steps:sequence_steps(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch sequences";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.name) {
      return Response.json({ error: "Sequence name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sequences")
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || "",
        is_active: body.is_active ?? true,
        applies_to_status: body.applies_to_status || "overdue",
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create sequence";
    return Response.json({ error: msg }, { status: 500 });
  }
}
