import { getSellerSession } from "@/lib/seller-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSellerSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("seller_name, phone")
    .eq("id", session.seller_id)
    .single();

  if (error || !data) {
    return Response.json(
      {
        error: error?.message || "Seller profile not found",
      },
      { status: 404 }
    );
  }

  return Response.json({
    seller_id: session.seller_id,
    seller_name: data.seller_name,
    seller_phone: data.phone,
  });
}