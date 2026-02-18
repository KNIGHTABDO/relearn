import { NextRequest, NextResponse } from "next/server";

// Google OAuth credentials — set via environment variables for security
// In development, these are loaded from .env.local
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "416083111669-6p59skr1qobuoj1dgdujfr4h6d4u7m09.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    if (!CLIENT_SECRET) {
      return NextResponse.json({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_SECRET in .env.local" }, { status: 500 });
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirect_uri || "",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      return NextResponse.json({ error: "Token exchange failed", details: err }, { status: 400 });
    }

    const data = await tokenRes.json();

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      id_token: data.id_token,
      scope: data.scope,
      token_type: data.token_type,
    });
  } catch (error) {
    console.error("Google token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
