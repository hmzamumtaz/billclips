import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    validateEnv();
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return Response.json({ error: "Invoice not found" }, { status: 404 });
      }
      throw error;
    }

    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch invoice";
    console.error("GET /api/invoices/[id] error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    validateEnv();
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const allowedFields = ["client_name", "client_email", "client_phone", "client_address", "amount_cents", "currency", "due_date", "issue_date", "status", "notes", "sequence_id"];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("invoices").update(updates).eq("id", id).select().single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update invoice";
    console.error("PATCH /api/invoices/[id] error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    validateEnv();
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete invoice";
    console.error("DELETE /api/invoices/[id] error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
