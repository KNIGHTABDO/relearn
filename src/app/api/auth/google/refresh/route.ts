import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "416083111669-6p59skr1qobuoj1dgdujfr4h6d4u7m09.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    if (!CLIENT_SECRET) {
      return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google refresh failed:", err);
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    }

    const data = await tokenRes.json();
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      id_token: data.id_token,
      scope: data.scope,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
