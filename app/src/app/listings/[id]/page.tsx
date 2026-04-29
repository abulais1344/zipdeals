import { createClient } from "@/lib/supabase/server";
import { getSellerProfileHref } from "@/lib/seller-profile-links";
import { notFound } from "next/navigation";
import { Product } from "@/lib/types";
import Image from "next/image";
import WhatsAppButton from "../../../components/WhatsAppButton";
import ReportButton from "../../../components/ReportButton";
import ViewTracker from "../../../components/ViewTracker";
import TrackedSellerProfileLink from "@/components/TrackedSellerProfileLink";
import ListingCard from "@/components/ListingCard";
import type { Metadata } from "next";
import { MapPin, Tag, Clock, User, ShieldCheck, Star } from "lucide-react";

export const revalidate = 60;

const LISTING_DETAIL_SELECT =
  "id,seller_id,seller_profile_id,title,description,price,original_price,discount_pct,image_urls,seller_name,seller_phone,city,taluka,category,is_bulk,min_order_qty,bulk_price,status,sold_token,views_count,whatsapp_clicks,expires_at,created_at,updated_at";

const RELATED_LISTING_SELECT =
  "id,seller_id,seller_profile_id,title,description,price,original_price,discount_pct,image_urls,seller_name,seller_phone,city,taluka,category,is_bulk,min_order_qty,bulk_price,status,sold_token,views_count,whatsapp_clicks,expires_at,created_at,updated_at";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("title, description, city, category, image_urls, price, discount_pct")
    .eq("id", id)
    .eq("status", "active")
    .single();

  const p = data as Pick<Product, "title" | "description" | "city" | "category" | "image_urls" | "price" | "discount_pct"> | null;

  if (!p) return { title: "Listing not found | ZipDeals" };

  return {
    title: `${p.title} — ${p.discount_pct}% off in ${p.city} | ZipDeals`,
    description: p.description ?? `Buy ${p.title} at ₹${p.price} — clearance deal in ${p.city}`,
    openGraph: {
      images: p.image_urls?.[0] ? [p.image_urls[0]] : [],
    },
  };
}

