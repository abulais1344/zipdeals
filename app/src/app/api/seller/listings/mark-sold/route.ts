import { getSellerSession } from "@/lib/seller-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = (await req.json()) as { listingId?: string };
  if (!listingId) {
    return Response.json({ error: "listingId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: listing, error: listingError } = await supabase
    .from("products")
    .select("id, status, seller_profile_id")
    .eq("id", listingId)
    .single();

  if (listingError) {
    return Response.json({ error: listingError.message }, { status: 500 });
  }

  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.seller_profile_id !== session.seller_id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (listing.status === "sold") {
    return Response.json({ success: true, message: "Listing is already sold" });
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ status: "sold" })
    .eq("id", listingId)
    .in("status", ["active", "pending"]);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}