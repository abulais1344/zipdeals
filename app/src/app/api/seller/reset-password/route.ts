import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: string; password?: string };
    const token = (body.token ?? "").trim();
    const password = body.password ?? "";

    if (!token || !password) {
      return Response.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, password_reset_expires_at")
      .eq("password_reset_token", token)
      .maybeSingle();

    if (sellerError) {
      return Response.json({ error: sellerError.message }, { status: 500 });
    }

    if (!seller || !seller.password_reset_expires_at) {
      return Response.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    const expiryTime = new Date(seller.password_reset_expires_at).getTime();
    if (Number.isNaN(expiryTime) || expiryTime < Date.now()) {
      return Response.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabase
      .from("sellers")
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
      })
      .eq("id", seller.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: "Password reset successful. Please login." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not reset password";
    return Response.json({ error: message }, { status: 500 });
  }
}
