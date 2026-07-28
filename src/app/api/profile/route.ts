import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json({
          id: user.id,
          email: user.email,
          full_name: "",
          business_name: "",
          avatar_url: null,
          timezone: "UTC",
          plan: "free",
        });
      }
      throw error;
    }
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch profile";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const updates: Record<string, unknown> = {
      email: user.email,
      updated_at: new Date().toISOString(),
    };
    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.business_name !== undefined) updates.business_name = body.business_name;
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

    const { data, error } = await supabase
      .from("users")
      .upsert({ id: user.id, ...updates })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return Response.json({ error: msg }, { status: 500 });
  }
}
