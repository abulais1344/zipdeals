import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://zipdeals.in";

  const supabase = await createClient();
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, updated_at, city, category")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const products = rawProducts as { id: string; updated_at: string; city: string; category: string }[] | null;

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${baseUrl}/listings/${p.id}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const activeCities = Array.from(new Set((products ?? []).map((p) => p.city).filter(Boolean))).sort();
  const activeCategories = Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean))).sort();

  const cityUrls: MetadataRoute.Sitemap = activeCities.map((city) => ({
    url: `${baseUrl}/browse?city=${encodeURIComponent(city)}`,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = activeCategories.map((cat) => ({
    url: `${baseUrl}/browse?category=${encodeURIComponent(cat)}`,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    { url: baseUrl, changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/browse`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/sell/new`, changeFrequency: "monthly", priority: 0.6 },
    ...cityUrls,
    ...categoryUrls,
    ...productUrls,
  ];
}
