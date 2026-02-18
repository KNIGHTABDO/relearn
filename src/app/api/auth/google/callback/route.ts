import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/google/callback
 * This is the OAuth redirect URI. Google sends the user back here with ?code=...&state=...
 * We redirect to a client-side page that handles the token exchange.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  // Redirect to a client page that will call handleGoogleCallback()
  return NextResponse.redirect(
    new URL(`/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`, req.url)
  );
}
