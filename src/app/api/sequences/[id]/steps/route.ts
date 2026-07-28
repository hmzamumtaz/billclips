import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    validateEnv();
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.step_number || !body.delay_days === undefined || !body.subject || !body.body_text) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sequence_steps")
      .insert({
        sequence_id: id,
        step_number: body.step_number,
        delay_days: body.delay_days,
        subject: body.subject,
        body_text: body.body_text,
        action: body.action || "send_email",
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create step";
    return Response.json({ error: msg }, { status: 500 });
  }
}
