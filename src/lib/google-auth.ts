// Google Gemini Auth — Client-Side Token Manager
// Uses OAuth 2.0 with Google AI Pro subscription for students

const GOOGLE_STORAGE_KEY = "relearn_google_auth";

// OAuth Client ID — registered in Google Cloud Console
const GOOGLE_CLIENT_ID = "416083111669-6p59skr1qobuoj1dgdujfr4h6d4u7m09.apps.googleusercontent.com";

// Scopes needed for Gemini API access
const SCOPES = [
  "https://www.googleapis.com/auth/generative-language",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
].join(" ");

interface GoogleAuth {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number; // epoch ms
  email?: string;
  name?: string;
  picture?: string;
  idToken?: string;
}

export function getStoredGoogleAuth(): GoogleAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeGoogleAuth(auth: GoogleAuth): void {
  localStorage.setItem(GOOGLE_STORAGE_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event("google-auth-changed"));
}

export function clearGoogleAuth(): void {
  localStorage.removeItem(GOOGLE_STORAGE_KEY);
  window.dispatchEvent(new Event("google-auth-changed"));
}

export function isGoogleAuthenticated(): boolean {
  const auth = getStoredGoogleAuth();
  return !!auth?.accessToken;
}

export function isGoogleTokenValid(): boolean {
  const auth = getStoredGoogleAuth();
  if (!auth?.accessToken || !auth?.tokenExpiry) return false;
  return Date.now() < auth.tokenExpiry - 60_000; // 60s buffer
}

/**
 * Ensure we have a valid Google access token.
 * Refreshes automatically if expired.
 */
export async function ensureGoogleToken(): Promise<string | null> {
  const auth = getStoredGoogleAuth();
  if (!auth?.accessToken) return null;

  if (isGoogleTokenValid()) {
    return auth.accessToken;
  }

  // Token expired — try to refresh
  if (auth.refreshToken) {
    try {
      const res = await fetch("/api/auth/google/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: auth.refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: GoogleAuth = {
          ...auth,
          accessToken: data.access_token,
          tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
          idToken: data.id_token || auth.idToken,
        };
        storeGoogleAuth(updated);
        return data.access_token;
      } else {
        // Refresh failed — user needs to re-auth
        clearGoogleAuth();
        return null;
      }
    } catch (err) {
      console.error("Google token refresh error:", err);
      clearGoogleAuth();
      return null;
    }
  }

  clearGoogleAuth();
  return null;
}

/**
 * Start the Google OAuth login flow.
 * Redirects the user to Google's consent screen.
 */
export function startGoogleLogin(): void {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem("google_oauth_state", state);

  const redirectUri = `${window.location.origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // Gets refresh token
    prompt: "consent", // Always show consent for refresh token
    state,
    include_granted_scopes: "true",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Handle the OAuth callback — exchange code for tokens.
 * Called from the callback page component.
 */
export async function handleGoogleCallback(code: string, state: string): Promise<boolean> {
  // Verify state
  const savedState = sessionStorage.getItem("google_oauth_state");
  if (state !== savedState) {
    console.error("OAuth state mismatch");
    return false;
  }
  sessionStorage.removeItem("google_oauth_state");

  try {
    const res = await fetch("/api/auth/google/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      }),
    });

    if (!res.ok) {
      console.error("Token exchange failed:", await res.text());
      return false;
    }

    const data = await res.json();

    // Fetch user info
    let userInfo: any = {};
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) userInfo = await userRes.json();
    } catch {}

    storeGoogleAuth({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || "",
      tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      idToken: data.id_token,
    });

    return true;
  } catch (err) {
    console.error("Google callback error:", err);
    return false;
  }
}

// Re-export type
export type { GoogleAuth };

/**
 * Get the active AI provider — "google" or "github" or null
 */
export function getActiveProvider(): "google" | "github" | null {
  if (typeof window === "undefined") return null;
  // Check for Google first (student-friendly)
  const googleAuth = getStoredGoogleAuth();
  if (googleAuth?.accessToken) return "google";
  // Then GitHub
  const ghRaw = localStorage.getItem("relearn_github_auth");
  if (ghRaw) {
    try {
      const gh = JSON.parse(ghRaw);
      if (gh?.githubToken) return "github";
    } catch {}
  }
  return null;
}

/**
 * Get the selected Gemini model
 */
export function getSelectedGeminiModel(): string {
  if (typeof window === "undefined") return "gemini-2.5-pro";
  return localStorage.getItem("relearn_gemini_model") || "gemini-2.5-pro";
}

export function setSelectedGeminiModel(model: string): void {
  localStorage.setItem("relearn_gemini_model", model);
  window.dispatchEvent(new Event("model-changed"));
}
