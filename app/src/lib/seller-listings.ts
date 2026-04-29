import { createAdminClient } from "@/lib/supabase/admin";
import { Product } from "@/lib/types";

export interface SellerProfileSummary {
  id: string;
  seller_name: string;
  phone: string;
  email: string | null;
}

export interface SellerDashboardListing {
  id: string;
  title: string;
  price: number;
  status: string;
  views_count: number;
  whatsapp_clicks: number;
  created_at: string;
  image_urls: string[];
}

function usesMissingSellerProfileIdColumn(errorMessage: string | undefined): boolean {
  return (errorMessage ?? "").includes("seller_profile_id");
}

async function getSellerById(sellerId: string): Promise<SellerProfileSummary | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("id, seller_name, phone, email")
    .eq("id", sellerId)
    .single();

  if (error || !data) return null;
  return data as SellerProfileSummary;
}

export async function getSellerListingsForDashboard(sellerId: string): Promise<{
  seller: SellerProfileSummary | null;
  listings: SellerDashboardListing[];
  errorMessage: string | null;
}> {
  const seller = await getSellerById(sellerId);
  if (!seller) {
    return { seller: null, listings: [], errorMessage: "Seller profile not found" };
  }

  const supabase = createAdminClient();

  let { data: listings, error } = await supabase
    .from("products")
    .select("id,title,price,status,views_count,whatsapp_clicks,image_urls,created_at")
    .eq("seller_profile_id", sellerId)
    .order("created_at", { ascending: false });

  if (usesMissingSellerProfileIdColumn(error?.message)) {
    const fallback = await supabase
      .from("products")
      .select("id,title,price,status,views_count,whatsapp_clicks,image_urls,created_at")
      .eq("seller_phone", seller.phone)
      .order("created_at", { ascending: false });
    listings = fallback.data;
    error = fallback.error;
  }

  return {
    seller,
    listings: (listings ?? []) as SellerDashboardListing[],
    errorMessage: error?.message ?? null,
  };
}

export async function getSellerActivePublicListings(sellerId: string): Promise<{
  seller: SellerProfileSummary | null;
  listings: Product[];
  errorMessage: string | null;
}> {
  const seller = await getSellerById(sellerId);
  if (!seller) {
    return { seller: null, listings: [], errorMessage: "Seller profile not found" };
  }

  const supabase = createAdminClient();

  let { data: listings, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_profile_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (usesMissingSellerProfileIdColumn(error?.message)) {
    const fallback = await supabase
      .from("products")
      .select("*")
      .eq("seller_phone", seller.phone)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    listings = fallback.data;
    error = fallback.error;
  }

  return {
    seller,
    listings: (listings ?? []) as Product[],
    errorMessage: error?.message ?? null,
  };
}
