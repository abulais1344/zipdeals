import { redirect } from "next/navigation";
import AdminTopNav from "@/components/AdminTopNav";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function checkSchema() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const supabase = createAdminClient();
  const checkedAt = new Date().toISOString();
  const { error } = await supabase
    .from("products")
    .select("seller_profile_id", { head: true, count: "exact" })
    .limit(1);

  if (!error) {
    return {
      ok: true,
      checked_at: checkedAt,
      products_seller_profile_id_exists: true,
      message: "seller_profile_id column exists on public.products",
    };
  }

  const missingColumn =
    error.message.includes("seller_profile_id") &&
    (error.message.includes("schema cache") || error.message.includes("column"));

  if (missingColumn) {
    return {
      ok: true,
      checked_at: checkedAt,
      products_seller_profile_id_exists: false,
      message:
        "seller_profile_id column is missing in live schema cache. Run seller_dashboard.sql migration.",
      details: error.message,
    };
  }

  return {
    ok: false,
    checked_at: checkedAt,
    products_seller_profile_id_exists: null,
    message: "Unable to verify schema right now.",
    details: error.message,
  };
}

export default async function AdminSchemaPage() {
  const result = await checkSchema();

  const statusLabel =
    result.products_seller_profile_id_exists === true
      ? "PASS"
      : result.products_seller_profile_id_exists === false
      ? "FAIL"
      : "UNKNOWN";

  const statusClass =
    result.products_seller_profile_id_exists === true
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : result.products_seller_profile_id_exists === false
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <AdminTopNav current="schema" />

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Schema Readiness Check</h1>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Verifies whether public.products has seller_profile_id in the live Supabase schema cache.
        </p>

        <div className="mt-5 rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-700">
            <span className="font-semibold">Column present:</span>{" "}
            {result.products_seller_profile_id_exists === true
              ? "Yes"
              : result.products_seller_profile_id_exists === false
              ? "No"
              : "Unknown"}
          </div>
          <div className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">Checked at:</span> {result.checked_at}
          </div>
          <div className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">Message:</span> {result.message}
          </div>
          {result.details ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
              {result.details}
            </pre>
          ) : null}
        </div>

        <div className="mt-4">
          <a
            href="/admin/schema"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Re-check
          </a>
        </div>
      </div>
    </div>
  );
}
