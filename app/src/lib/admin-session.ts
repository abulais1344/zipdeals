import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_COOKIE = "zipdeals_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface AdminSessionPayload {
  loginId: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminSessionCookie(loginId: string): { name: string; value: string; maxAge: number } {
  const payload: AdminSessionPayload = {
    loginId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return {
    name: ADMIN_SESSION_COOKIE,
    value: `${encodedPayload}.${signature}`,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function verifyAdminSessionCookie(cookieValue: string | undefined): AdminSessionPayload | null {
  if (!cookieValue) return null;

  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const isValidSignature =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValidSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSessionPayload;
    if (!payload.loginId || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const adminSessionCookieName = ADMIN_SESSION_COOKIE;
