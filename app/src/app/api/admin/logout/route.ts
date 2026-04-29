import { NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/admin-session";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const response = NextResponse.redirect(`${origin}/`, 303);
  response.cookies.set(adminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
