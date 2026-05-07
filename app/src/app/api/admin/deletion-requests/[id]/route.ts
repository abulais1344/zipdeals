import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSessionCookieName, verifyAdminSessionCookie } from "@/lib/admin-session";

const ACTION_TO_STATUS = {
  processing: "processing",
  completed: "completed",
  rejected: "rejected",
} as const;

type AllowedAction = keyof typeof ACTION_TO_STATUS;

function isAllowedAction(action: string): action is AllowedAction {
  return action === "processing" || action === "completed" || action === "rejected";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = String(id ?? "").trim();

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();
  const reviewerNote = String(formData.get("reviewer_note") ?? "").trim();

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

  if (!requestId || !isAllowedAction(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (reviewerNote.length > 1000) {
    return NextResponse.json({ error: "Reviewer note is too long" }, { status: 400 });
  }

  const nextStatus = ACTION_TO_STATUS[action];
  const payload: {
    status: "processing" | "completed" | "rejected";
    reviewed_at?: string | null;
    reviewer_note?: string | null;
  } = {
    status: nextStatus,
    reviewer_note: reviewerNote || null,
  };

  if (nextStatus === "completed" || nextStatus === "rejected") {
    payload.reviewed_at = new Date().toISOString();
  } else {
    payload.reviewed_at = null;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("seller_data_deletion_requests")
    .update(payload)
    .eq("id", requestId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const referer = request.headers.get("referer") ?? "";
  const redirectPath = referer.includes("/admin/deletion-requests")
    ? "/admin/deletion-requests"
    : "/admin/deletion-requests";

  return NextResponse.redirect(`${origin}${redirectPath}`, 303);
}
