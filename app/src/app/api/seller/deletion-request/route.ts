import { getSellerSession } from "@/lib/seller-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface DeletionRequestPayload {
  reason?: string;
}

function isMissingDeletionTable(message: string | undefined): boolean {
  return (message ?? "").includes("seller_data_deletion_requests");
}

export async function GET() {
  const session = await getSellerSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seller_data_deletion_requests")
    .select("id, status, reason, requested_at, reviewed_at, reviewer_note")
    .eq("seller_id", session.seller_id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingDeletionTable(error.message)) {
      return Response.json({ error: "Deletion requests are not initialized." }, { status: 503 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ request: data ?? null });
}

export async function POST(req: Request) {
  const session = await getSellerSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as DeletionRequestPayload;
    const reason = (body.reason ?? "").trim();

    if (reason.length > 1000) {
      return Response.json({ error: "Reason is too long (max 1000 characters)." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from("seller_data_deletion_requests")
      .select("id, status, requested_at")
      .eq("seller_id", session.seller_id)
      .in("status", ["pending", "processing"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      if (isMissingDeletionTable(existingError.message)) {
        return Response.json({ error: "Deletion requests are not initialized." }, { status: 503 });
      }
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return Response.json(
        {
          error: "You already have an active deletion request.",
          request: existing,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("seller_data_deletion_requests")
      .insert({
        seller_id: session.seller_id,
        reason: reason || null,
      })
      .select("id, status, reason, requested_at")
      .single();

    if (error) {
      if (isMissingDeletionTable(error.message)) {
        return Response.json({ error: "Deletion requests are not initialized." }, { status: 503 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, request: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to submit deletion request.";
    return Response.json({ error: message }, { status: 500 });
  }
}
