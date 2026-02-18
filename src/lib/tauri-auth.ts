// Tauri Auth Adapter
// In desktop mode: stores tokens in SQLite
// In web mode: stores tokens in localStorage (existing behavior)

import { getAuthToken, saveAuthToken, clearAuthToken, getSetting, setSetting } from "./database";

/**
 * Check if running inside Tauri
 */
export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).__TAURI_INTERNALS__;
}

// =========================
// Google Auth (Tauri Desktop)
// =========================

export async function getTauriGoogleAuth() {
  if (!isTauri()) return null;
  return await getAuthToken("google");
}

export async function saveTauriGoogleAuth(data: {
  access_token: string;
  refresh_token: string;
  token_expiry: number;
  email?: string;
  name?: string;
  picture?: string;
}) {
  if (!isTauri()) return;
  await saveAuthToken("google", data);
}

export async function clearTauriGoogleAuth() {
  if (!isTauri()) return;
  await clearAuthToken("google");
}

// =========================
// GitHub Auth (Tauri Desktop)
// =========================

export async function getTauriGithubAuth() {
  if (!isTauri()) return null;
  return await getAuthToken("github");
}

export async function saveTauriGithubAuth(data: {
  access_token: string;
  refresh_token: string;
  token_expiry: number;
  email?: string;
  name?: string;
  picture?: string;
  extra?: any;
}) {
  if (!isTauri()) return;
  await saveAuthToken("github", {
    ...data,
    extra: data.extra || {},
  });
}

export async function clearTauriGithubAuth() {
  if (!isTauri()) return;
  await clearAuthToken("github");
}

// =========================
// Settings (Tauri Desktop)
// =========================

export async function getTauriSetting(key: string): Promise<string | null> {
  if (!isTauri()) return null;
  return await getSetting(key);
}

export async function setTauriSetting(key: string, value: string): Promise<void> {
  if (!isTauri()) return;
  await setSetting(key, value);
}
