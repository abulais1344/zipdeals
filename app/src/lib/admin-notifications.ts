interface AdminEmailPayload {
  subject: string;
  html: string;
}

function getBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const origin = req.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function buildAdminUrl(req: Request, path: string): string {
  const base = getBaseUrl(req);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function sendAdminNotificationEmail(payload: AdminEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !from || !to) {
    console.warn("Admin notification skipped: RESEND_API_KEY / RESEND_FROM_EMAIL / ADMIN_NOTIFICATION_EMAIL missing");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Admin notification failed:", text);
  }
}
