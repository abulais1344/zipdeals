import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSellerSessionCookie } from "@/lib/seller-session";
import { cookies } from "next/headers";

const SELLER_SESSION_SECRET = process.env.SELLER_SESSION_SECRET;

if (!SELLER_SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("Missing SELLER_SESSION_SECRET environment variable.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: seller, error } = await supabase
      .from("sellers")
      .select("id, seller_name, username, password_hash, verified_at")
      .eq("username", String(username).trim().toLowerCase())
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!seller) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, seller.password_hash);
    if (!passwordMatches) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (!seller.verified_at) {
      return Response.json(
        { error: "Your account is pending admin approval. Please try again later." },
        { status: 403 }
      );
    }

    // Create session cookie
    const sessionData = {
      seller_id: seller.id,
      seller_name: seller.seller_name,
      username: seller.username,
      created_at: Date.now(),
    };

    const sessionCookie = createSellerSessionCookie(sessionData, SELLER_SESSION_SECRET || "dev-secret");

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set("seller_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return Response.json({
      success: true,
      seller_id: seller.id,
      seller_name: seller.seller_name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
