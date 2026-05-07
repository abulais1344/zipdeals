import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";
import { getSellerProfileHrefMap } from "@/lib/seller-profile-links";
import TrackedSellerProfileLink from "@/components/TrackedSellerProfileLink";
import ListingImageGallery from "@/components/ListingImageGallery";
import { redirect } from "next/navigation";
import AdminTopNav from "@/components/AdminTopNav";

export const dynamic = "force-dynamic";

export default async function PendingListingsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const supabase = createAdminClient();
  const { data: pendingListings, error } = await supabase
    .from("products")
    .select("id,title,description,price,original_price,image_urls,seller_name,seller_phone,city,category,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const sellerProfileHrefs = await getSellerProfileHrefMap(
    (pendingListings ?? []).map((item) => item.seller_phone)
  );

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Pending Listings</h1>
        <p className="text-sm text-red-600">Failed to load pending listings: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AdminTopNav current="pending" />
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve/reject listings quickly.</p>
        </div>
      </div>

      <section className="mt-6">
        <p className="text-xs text-gray-500 mt-1">
          Total pending: <span className="font-semibold text-yellow-700">{pendingListings?.length ?? 0}</span>
        </p>

      {pendingListings && pendingListings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {pendingListings.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <ListingImageGallery
                    imageUrls={item.image_urls ?? []}
                    title={item.title}
                    mainWrapperClassName="relative w-full h-36 bg-gray-100"
                    thumbnailsWrapperClassName="flex gap-2 p-2 overflow-x-auto"
                    thumbnailClassName="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden border transition-colors"
                    sizes="(max-width: 768px) 100vw, 140px"
                    imageClassName="object-cover"
                    enableLightbox
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description || "No description"}</p>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div><span className="font-medium">Price:</span> INR {item.price}</div>
                    <div><span className="font-medium">Original:</span> INR {item.original_price}</div>
                    <div><span className="font-medium">City:</span> {item.city}</div>
                    <div><span className="font-medium">Category:</span> {item.category}</div>
                    <div>
                      <span className="font-medium">Seller:</span>{" "}
                      {sellerProfileHrefs[item.seller_phone] ? (
                        <TrackedSellerProfileLink
                          href={sellerProfileHrefs[item.seller_phone]}
                          productId={item.id}
                          city={item.city}
                          source="admin_pending_seller"
                          className="hover:text-orange-600 active:text-orange-600 hover:underline active:underline"
                        >
                          {item.seller_name}
                        </TrackedSellerProfileLink>
                      ) : (
                        item.seller_name
                      )}
                    </div>
                    <div><span className="font-medium">Phone:</span> {item.seller_phone}</div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <form action="/api/admin/listings/status" method="post">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="status" value="active" />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </form>

                    <form action="/api/admin/listings/status" method="post">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          No pending listings right now.
        </div>
      )}

      </section>
    </div>
  );
}
