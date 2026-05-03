import { getSellerSession } from "@/lib/seller-auth";
import { getSellerListingsForDashboard } from "@/lib/seller-listings";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Eye, MessageCircle, Edit, UserCircle2 } from "lucide-react";
import SellerLogoutButton from "@/components/SellerLogoutButton";
import MarkAsSoldButton from "@/components/MarkAsSoldButton";
import IdleLogout from "@/components/IdleLogout";
import DeleteListingButton from "@/components/DeleteListingButton";
import SellerRecoveryEmailCard from "@/components/seller/SellerRecoveryEmailCard";

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  views_count: number;
  whatsapp_clicks: number;
  image_url: string;
  created_at: string;
  image_urls: string[];
}

export default async function SellerDashboard() {
  const session = await getSellerSession();

  if (!session) {
    redirect("/seller/login");
  }

  const { seller, listings, errorMessage } = await getSellerListingsForDashboard(session.seller_id);

  const sellerListings = ((listings || []) as Listing[]).map((listing) => ({
    ...listing,
    image_url: listing.image_urls?.[0] ?? "",
  }));

  // Calculate stats
  const stats = {
    total: sellerListings.length,
    active: sellerListings.filter((l) => l.status === "active").length,
    pending: sellerListings.filter((l) => l.status === "pending").length,
    sold: sellerListings.filter((l) => l.status === "sold").length,
    totalViews: sellerListings.reduce((sum, l) => sum + l.views_count, 0),
    totalClicks: sellerListings.reduce((sum, l) => sum + l.whatsapp_clicks, 0),
  };

  const pendingListings = sellerListings.filter((l) => l.status === "pending");
  const highPerformingListing = sellerListings.reduce<Listing | null>((best, current) => {
    if (!best) return current;
    return current.views_count + current.whatsapp_clicks > best.views_count + best.whatsapp_clicks ? current : best;
  }, null);
  const buyerLabel = stats.totalClicks === 1 ? "buyer contacted you" : "buyers contacted you";

  return (
    <div data-seller-app-page="true" className="min-h-screen bg-gray-50">
      <IdleLogout logoutEndpoint="/api/seller/logout" redirectTo="/seller/login" />
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <LayoutDashboard size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
              <p className="text-sm text-gray-500">Welcome, {session.seller_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/seller/account"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserCircle2 size={16} />
              Account
            </Link>
            <Link
              href="/browse"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Browse deals
            </Link>
            <Link
              href="/sell/new"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              New Listing
            </Link>
            <SellerLogoutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} color="bg-green-100 text-green-700" />
          <StatCard label="Pending" value={stats.pending} color="bg-yellow-100 text-yellow-700" />
          <StatCard label="Sold" value={stats.sold} color="bg-blue-100 text-blue-700" />
          <StatCard label="Views" value={stats.totalViews} />
          <StatCard label="Clicks" value={stats.totalClicks} />
        </div>

        {/* Seller Momentum */}
        {stats.total > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/80">Seller Momentum</p>
              <p className="mt-1 text-sm sm:text-base font-semibold text-orange-900">
                Your listings got {stats.totalViews.toLocaleString("en-IN")} views 🔥
              </p>
              <p className="mt-1 text-xs text-orange-800/80">
                Strong visibility helps your listings get faster responses.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80">Buyer Interest</p>
              <p className="mt-1 text-sm sm:text-base font-semibold text-emerald-900">
                {stats.totalClicks.toLocaleString("en-IN")} {buyerLabel} 💬
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">
                {highPerformingListing
                  ? `${highPerformingListing.title} is getting the most traction right now.`
                  : "Keep your listings updated to increase buyer contacts."}
              </p>
            </div>
          </div>
        )}
        {pendingListings.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-800">
              {pendingListings.length} listing{pendingListings.length > 1 ? "s are" : " is"} pending admin approval.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Pending listings are visible in your dashboard but do not appear on homepage until approved.
            </p>
            <ul className="mt-2 text-xs text-yellow-800 list-disc list-inside">
              {pendingListings.slice(0, 3).map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>
        )}

        <SellerRecoveryEmailCard initialEmail={seller?.email ?? null} />

        <section className="mt-6 mb-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Manage your profile and privacy options</p>
              <p className="mt-1 text-sm text-gray-600">
                {seller?.email ?? "No recovery email set"} · {seller?.phone ?? "Phone unavailable"}
              </p>
            </div>
            <Link
              href="/seller/account"
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
            >
              <UserCircle2 size={16} />
              Open Account
            </Link>
          </div>
        </section>

        {/* Listings Table */}
        {sellerListings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t created any listings yet.</p>
            <Link
              href="/sell/new"
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <Eye size={16} />
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <MessageCircle size={16} />
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sellerListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {listing.image_url ? (
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={listing.image_url}
                                alt={listing.title}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                          )}
                          <Link
                            href={`/listings/${listing.id}`}
                            className="text-blue-600 hover:underline font-medium truncate max-w-xs"
                          >
                            {listing.title}
                          </Link>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ₹{listing.price.toLocaleString("en-IN")}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            listing.status === "active"
                              ? "bg-green-100 text-green-700"
                              : listing.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : listing.status === "sold"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 text-center text-gray-600">
                        {listing.views_count}
                      </td>

                      {/* Clicks */}
                      <td className="px-4 py-3 text-center text-gray-600">
                        {listing.whatsapp_clicks}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/seller/listings/${listing.id}/edit`}
                            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          <DeleteListingButton listingId={listing.id} listingTitle={listing.title} />
                          {listing.status !== "sold" && <MarkAsSoldButton listingId={listing.id} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "bg-gray-100 text-gray-700",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className={`${color} rounded-lg px-4 py-3 text-center`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
