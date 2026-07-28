import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("q");
    const sort = searchParams.get("sort") || "created_at";
    const dir = searchParams.get("dir") || "desc";

    let query = supabase.from("invoices").select("*");

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    }

    const { data, error } = await query.order(sort, { ascending: dir === "asc" });

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch invoices";
    console.error("GET /api/invoices error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnv();
    const supabase = createServerSupabaseClient();

    const body = await request.json();

    if (!body.client_name || !body.client_email || !body.amount_cents || !body.due_date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        invoice_number: invoiceNumber,
        client_name: body.client_name,
        client_email: body.client_email,
        client_phone: body.client_phone || "",
        client_address: body.client_address || "",
        amount_cents: Math.round(body.amount_cents),
        currency: body.currency || "USD",
        due_date: body.due_date,
        issue_date: body.issue_date || new Date().toISOString().split("T")[0],
        status: body.status || "sent",
        notes: body.notes || "",
        sequence_id: body.sequence_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create invoice";
    console.error("POST /api/invoices error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
