import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSessionCookieName, createAdminSessionCookie } from "@/lib/admin-session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  if (!loginId || !password) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing`, 303);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("verify_admin_credentials", {
    p_login_id: loginId,
    p_password: password,
  });

  if (error || !Array.isArray(data) || data.length === 0) {
    return NextResponse.redirect(`${origin}/admin/login?error=invalid`, 303);
  }

  const response = NextResponse.redirect(`${origin}/admin/pending`, 303);
  const cookie = createAdminSessionCookie(loginId);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookie.maxAge,
  });

  return response;
}
