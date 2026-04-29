import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CITIES, TALUKAS } from "@/lib/constants";
import { getSellerProfileHrefMap } from "@/lib/seller-profile-links";
import { Product } from "@/lib/types";
import ListingCard from "../../components/ListingCard";
import FilterBar from "../../components/FilterBar";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  searchParams: Promise<{ city?: string; category?: string; taluka?: string; minPrice?: string; maxPrice?: string; q?: string; sort?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const city = params.city ?? "India";
  const category = params.category ?? "all categories";
  const query = params.q ?? "";
  return {
    title: `${query ? `"${query}" - ` : ""}Clearance deals on ${category} in ${city} | ZipDeals`,
    description: `Browse genuine clearance deals and bulk stock on ${category} near ${city}. Contact sellers directly on WhatsApp.`,
  };
}

const PAGE_SIZE = 24;
const BROWSE_LISTING_SELECT =
  "id,seller_profile_id,title,description,price,original_price,discount_pct,image_urls,seller_name,seller_phone,city,taluka,category,is_bulk,min_order_qty,bulk_price,status,views_count,whatsapp_clicks,expires_at,created_at,updated_at,sold_token,seller_id";

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const city = params.city && CITIES.includes(params.city as typeof CITIES[number]) ? params.city : null;
  const category = params.category && CATEGORIES.includes(params.category as typeof CATEGORIES[number]) ? params.category : null;
  const taluka = params.taluka ? (() => {
    const talukasList = city && (TALUKAS as Record<string, string[]>)[city] ? (TALUKAS as Record<string, string[]>)[city] : [];
    return talukasList.includes(params.taluka!) ? params.taluka : null;
  })() : null;
  const minPrice = params.minPrice ? Math.max(0, parseInt(params.minPrice)) : null;
  const maxPrice = params.maxPrice ? Math.max(0, parseInt(params.maxPrice)) : null;
  const searchQuery = params.q ? decodeURIComponent(params.q).trim() : null;
  const sortBy = params.sort && ["newest", "cheapest", "expensive", "discount"].includes(params.sort) ? params.sort : "newest";
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(BROWSE_LISTING_SELECT, { count: "exact" })
    .eq("status", "active")
    .range(from, to);

  if (city) query = query.eq("city", city);
  if (category) query = query.eq("category", category);
  if (taluka) query = query.eq("taluka", taluka);
  if (minPrice !== null) query = query.gte("price", minPrice);
  if (maxPrice !== null) query = query.lte("price", maxPrice);

  // Full-text search on title and description
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  // Sorting
  if (sortBy === "cheapest") {
    query = query.order("price", { ascending: true });
  } else if (sortBy === "expensive") {
    query = query.order("price", { ascending: false });
  } else if (sortBy === "discount") {
    query = query.order("discount_pct", { ascending: false });
  } else {
    // newest (default)
    query = query.order("created_at", { ascending: false });
  }

  const { data: rawProducts, count } = await query;
  const products = rawProducts as Product[] | null;
  const sellerProfileHrefs = await getSellerProfileHrefMap(
    (products ?? []).map((product) => product.seller_phone)
  );
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Build description
  const parts = [];
  if (searchQuery) parts.push(`"${searchQuery}"`);
  if (city) parts.push(`in ${city}`);
  if (category) parts.push(`${category}`);
  if (taluka) parts.push(`(${taluka})`);
  if (minPrice !== null || maxPrice !== null) {
    const priceRange = minPrice !== null && maxPrice !== null 
      ? `₹${minPrice.toLocaleString("en-IN")}-${maxPrice.toLocaleString("en-IN")}`
      : minPrice !== null
      ? `₹${minPrice.toLocaleString("en-IN")}+`
      : `up to ₹${maxPrice?.toLocaleString("en-IN")}`;
    parts.push(priceRange);
  }
  const description = parts.length > 0 ? parts.join(" • ") : "All listings";

  // Sort label
  const sortLabels: Record<string, string> = {
    newest: "Newest first",
    cheapest: "Cheapest first",
    expensive: "Most expensive",
    discount: "Highest discount",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Browse Deals</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {count !== null ? (
                  <>{count} active listing{count !== 1 ? "s" : ""}{description !== "All listings" ? ` · ${description}` : ""}</>
                ) : "Loading..."}
              </p>
            </div>
            {sortBy && sortBy !== "newest" && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <span>{sortLabels[sortBy]}</span>
              </div>
            )}
          </div>

          <div className="mt-5">
            <FilterBar
              selectedCity={city}
              selectedCategory={category}
              selectedTaluka={taluka}
              minPrice={minPrice}
              maxPrice={maxPrice}
              searchQuery={searchQuery}
              sortBy={sortBy}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p) => (
                <ListingCard key={p.id} product={p} sellerProfileHref={sellerProfileHrefs[p.seller_phone] ?? null} />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const sp = new URLSearchParams();
                  if (searchQuery) sp.set("q", searchQuery);
                  if (city) sp.set("city", city);
                  if (category) sp.set("category", category);
                  if (taluka) sp.set("taluka", taluka);
                  if (minPrice !== null) sp.set("minPrice", String(minPrice));
                  if (maxPrice !== null) sp.set("maxPrice", String(maxPrice));
                  if (sortBy !== "newest") sp.set("sort", sortBy);
                  sp.set("page", String(p));
                  return (
                    <a
                      key={p}
                      href={`/browse?${sp.toString()}`}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        p === page
                          ? "bg-orange-500 text-white border-orange-500"
                          : "border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </a>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No listings found</h3>
            <p className="text-sm text-gray-400 max-w-xs">Try adjusting your search or filters to find what you&apos;re looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
