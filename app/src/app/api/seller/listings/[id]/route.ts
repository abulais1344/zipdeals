import { getSellerSession } from "@/lib/seller-auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyOwnership(listingId: string, sellerId: string) {
  const supabase = createAdminClient();

  const { data: listing, error: listingError } = await supabase
    .from("products")
    .select("id,title,description,price,original_price,category,city,taluka,is_bulk,min_order_qty,bulk_price,status,seller_profile_id")
    .eq("id", listingId)
    .single();

  if (listingError) {
    return { error: listingError.message, status: 500 } as const;
  }

  if (!listing) {
    return { error: "Listing not found", status: 404 } as const;
  }

  if (listing.seller_profile_id !== sellerId) {
    return { error: "Forbidden", status: 403 } as const;
  }

  return { listing } as const;
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ownership = await verifyOwnership(id, session.seller_id);
  if ("error" in ownership) {
    return Response.json({ error: ownership.error }, { status: ownership.status });
  }

  return Response.json({ listing: ownership.listing });
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ownership = await verifyOwnership(id, session.seller_id);
  if ("error" in ownership) {
    return Response.json({ error: ownership.error }, { status: ownership.status });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    price?: number;
    original_price?: number;
    category?: string;
    city?: string;
    taluka?: string | null;
    is_bulk?: boolean;
    min_order_qty?: number | null;
    bulk_price?: number | null;
  };

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const category = (body.category ?? "").trim();
  const city = (body.city ?? "").trim();
  const taluka = (body.taluka ?? "").trim();

  if (!title || !category || !city) {
    return Response.json({ error: "Title, category and city are required." }, { status: 400 });
  }

  const price = Number(body.price ?? 0);
  const originalPrice = Number(body.original_price ?? 0);

  if (!(price > 0) || !(originalPrice > 0) || !(price < originalPrice)) {
    return Response.json({ error: "Sale price must be less than original price." }, { status: 400 });
  }

  const isBulk = Boolean(body.is_bulk);
  const minOrderQty = isBulk ? (body.min_order_qty ? Number(body.min_order_qty) : null) : null;
  const bulkPrice = isBulk ? (body.bulk_price ? Number(body.bulk_price) : null) : null;

  if (minOrderQty !== null && minOrderQty <= 0) {
    return Response.json({ error: "Min order qty must be positive." }, { status: 400 });
  }

  if (bulkPrice !== null && bulkPrice <= 0) {
    return Response.json({ error: "Bulk price must be positive." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error: updateError } = await supabase
    .from("products")
    .update({
      title,
      description: description || null,
      price,
      original_price: originalPrice,
      category,
      city,
      taluka: taluka || null,
      is_bulk: isBulk,
      min_order_qty: minOrderQty,
      bulk_price: bulkPrice,
      status: "pending",
    })
    .eq("id", id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    message: "Listing updated and submitted for admin approval.",
  });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ownership = await verifyOwnership(id, session.seller_id);
  if ("error" in ownership) {
    return Response.json({ error: ownership.error }, { status: ownership.status });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, message: "Listing deleted." });
}
