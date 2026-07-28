import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerSupabaseClient();

    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id);

    if (!invoices) {
      return Response.json({
        totalOutstanding: 0,
        cashCollectedThisMonth: 0,
        overdueCount: 0,
        sentCount: 0,
        paidCount: 0,
        draftCount: 0,
        totalInvoiced: 0,
        avgPaymentDays: 0,
        collectionRate: 0,
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const totalOutstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + i.amount_cents, 0);

    const cashCollectedThisMonth = invoices
      .filter((i) => i.status === "paid" && i.updated_at >= startOfMonth)
      .reduce((sum, i) => sum + i.amount_cents, 0);

    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount_cents, 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

    return Response.json({
      totalOutstanding,
      cashCollectedThisMonth,
      overdueCount: invoices.filter((i) => i.status === "overdue").length,
      sentCount: invoices.filter((i) => i.status === "sent").length,
      paidCount,
      draftCount: invoices.filter((i) => i.status === "draft").length,
      totalInvoiced,
      avgPaymentDays: 0,
      collectionRate,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch dashboard stats";
    return Response.json({ error: msg }, { status: 500 });
  }
}
