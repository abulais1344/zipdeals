import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSellerProfileHrefMap } from "@/lib/seller-profile-links";
import { Product } from "@/lib/types";
import ListingCard from "../components/ListingCard";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { ArrowRight, Zap, ShieldCheck, MessageCircle } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ZipDeals | Local Clearance Deals & Bulk Stock",
  description:
    "Discover local clearance deals and bulk stock from verified sellers. Contact directly on WhatsApp and move inventory faster.",
};

const HOME_LISTING_SELECT =
  "id,title,price,original_price,discount_pct,image_urls,seller_name,seller_phone,city,taluka,category,is_bulk,min_order_qty,bulk_price,views_count,whatsapp_clicks,expires_at,created_at,status";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: latestDeals } = await supabase
    .from("products")
    .select(HOME_LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: bulkDeals } = await supabase
    .from("products")
    .select(HOME_LISTING_SELECT)
    .eq("status", "active")
    .eq("is_bulk", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const { count: activeListingsCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const latest = (latestDeals ?? []) as Product[];
  const bulk = (bulkDeals ?? []) as Product[];
  const liveListings = activeListingsCount ?? 0;
  const sellerProfileHrefs = await getSellerProfileHrefMap([
    ...latest.map((product) => product.seller_phone),
    ...bulk.map((product) => product.seller_phone),
  ]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ZipDeals",
    description:
      "Local clearance deals and bulk stock listings with direct buyer-seller contact on WhatsApp.",
    potentialAction: {
      "@type": "SearchAction",
      target: "/browse?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-12 sm:py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-4">
            <Zap size={14} />
            Real sellers. Real discounts. Near you.
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4">
            Local Clearance Deals & Bulk Stock
          </h1>
          <p className="text-base sm:text-lg text-orange-100 mb-6 sm:mb-8">
            Browse genuine clearance inventory from local sellers. Contact them directly on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse" className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors text-sm">
                Find Deals Near You
            </Link>
            <Link href="/sell" className="px-6 py-3 bg-orange-700/40 hover:bg-orange-700/60 text-white font-semibold rounded-xl transition-colors text-sm border border-white/20">
                List your clearance stock
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-orange-100">
            <span className="rounded-full border border-white/25 px-3 py-1">No signup needed for buyers</span>
            <span className="rounded-full border border-white/25 px-3 py-1">Direct WhatsApp contact</span>
            <span className="rounded-full border border-white/25 px-3 py-1">Admin-reviewed listings</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pt-6 pb-2 sm:pt-8 sm:pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <div className="text-lg font-extrabold text-gray-900">{liveListings.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-gray-500">Live listings</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <div className="text-lg font-extrabold text-gray-900">{CITIES.length}</div>
            <div className="text-[11px] text-gray-500">Cities supported</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <div className="text-lg font-extrabold text-gray-900">{CATEGORIES.length}</div>
            <div className="text-[11px] text-gray-500">Categories</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <div className="text-lg font-extrabold text-gray-900">24h</div>
            <div className="text-[11px] text-gray-500">Average moderation</div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: <Zap size={24} />, title: "Sellers list deals", desc: "Verify by phone, add photos, set your price." },
            { icon: <MessageCircle size={24} />, title: "Buyers browse & contact", desc: "Filter by city/category and message on WhatsApp." },
            { icon: <ShieldCheck size={24} />, title: "Admin-verified listings", desc: "Every listing is manually reviewed before going live." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10 sm:pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Latest deals</h2>
            <Link href="/browse" className="text-sm text-orange-500 hover:text-orange-700 flex items-center gap-1 font-medium">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {latest.map((p) => (
              <ListingCard key={p.id} product={p} sellerProfileHref={sellerProfileHrefs[p.seller_phone] ?? null} />
            ))}
          </div>
        </section>
      )}

      {bulk.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10 sm:pb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Bulk & wholesale lots</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {bulk.map((p) => (
              <ListingCard key={p.id} product={p} sellerProfileHref={sellerProfileHrefs[p.seller_phone] ?? null} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border-t border-gray-100 py-10 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">Browse by city</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CITIES.map((city) => (
              <Link key={city} href={`/browse?city=${encodeURIComponent(city)}`} className="px-4 py-2 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 text-sm text-gray-700 hover:text-orange-700 rounded-full transition-colors">
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">Browse by category</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link key={cat} href={`/browse?category=${encodeURIComponent(cat)}`} className="px-4 py-2 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 text-sm text-gray-700 hover:text-orange-700 rounded-full transition-colors">
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 text-white py-10 sm:py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Got dead stock? Move it fast.</h2>
          <p className="text-gray-400 mb-6 text-sm">List your clearance inventory in minutes. Free for Phase 1.</p>
          <Link href="/sell" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors">
            For sellers: Start listing for free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