function daysRemaining(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

function isSellerActiveToday(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() <= 24 * 60 * 60 * 1000;
}

function getUrgencyInsights(product: Product) {
  const now = Date.now();
  const createdAt = new Date(product.created_at).getTime();
  const expiresAt = new Date(product.expires_at).getTime();
  const listedToday = Number.isFinite(createdAt) && now - createdAt <= 24 * 60 * 60 * 1000;
  const limitedStock = Number.isFinite(expiresAt) && expiresAt - now <= 48 * 60 * 60 * 1000;
  const sellingFast = product.whatsapp_clicks >= 5 || (product.views_count >= 60 && product.whatsapp_clicks >= 2);

  const lines: string[] = [];
  if (limitedStock) lines.push("Only few units left");
  if (sellingFast) lines.push("Selling fast in your area");
  if (product.views_count > 0) {
    lines.push(
      listedToday
        ? `${product.views_count.toLocaleString("en-IN")} people viewed today`
        : `${product.views_count.toLocaleString("en-IN")} people viewed this deal`
    );
  }
  if (product.whatsapp_clicks > 0) {
    lines.push(`${product.whatsapp_clicks.toLocaleString("en-IN")} people contacted seller recently`);
  }

  const ctaLabel = limitedStock
    ? "Message Seller Instantly (Limited Stock)"
    : "Get Best Price on WhatsApp";

  return { lines, ctaLabel };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(LISTING_DETAIL_SELECT)
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = data as any as Product;
  const sellerProfileHref = (product.seller_profile_id
    ? `/sellers/${product.seller_profile_id}`
    : await getSellerProfileHref(product.seller_phone));

  let moreFromSellerQuery = supabase
    .from("products")
    .select(RELATED_LISTING_SELECT)
    .eq("status", "active")
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(4);

  if (product.seller_profile_id) {
    moreFromSellerQuery = moreFromSellerQuery.eq("seller_profile_id", product.seller_profile_id);
  } else {
    moreFromSellerQuery = moreFromSellerQuery.eq("seller_phone", product.seller_phone);
  }

  const { data: moreFromSellerRaw } = await moreFromSellerQuery;

  const moreFromSeller = (moreFromSellerRaw ?? []) as Product[];

  let sellerLiveCountQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (product.seller_profile_id) {
    sellerLiveCountQuery = sellerLiveCountQuery.eq("seller_profile_id", product.seller_profile_id);
  } else {
    sellerLiveCountQuery = sellerLiveCountQuery.eq("seller_phone", product.seller_phone);
  }

  const { count: sellerLiveCount } = await sellerLiveCountQuery;

  let sellerLatestQuery = supabase
    .from("products")
    .select("created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (product.seller_profile_id) {
    sellerLatestQuery = sellerLatestQuery.eq("seller_profile_id", product.seller_profile_id);
  } else {
    sellerLatestQuery = sellerLatestQuery.eq("seller_phone", product.seller_phone);
  }

  const { data: sellerLatestRaw } = await sellerLatestQuery.maybeSingle();

  const sellerActiveToday = isSellerActiveToday(sellerLatestRaw?.created_at);

  const days = daysRemaining(product.expires_at);
  const urgency = getUrgencyInsights(product);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4 pb-28 md:pb-8">
      {/* Track view server-side via client component */}
      <ViewTracker productId={product.id} />

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Image gallery */}
          <div className="relative">
            {product.discount_pct > 0 && (
              <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {product.discount_pct}% OFF
              </div>
            )}
            {product.is_bulk && (
              <div className="absolute top-3 right-3 z-10 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                BULK DEAL
              </div>
            )}
            {product.image_urls.length > 0 && (
              <div className="aspect-[4/3] relative bg-gray-100">
                <Image
                  src={product.image_urls[0]}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain"
                  priority
                />
              </div>
            )}
            {product.image_urls.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {product.image_urls.slice(1).map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={url} alt={`${product.title} ${idx + 2}`} fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 space-y-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{product.title}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
              <span className="text-sm sm:text-base text-gray-400 line-through">
                ₹{product.original_price.toLocaleString("en-IN")}
              </span>
              {product.discount_pct > 0 && (
                <span className="text-sm font-semibold text-green-600">
                  Save ₹{(product.original_price - product.price).toLocaleString("en-IN")} ({product.discount_pct}%)
                </span>
              )}
              {product.discount_pct > 0 && (
                <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  🔥 {product.discount_pct}% OFF (Hot Deal)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Compare price: Market price ₹{product.original_price.toLocaleString("en-IN")}
            </p>

            {/* Bulk info */}
            {product.is_bulk && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                <strong>Bulk:</strong>{" "}
                {product.min_order_qty && product.bulk_price ? (
                  <>{product.min_order_qty}+ units @ ₹{product.bulk_price.toLocaleString("en-IN")}/unit</>
                ) : product.min_order_qty ? (
                  <>{product.min_order_qty}+ units · Best for wholesalers</>
                ) : product.bulk_price ? (
                  <>₹{product.bulk_price.toLocaleString("en-IN")}/unit · Best for wholesalers</>
                ) : (
                  <>Best for wholesalers</>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {product.taluka ? `${product.taluka}, ${product.city}` : product.city}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={14} />
                {product.category}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {days > 0 ? `Expires in ${days} day${days !== 1 ? "s" : ""}` : "Expires today"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Description</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Seller */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Seller Profile</p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold text-sm">
                    {product.seller_name?.trim()?.charAt(0)?.toUpperCase() || <User size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {sellerProfileHref ? (
                      <TrackedSellerProfileLink
                        href={sellerProfileHref}
                        productId={product.id}
                        city={product.city}
                        source="listing_detail"
                        className="text-sm font-semibold text-gray-900 truncate hover:text-orange-600 active:text-orange-600 transition-colors inline-block"
                      >
                        {product.seller_name}
                      </TrackedSellerProfileLink>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.seller_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-green-600" />
                      Verified seller on ZipDeals
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="rounded-lg bg-white border border-gray-200 px-3 py-2">
                    <p className="text-gray-400">Location</p>
                    <p className="font-medium text-gray-700">
                      {product.taluka ? `${product.taluka}, ${product.city}` : product.city}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 px-3 py-2">
                    <p className="text-gray-400">Preferred contact</p>
                    <p className="font-medium text-gray-700">WhatsApp</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {sellerActiveToday ? "Active today" : "Recently active"}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700">
                    {(sellerLiveCount ?? 1).toLocaleString("en-IN")} listings live
                  </span>
                  {moreFromSeller.length > 0 && (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700">
                      Recently listed items
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* CTA */}
            <div className="hidden md:block space-y-2">
              {urgency.lines.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-amber-900">
                    {urgency.lines.map((line, idx) => (
                      <span key={line} className="inline-flex items-center">
                        {idx === 0 ? "⚡" : idx === 1 ? "🔥" : "👀"} {line}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <WhatsAppButton
                product={product}
                className="md:flex"
                source="listing_detail_inline"
                ctaLabel={urgency.ctaLabel}
              />
              <p className="text-[11px] text-gray-500 text-center">No signup required · chat directly on WhatsApp</p>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">Why trust this deal?</p>
                <ul className="space-y-0.5">
                  <li>• Verified seller</li>
                  <li>• Local pickup</li>
                  <li>• Direct WhatsApp (no middleman)</li>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <ReportButton productId={product.id} />
              </div>
            </div>

            {moreFromSeller.length > 0 && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-gray-700">More from this seller</h2>
                  {sellerProfileHref ? (
                    <TrackedSellerProfileLink
                      href={sellerProfileHref}
                      productId={product.id}
                      city={product.city}
                      source="listing_detail_more_from_seller"
                      className="text-xs text-orange-600 hover:text-orange-700 active:text-orange-700 font-medium"
                    >
                      View seller profile
                    </TrackedSellerProfileLink>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {moreFromSeller.map((item) => (
                    <ListingCard key={item.id} product={item} sellerProfileHref={sellerProfileHref ?? null} />
                  ))}
                </div>
              </div>
            )}

            {/* Buyer reviews */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-sm font-semibold text-gray-700">Buyer Reviews</h2>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Star size={12} />
                  {product.whatsapp_clicks > 0 ? `${product.whatsapp_clicks} contact${product.whatsapp_clicks !== 1 ? "s" : ""}` : "0 contacts"}
                </span>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                {product.whatsapp_clicks > 0
                  ? `${product.whatsapp_clicks} buyer${product.whatsapp_clicks !== 1 ? "s" : ""} contacted the seller recently. Ratings and comments will appear soon.`
                  : "No buyer has contacted yet."}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 safe-bottom-pad">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-2">
            {urgency.lines.length > 0 && (
              <div className="rounded-xl border border-white/70 bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-700">
                  {urgency.lines.slice(0, 2).map((line, idx) => (
                    <span key={line} className="inline-flex items-center">
                      {idx === 0 ? "⚡" : "🔥"} {line}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <WhatsAppButton
              product={product}
              className="shadow-lg"
              source="listing_detail_sticky_mobile"
              ctaLabel={urgency.ctaLabel}
            />
            <p className="text-[11px] text-gray-500 text-center">No signup required · chat directly on WhatsApp</p>
            <div className="rounded-xl border border-gray-200 bg-white/95 backdrop-blur px-3 py-2 text-[11px] text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">Why trust this deal?</p>
              <p>Verified seller · Local pickup · Direct WhatsApp (no middleman)</p>
            </div>
            <div className="flex items-center justify-center">
              <ReportButton productId={product.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
