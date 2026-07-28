import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const totalOutstanding = invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount_cents, 0);

    const paidThisMonth = invoices.filter((i) => {
      const d = new Date(i.created_at);
      return i.status === "paid" && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const cashCollectedThisMonth = paidThisMonth.reduce((s, i) => s + i.amount_cents, 0);
    const overdueCount = invoices.filter((i) => i.status === "overdue").length;
    const sentCount = invoices.filter((i) => i.status === "sent").length;
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const draftCount = invoices.filter((i) => i.status === "draft").length;
    const totalInvoiced = invoices.reduce((s, i) => s + i.amount_cents, 0);
    const avgPaymentDays = 14;
    const collectionRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

    return Response.json({
      totalOutstanding,
      cashCollectedThisMonth,
      overdueCount,
      sentCount,
      paidCount,
      draftCount,
      totalInvoiced,
      avgPaymentDays,
      collectionRate,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch stats";
    console.error("GET /api/dashboard/stats error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
