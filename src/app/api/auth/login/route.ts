import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "peak38_session";
const SESSION_VALUE = "authenticated";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (!process.env.APP_PASSWORD) {
      return NextResponse.json({ error: "APP_PASSWORD is not configured" }, { status: 500 });
    }

    if (password !== process.env.APP_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Failed to log in", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
