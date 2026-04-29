import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const checkedAt = new Date().toISOString();

  // Check column existence by selecting only the target column.
  const { error } = await supabase
    .from("products")
    .select("seller_profile_id", { head: true, count: "exact" })
    .limit(1);

  if (!error) {
    return Response.json({
      ok: true,
      checked_at: checkedAt,
      products_seller_profile_id_exists: true,
      message: "seller_profile_id column exists on public.products",
    });
  }

  const missingColumn =
    error.message.includes("seller_profile_id") &&
    (error.message.includes("schema cache") || error.message.includes("column"));

  if (missingColumn) {
    return Response.json({
      ok: true,
      checked_at: checkedAt,
      products_seller_profile_id_exists: false,
      message:
        "seller_profile_id column is missing in live schema cache. Run seller_dashboard.sql migration.",
      details: error.message,
    });
  }

  return Response.json(
    {
      ok: false,
      checked_at: checkedAt,
      products_seller_profile_id_exists: null,
      message: "Unable to verify schema right now.",
      details: error.message,
    },
    { status: 500 }
  );
}
