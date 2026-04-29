import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSessionCookieName, verifyAdminSessionCookie } from "@/lib/admin-session";

const ALLOWED_STATUSES = new Set(["active", "rejected", "sold"]);

export async function POST(request: Request) {
  const formData = await request.formData();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminSessionCookieName}=`))
    ?.split("=")[1];
  const session = verifyAdminSessionCookie(sessionCookie);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const referer = request.headers.get("referer") ?? "";
  const fallbackPath = "/admin/pending";
  const redirectPath = referer.includes("/admin/active") ? "/admin/active" : fallbackPath;
  return NextResponse.redirect(`${origin}${redirectPath}`, 303);
}
