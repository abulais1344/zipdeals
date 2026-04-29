import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
      seller_name?: string;
      phone?: string;
      city?: string;
      taluka?: string;
    };

    const username = (body.username ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const sellerName = (body.seller_name ?? "").trim();
    const phone = normalizePhone(body.phone ?? "");
    const city = (body.city ?? "").trim();
    const taluka = (body.taluka ?? "").trim();

    if (!username || !password || !sellerName || !phone || !city) {
      return Response.json({ error: "Please fill all required fields." }, { status: 400 });
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return Response.json({ error: "Username must be 3-30 chars using lowercase letters, numbers, or underscore." }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    if (phone.length < 10 || phone.length > 15) {
      return Response.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: usernameExists } = await supabase
      .from("sellers")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (usernameExists) {
      return Response.json({ error: "Username already taken." }, { status: 409 });
    }

    const { data: phoneExists } = await supabase
      .from("sellers")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (phoneExists) {
      return Response.json({ error: "Phone number already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error: insertError } = await supabase.from("sellers").insert({
      username,
      password_hash: passwordHash,
      seller_name: sellerName,
      phone,
      city,
      taluka: taluka || null,
      verified_at: null,
    });

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Registration submitted. Your account will be activated after admin approval.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
