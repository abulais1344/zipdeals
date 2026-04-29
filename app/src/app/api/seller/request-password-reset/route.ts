import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const origin = req.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  return "http://localhost:3000";
}

async function sendResetEmail(to: string, sellerName: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Email service not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const subject = "Reset your ZipDeals seller password";
  const html = `
    <p>Hi ${sellerName},</p>
    <p>We received a request to reset your seller password on ZipDeals.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Reset password</a>
    </p>
    <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send reset email: ${text}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string };
    const phone = normalizePhone(body.phone ?? "");

    if (phone.length < 10 || phone.length > 15) {
      return Response.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, seller_name, email, verified_at")
      .eq("phone", phone)
      .maybeSingle();

    if (sellerError) {
      return Response.json({ error: sellerError.message }, { status: 500 });
    }

    if (!seller || !seller.verified_at) {
      return Response.json({
        success: true,
        message: "If your account exists, a password reset link will be sent.",
      });
    }

    if (!seller.email) {
      return Response.json(
        {
          error: "No recovery email is set for this account. Please contact support/admin to add your email.",
          code: "NO_RECOVERY_EMAIL",
        },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("sellers")
      .update({
        password_reset_token: token,
        password_reset_expires_at: expiresAt,
      })
      .eq("id", seller.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    const resetUrl = `${getBaseUrl(req)}/seller/reset-password?token=${token}`;
    await sendResetEmail(seller.email, seller.seller_name, resetUrl);

    return Response.json({
      success: true,
      message: "If your account exists, a password reset link will be sent.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not process password reset";
    return Response.json({ error: message }, { status: 500 });
  }
}
