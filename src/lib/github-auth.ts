// GitHub Copilot Auth — Client-Side Token Manager
// Works in both web and Tauri desktop mode (no API routes needed)

const STORAGE_KEY = "relearn_github_auth";

// GitHub Copilot Client ID (public, same for everyone)
const COPILOT_CLIENT_ID = "Iv1.b507a08c87ecfe98";

interface GitHubAuth {
  githubToken: string;
  copilotToken: string;
  copilotExpiry: number; // epoch ms
  email?: string;
  login?: string;
  avatarUrl?: string;
}

export function getStoredAuth(): GitHubAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(auth: GitHubAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event("github-auth-changed"));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("relearn_selected_model");
  window.dispatchEvent(new Event("github-auth-changed"));
}

export function getSelectedModel(): string {
  if (typeof window === "undefined") return "gpt-4o";
  return localStorage.getItem("relearn_selected_model") || "gpt-4o";
}

export function setSelectedModel(model: string): void {
  localStorage.setItem("relearn_selected_model", model);
  window.dispatchEvent(new Event("model-changed"));
}

export function isAuthenticated(): boolean {
  const auth = getStoredAuth();
  return !!auth?.githubToken;
}

export function isCopilotTokenValid(): boolean {
  const auth = getStoredAuth();
  if (!auth?.copilotToken || !auth?.copilotExpiry) return false;
  return Date.now() < auth.copilotExpiry - 60_000;
}

/**
 * Ensure we have a valid Copilot runtime token.
 * Exchanges GitHub token for Copilot token if expired.
 */
export async function ensureCopilotToken(): Promise<string | null> {
  const auth = getStoredAuth();
  if (!auth?.githubToken) return null;

  if (auth.copilotToken && isCopilotTokenValid()) {
    return auth.copilotToken;
  }

  // Exchange github token for copilot runtime token (direct API call)
  try {
    const res = await fetch("https://api.github.com/copilot_internal/v2/token", {
      headers: {
        Authorization: "token " + auth.githubToken,
        Accept: "application/json",
        "User-Agent": "ReLearn/1.0",
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearAuth();
      }
      return null;
    }

    const data = await res.json();
    const updatedAuth: GitHubAuth = {
      ...auth,
      copilotToken: data.token,
      copilotExpiry: data.expires_at
        ? new Date(data.expires_at * 1000).getTime()
        : Date.now() + 30 * 60 * 1000,
    };
    storeAuth(updatedAuth);
    return data.token;
  } catch (err) {
    console.error("Copilot token exchange error:", err);
    return null;
  }
}

/**
 * Start the GitHub device code login flow.
 * This is done entirely client-side — no API routes needed.
 */
export async function startDeviceLogin(): Promise<{
  verification_uri: string;
  user_code: string;
  device_code: string;
  interval: number;
} | null> {
  try {
    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: COPILOT_CLIENT_ID,
        scope: "read:user",
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Device code request failed:", err);
    return null;
  }
}

/**
 * Poll GitHub for the access token after user enters the device code.
 * This is done entirely client-side.
 */
export async function pollForToken(deviceCode: string, interval: number): Promise<boolean> {
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, interval * 1000));

    try {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: COPILOT_CLIENT_ID,
          device_code: deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      });

      const data = await res.json();

      if (data.access_token) {
        // Got the token! Fetch user info and copilot token in parallel
        const [userInfo, copilotData] = await Promise.all([
          fetchGitHubUser(data.access_token),
          exchangeCopilotToken(data.access_token),
        ]);

        storeAuth({
          githubToken: data.access_token,
          copilotToken: copilotData?.token || "",
          copilotExpiry: copilotData?.expires_at
            ? new Date(copilotData.expires_at * 1000).getTime()
            : 0,
          email: userInfo?.email,
          login: userInfo?.login,
          avatarUrl: userInfo?.avatar_url,
        });

        return true;
      }

      if (data.error === "authorization_pending") continue;
      if (data.error === "slow_down") {
        interval += 5;
        continue;
      }
      if (data.error === "expired_token" || data.error === "access_denied") {
        return false;
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function fetchGitHubUser(token: string) {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
        "User-Agent": "ReLearn/1.0",
      },
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

async function exchangeCopilotToken(githubToken: string) {
  try {
    const res = await fetch("https://api.github.com/copilot_internal/v2/token", {
      headers: {
        Authorization: "token " + githubToken,
        Accept: "application/json",
        "User-Agent": "ReLearn/1.0",
      },
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}
