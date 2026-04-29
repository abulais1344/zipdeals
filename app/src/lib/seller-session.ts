import crypto from "crypto";

export interface SellerSessionData {
  seller_id: string;
  seller_name: string;
  username: string;
  created_at: number;
}

export function createSellerSessionCookie(
  sessionData: SellerSessionData,
  secret: string
): string {
  const payload = JSON.stringify(sessionData);
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();

  const signed = Buffer.concat([hmac, Buffer.from(payload)]);
  return signed.toString("base64url");
}

export function verifySellerSessionCookie(
  cookie: string,
  secret: string
): SellerSessionData | null {
  try {
    const signed = Buffer.from(cookie, "base64url");

    // HMAC is 32 bytes (SHA256), rest is payload
    const hmac = signed.slice(0, 32);
    const payload = signed.slice(32);

    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest();

    // Timing-safe comparison
    if (!crypto.timingSafeEqual(hmac, expected)) {
      return null;
    }

    return JSON.parse(payload.toString());
  } catch {
    return null;
  }
}
