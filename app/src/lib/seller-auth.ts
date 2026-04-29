import { cookies } from "next/headers";
import { verifySellerSessionCookie } from "@/lib/seller-session";

const SELLER_SESSION_SECRET = process.env.SELLER_SESSION_SECRET;

if (!SELLER_SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("Missing SELLER_SESSION_SECRET environment variable.");
}

export async function getSellerSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("seller_session");

  if (!session?.value) {
    return null;
  }

  try {
    const parsed = verifySellerSessionCookie(session.value, SELLER_SESSION_SECRET || "dev-secret");
    if (!parsed) return null;
    return parsed as { seller_id: string; seller_name: string; username: string };
  } catch {
    return null;
  }
}
