import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSessionCookieName, verifyAdminSessionCookie } from "@/lib/admin-session";

const ALLOWED_ACTIONS = new Set(["approve", "reject"]);

function getSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminSessionCookieName}=`))
    ?.split("=")[1];
  return verifyAdminSessionCookie(sessionCookie);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();

  if (!id || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (action === "approve") {
    const { error } = await supabase
      .from("sellers")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // reject — hard-delete the pending seller account
    const { error } = await supabase
      .from("sellers")
      .delete()
      .eq("id", id)
      .is("verified_at", null); // safety: only delete unverified sellers

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  return NextResponse.redirect(`${origin}/admin/sellers`, 303);
}
