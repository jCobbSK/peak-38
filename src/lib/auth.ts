import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "peak38_session";
const SESSION_VALUE = "authenticated";

export function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE);
  return cookie?.value === SESSION_VALUE;
}

export function verifyPassword(password: string): boolean {
  return password === process.env.APP_PASSWORD;
}

export function createAuthResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}

export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
