import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminTopNav from "@/components/AdminTopNav";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const supabase = createAdminClient();

  const [{ data: pendingSellers, error: pendingError }, { data: approvedSellers, error: approvedError }] =
    await Promise.all([
      supabase
        .from("sellers")
        .select("id, seller_name, username, phone, city, taluka, created_at")
        .is("verified_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("sellers")
        .select("id, seller_name, username, phone, city, taluka, verified_at, active_listings, total_listings")
        .not("verified_at", "is", null)
        .order("verified_at", { ascending: false })
        .limit(50),
    ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AdminTopNav current="sellers" />
      {/* Header */}
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
          <p className="text-sm text-gray-500 mt-1">Approve or reject pending seller registrations.</p>
        </div>
      </div>

      {/* Pending Sellers */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
            {pendingSellers?.length ?? 0}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">These sellers registered but cannot log in until approved.</p>

        {pendingError && (
          <p className="text-sm text-red-600">Error loading pending sellers: {pendingError.message}</p>
        )}

        {!pendingError && (!pendingSellers || pendingSellers.length === 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No pending seller registrations.
          </div>
        )}

        {pendingSellers && pendingSellers.length > 0 && (
          <div className="space-y-3">
            {pendingSellers.map((seller) => (
              <div
                key={seller.id}
                className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{seller.seller_name}</p>
                    <p className="text-xs text-gray-600">
                      @{seller.username} &middot; {seller.phone}
                    </p>
                    <p className="text-xs text-gray-500">
                      {seller.city}{seller.taluka ? `, ${seller.taluka}` : ""}
                    </p>
                    <p className="text-xs text-gray-400">
                      Registered{" "}
                      {new Date(seller.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <form action={`/api/admin/sellers/${seller.id}`} method="post">
                      <input type="hidden" name="action" value="approve" />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={`/api/admin/sellers/${seller.id}`} method="post">
                      <input type="hidden" name="action" value="reject" />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved Sellers */}
      <section className="mt-10">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Approved Sellers</h2>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            {approvedSellers?.length ?? 0}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Recently approved (last 50).</p>

        {approvedError && (
          <p className="text-sm text-red-600">Error loading sellers: {approvedError.message}</p>
        )}

        {!approvedError && (!approvedSellers || approvedSellers.length === 0) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No approved sellers yet.
          </div>
        )}

        {approvedSellers && approvedSellers.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Listings</th>
                  <th className="px-4 py-3">Approved</th>
                  <th className="px-4 py-3">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {approvedSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{seller.seller_name}</td>
                    <td className="px-4 py-3 text-gray-600">@{seller.username}</td>
                    <td className="px-4 py-3 text-gray-600">{seller.phone}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {seller.city}{seller.taluka ? `, ${seller.taluka}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-green-700 font-medium">{seller.active_listings ?? 0}</span>
                      <span className="text-gray-400"> / {seller.total_listings ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {seller.verified_at
                        ? new Date(seller.verified_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/seller/${seller.username}`}
                        className="text-orange-600 hover:underline text-xs"
                        target="_blank"
                      >
                        View ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
