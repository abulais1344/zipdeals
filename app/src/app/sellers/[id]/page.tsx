import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, ShieldCheck, Package, ArrowLeft } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { getSellerProfileHrefMap } from "@/lib/seller-profile-links";
import { getSellerActivePublicListings } from "@/lib/seller-listings";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SellerPublicProfilePage({ params }: Props) {
  const { id } = await params;
  const { seller, listings, errorMessage } = await getSellerActivePublicListings(id);

  if (!seller) {
    notFound();
  }

  const sellerProfileHrefs = await getSellerProfileHrefMap(
    listings.map((product) => product.seller_phone)
  );

  const averageRating: number = 0;
  const reviewsCount: number = 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />
            Back to browse
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Seller Profile</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{seller.seller_name}</h1>
              <p className="mt-1 text-sm text-gray-500 inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-600" />
                Verified seller on ZipDeals
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 min-w-[220px]">
              <p className="text-xs text-gray-500 mb-1">Ratings</p>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <p className="text-sm font-semibold text-gray-900">{averageRating.toFixed(1)} / 5</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{reviewsCount} review{reviewsCount === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Listings</h2>
            <span className="text-sm text-gray-500">{listings.length} item{listings.length === 1 ? "" : "s"}</span>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((product) => (
                <ListingCard key={product.id} product={product} sellerProfileHref={sellerProfileHrefs[product.seller_phone] ?? null} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 mb-3">
                <Package size={18} />
              </div>
              <p className="text-sm text-gray-600">No active listings available for this seller right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
