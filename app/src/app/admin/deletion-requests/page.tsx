import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";
import AdminTopNav from "@/components/AdminTopNav";

export const dynamic = "force-dynamic";

type RequestStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";

interface SellerRef {
  seller_name: string;
  username: string;
  phone: string;
  email: string | null;
}

interface DeletionRequestRow {
  id: string;
  seller_id: string;
  status: RequestStatus;
  reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewer_note: string | null;
  sellers: SellerRef | SellerRef[] | null;
}

function getSellerRef(input: SellerRef | SellerRef[] | null): SellerRef | null {
  if (!input) return null;
  return Array.isArray(input) ? input[0] ?? null : input;
}

function isMissingDeletionTable(message: string | undefined): boolean {
  return (message ?? "").includes("seller_data_deletion_requests");
}

function statusClasses(status: RequestStatus): string {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "processing") return "bg-blue-100 text-blue-800";
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

export default async function AdminDeletionRequestsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const supabase = createAdminClient();

  const [{ data: openRequests, error: openError }, { data: recentResolved, error: resolvedError }] = await Promise.all([
    supabase
      .from("seller_data_deletion_requests")
      .select("id,seller_id,status,reason,requested_at,reviewed_at,reviewer_note,sellers:seller_id(seller_name,username,phone,email)")
      .in("status", ["pending", "processing"])
      .order("requested_at", { ascending: false }),
    supabase
      .from("seller_data_deletion_requests")
      .select("id,seller_id,status,reason,requested_at,reviewed_at,reviewer_note,sellers:seller_id(seller_name,username,phone,email)")
      .in("status", ["completed", "rejected", "cancelled"])
      .order("requested_at", { ascending: false })
      .limit(30),
  ]);

  const deletionTableMissing =
    isMissingDeletionTable(openError?.message) || isMissingDeletionTable(resolvedError?.message);

  const openRows = deletionTableMissing ? [] : ((openRequests ?? []) as DeletionRequestRow[]);
  const resolvedRows = deletionTableMissing ? [] : ((recentResolved ?? []) as DeletionRequestRow[]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AdminTopNav current="deletion-requests" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Deletion Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review seller account/data deletion requests and mark progress.
        </p>
      </div>

      {deletionTableMissing && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Deletion request table is not initialized yet. Run the migration
          <span className="font-semibold"> add_seller_data_deletion_requests.sql</span> and refresh this page.
        </div>
      )}

      {!deletionTableMissing && (
        <>
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Open Requests</h2>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                {openRows.length}
              </span>
            </div>

            {openRows.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                No pending or processing deletion requests.
              </div>
            ) : (
              <div className="space-y-4">
                {openRows.map((item) => {
                  const seller = getSellerRef(item.sellers);
                  return (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {seller?.seller_name ?? "Unknown seller"}
                          </p>
                          <p className="text-xs text-gray-600">
                            @{seller?.username ?? "unknown"} · {seller?.phone ?? "No phone"}
                          </p>
                          <p className="text-xs text-gray-500">{seller?.email ?? "No email"}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Requested: {new Date(item.requested_at).toLocaleString("en-IN")}
                      </div>

                      {item.reason && (
                        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{item.reason}</p>
                      )}

                      <form action={`/api/admin/deletion-requests/${item.id}`} method="post" className="mt-4 space-y-3">
                        <input
                          type="text"
                          name="reviewer_note"
                          placeholder="Optional review note"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          maxLength={1000}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="submit"
                            name="action"
                            value="processing"
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            Mark Processing
                          </button>
                          <button
                            type="submit"
                            name="action"
                            value="completed"
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                          >
                            Mark Completed
                          </button>
                          <button
                            type="submit"
                            name="action"
                            value="rejected"
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                          >
                            Mark Rejected
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-10">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Recent Resolved</h2>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {resolvedRows.length}
              </span>
            </div>

            {resolvedRows.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                No resolved deletion requests yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Seller</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Requested</th>
                      <th className="px-4 py-3">Reviewed</th>
                      <th className="px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resolvedRows.map((item) => {
                      const seller = getSellerRef(item.sellers);
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-gray-800">
                            {seller?.seller_name ?? "Unknown"}
                            <div className="text-xs text-gray-500">@{seller?.username ?? "unknown"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{new Date(item.requested_at).toLocaleDateString("en-IN")}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString("en-IN") : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.reviewer_note || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
