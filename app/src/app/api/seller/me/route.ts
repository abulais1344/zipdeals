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
    .select("seller_name, phone, email")
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
    email: data.email,
  });
}

export async function PATCH(req: Request) {
  const session = await getSellerSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email) {
      return Response.json({ error: "Email is required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from("sellers")
      .select("id")
      .ilike("email", email)
      .neq("id", session.seller_id)
      .maybeSingle();

    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return Response.json({ error: "This email is already used by another seller." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("sellers")
      .update({ email })
      .eq("id", session.seller_id)
      .select("seller_name, phone, email")
      .single();

    if (error || !data) {
      return Response.json({ error: error?.message || "Failed to update email." }, { status: 500 });
    }

    return Response.json({
      success: true,
      seller_id: session.seller_id,
      seller_name: data.seller_name,
      seller_phone: data.phone,
      email: data.email,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update email.";
    return Response.json({ error: message }, { status: 500 });
  }
}