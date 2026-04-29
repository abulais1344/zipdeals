import { cookies } from "next/headers";
import { adminSessionCookieName, verifyAdminSessionCookie } from "@/lib/admin-session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionCookie(cookieStore.get(adminSessionCookieName)?.value);
}
