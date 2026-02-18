// Google Gemini Auth — Client-Side Token Manager
// Web: standard OAuth redirect + client-side token exchange
// Tauri: loopback server + Rust-side token exchange (no CORS)

const GOOGLE_STORAGE_KEY = "relearn_google_auth";
const GOOGLE_CLIENT_ID = "416083111669-6p59skr1qobuoj1dgdujfr4h6d4u7m09.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/generative-language",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
].join(" ");

interface GoogleAuth {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  email?: string;
  name?: string;
  picture?: string;
  idToken?: string;
}

function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).__TAURI_INTERNALS__;
}

// ==================== PKCE ====================

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, length);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ==================== Storage ====================

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
  return Date.now() < auth.tokenExpiry - 60_000;
}

// ==================== Token Refresh ====================

export async function ensureGoogleToken(): Promise<string | null> {
  const auth = getStoredGoogleAuth();
  if (!auth?.accessToken) return null;

  if (isGoogleTokenValid()) return auth.accessToken;

  if (auth.refreshToken) {
    try {
      let data: any;

      if (isTauri()) {
        const { invoke } = await import("@tauri-apps/api/core");
        data = await invoke("google_refresh_token", {
          refreshToken: auth.refreshToken,
          clientId: GOOGLE_CLIENT_ID,
        });
      } else {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: auth.refreshToken,
          }),
        });
        if (!res.ok) { clearGoogleAuth(); return null; }
        data = await res.json();
      }

      if (data.error) { clearGoogleAuth(); return null; }

      storeGoogleAuth({
        ...auth,
        accessToken: data.access_token,
        tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
        idToken: data.id_token || auth.idToken,
      });
      return data.access_token;
    } catch {
      clearGoogleAuth();
      return null;
    }
  }

  clearGoogleAuth();
  return null;
}

// ==================== Login Flow ====================

export async function startGoogleLogin(): Promise<void> {
  const state = crypto.randomUUID();
  sessionStorage.setItem("google_oauth_state", state);

  const codeVerifier = generateRandomString(64);
  sessionStorage.setItem("google_code_verifier", codeVerifier);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  if (isTauri()) {
    await startTauriGoogleOAuth(state, codeVerifier, codeChallenge);
  } else {
    const redirectUri = window.location.origin + "/auth/google/callback";
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
      include_granted_scopes: "true",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    window.location.href = "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();
  }
}

async function startTauriGoogleOAuth(
  state: string,
  codeVerifier: string,
  codeChallenge: string
): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");

    // Step 1: Start loopback OAuth server
    const port: number = await invoke("start_oauth_server");
    const redirectUri = "http://127.0.0.1:" + port + "/callback";

    // Step 2: Listen for callback event
    const { listen } = await import("@tauri-apps/api/event");
    const unlisten = await listen<string>("oauth-callback", async (event) => {
      unlisten();

      const params = new URLSearchParams(event.payload);
      const code = params.get("code");

      if (!code) {
        console.error("No authorization code in callback");
        return;
      }

      try {
        // Step 4: Exchange code for tokens via Rust (no CORS)
        const data: any = await invoke("google_exchange_token", {
          code,
          redirectUri,
          codeVerifier,
          clientId: GOOGLE_CLIENT_ID,
        });

        const userInfo = data.user_info || {};

        storeGoogleAuth({
          accessToken: data.access_token || "",
          refreshToken: data.refresh_token || "",
          tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          idToken: data.id_token,
        });
      } catch (err) {
        console.error("Google token exchange failed:", err);
      }
    });

    // Step 3: Open Google OAuth in system browser
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
      include_granted_scopes: "true",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const { open } = await import("@tauri-apps/plugin-shell");
    await open("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
  } catch (err) {
    console.error("Tauri Google OAuth error:", err);
  }
}

// ==================== Web Callback Handler ====================

export async function handleGoogleCallback(code: string, state: string): Promise<boolean> {
  const savedState = sessionStorage.getItem("google_oauth_state");
  if (state !== savedState) { console.error("State mismatch"); return false; }
  sessionStorage.removeItem("google_oauth_state");

  const codeVerifier = sessionStorage.getItem("google_code_verifier") || "";
  sessionStorage.removeItem("google_code_verifier");

  const redirectUri = window.location.origin + "/auth/google/callback";

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!res.ok) return false;
    const data = await res.json();

    let userInfo: any = {};
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: "Bearer " + data.access_token },
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

// ==================== Exports ====================

export type { GoogleAuth };

export function getActiveProvider(): "google" | "github" | null {
  if (typeof window === "undefined") return null;
  const googleAuth = getStoredGoogleAuth();
  if (googleAuth?.accessToken) return "google";
  const ghRaw = localStorage.getItem("relearn_github_auth");
  if (ghRaw) {
    try {
      const gh = JSON.parse(ghRaw);
      if (gh?.githubToken) return "github";
    } catch {}
  }
  return null;
}

export function getSelectedGeminiModel(): string {
  if (typeof window === "undefined") return "gemini-2.5-pro";
  return localStorage.getItem("relearn_gemini_model") || "gemini-2.5-pro";
}

export function setSelectedGeminiModel(model: string): void {
  localStorage.setItem("relearn_gemini_model", model);
  window.dispatchEvent(new Event("model-changed"));
}
