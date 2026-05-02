import { getSellerSession } from "@/lib/seller-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES, CITIES, MAX_IMAGES } from "@/lib/constants";
import { buildAdminUrl, sendAdminNotificationEmail } from "@/lib/admin-notifications";

const VALID_CATEGORIES = new Set<string>(CATEGORIES);
const VALID_CITIES = new Set<string>(CITIES);

export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    title,
    description,
    price,
    original_price,
    image_urls,
    city,
    taluka,
    category,
    is_bulk,
    min_order_qty,
    bulk_price,
  } = body as Record<string, unknown>;

  // --- Validate required fields ---
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }
  if (typeof price !== "number" || price <= 0) {
    return Response.json({ error: "Valid price is required." }, { status: 400 });
  }
  if (typeof original_price !== "number" || original_price <= 0) {
    return Response.json({ error: "Valid original price is required." }, { status: 400 });
  }
  if (price >= original_price) {
    return Response.json({ error: "Sale price must be less than original price." }, { status: 400 });
  }
  if (!Array.isArray(image_urls) || image_urls.length === 0) {
    return Response.json({ error: "At least one image is required." }, { status: 400 });
  }
  if (image_urls.length > MAX_IMAGES) {
    return Response.json({ error: `Maximum ${MAX_IMAGES} images are allowed.` }, { status: 400 });
  }
  if (typeof category !== "string" || !VALID_CATEGORIES.has(category)) {
    return Response.json({ error: "Invalid category." }, { status: 400 });
  }
  if (typeof city !== "string" || !VALID_CITIES.has(city)) {
    return Response.json({ error: "Invalid city." }, { status: 400 });
  }

  // --- Fetch seller identity from DB (never trust the client) ---
  const supabase = createAdminClient();
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("seller_name, phone")
    .eq("id", session.seller_id)
    .single();

  if (sellerError || !seller) {
    return Response.json({ error: "Seller profile not found." }, { status: 404 });
  }

  const payload = {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    price,
    original_price,
    image_urls,
    seller_profile_id: session.seller_id,
    seller_name: seller.seller_name,
    seller_phone: seller.phone,
    city,
    taluka: typeof taluka === "string" && taluka ? taluka : null,
    category,
    is_bulk: is_bulk === true,
    min_order_qty:
      is_bulk === true && typeof min_order_qty === "number" ? min_order_qty : null,
    bulk_price:
      is_bulk === true && typeof bulk_price === "number" ? bulk_price : null,
    status: "pending",
  };

  let { error: insertError } = await supabase.from("products").insert(payload);

  if (insertError?.message?.includes("seller_profile_id")) {
    const { seller_profile_id, ...legacyPayload } = payload;
    const retry = await supabase.from("products").insert(legacyPayload);
    insertError = retry.error;
  }

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  await sendAdminNotificationEmail({
    subject: `New listing pending approval: ${title.trim()}`,
    html: `
      <p>A new listing is pending admin approval.</p>
      <ul>
        <li><strong>Title:</strong> ${title.trim()}</li>
        <li><strong>Seller:</strong> ${seller.seller_name}</li>
        <li><strong>Phone:</strong> ${seller.phone}</li>
        <li><strong>Category:</strong> ${category}</li>
        <li><strong>City:</strong> ${city}${typeof taluka === "string" && taluka ? `, ${taluka}` : ""}</li>
        <li><strong>Price:</strong> INR ${price}</li>
      </ul>
      <p>
        <a href="${buildAdminUrl(req, "/admin/pending")}">Open pending listings</a>
      </p>
    `,
  });

  return Response.json({ success: true }, { status: 201 });
}
