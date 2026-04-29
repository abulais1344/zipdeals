import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";
import { getSellerProfileHrefMap } from "@/lib/seller-profile-links";
import TrackedSellerProfileLink from "@/components/TrackedSellerProfileLink";
import { redirect } from "next/navigation";
import AdminTopNav from "@/components/AdminTopNav";

export const dynamic = "force-dynamic";

export default async function ActiveListingsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const supabase = createAdminClient();
  const { data: activeListings, error } = await supabase
    .from("products")
    .select("id,title,price,seller_name,seller_phone,city,category,status,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  const sellerProfileHrefs = await getSellerProfileHrefMap(
    (activeListings ?? []).map((item) => item.seller_phone)
  );

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Active Listings</h1>
        <p className="text-sm text-red-600">Failed to load active listings: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AdminTopNav current="active" />
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Live listings with seller info and quick moderation actions.</p>
        </div>
      </div>

      <div className="mt-4">
        <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">
          Active: {activeListings?.length ?? 0}
        </span>
      </div>

      {activeListings && activeListings.length > 0 ? (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Listing</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Seller</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeListings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {sellerProfileHrefs[item.seller_phone] ? (
                        <TrackedSellerProfileLink
                          href={sellerProfileHrefs[item.seller_phone]}
                          productId={item.id}
                          city={item.city}
                          source="admin_active_seller"
                          className="hover:text-orange-600 active:text-orange-600 hover:underline active:underline"
                        >
                          {item.seller_name}
                        </TrackedSellerProfileLink>
                      ) : (
                        item.seller_name
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.seller_phone}</td>
                    <td className="px-4 py-3 text-gray-700">{item.city}</td>
                    <td className="px-4 py-3 text-gray-700">{item.category}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">INR {item.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/listings/${item.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          View
                        </Link>

                        <form action="/api/admin/listings/status" method="post">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="status" value="sold" />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Mark Sold
                          </button>
                        </form>

                        <form action="/api/admin/listings/status" method="post">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          No active listings found.
        </div>
      )}
    </div>
  );
}
