"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  Globe,
  Bell,
  Shield,
  Keyboard,
  Info,
  Github,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  LogOut,
  Sparkles,
  Zap,
  Key,
  Eye,
  EyeOff,
  User,
  ChevronRight,
  Palette,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStoredAuth,
  clearAuth,
  startDeviceLogin,
  pollForToken,
  ensureCopilotToken,
  getSelectedModel,
  setSelectedModel,
} from "@/lib/github-auth";
import {
  getStoredGoogleAuth,
  clearGoogleAuth,
  startGoogleLogin,
  isGoogleAuthenticated,
  getSelectedGeminiModel,
  setSelectedGeminiModel,
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
  hasGeminiApiKey,
} from "@/lib/google-auth";
import { useI18n } from "@/components/providers/i18n-provider";

type ConnectionState = "disconnected" | "connecting" | "awaiting_auth" | "connected" | "error";
type Section = "providers" | "shortcuts" | "about";

interface Model {
  id: string;
  name: string;
  version?: string;
  capabilities?: any;
}

// ── Keyboard shortcut data ──────────────────────────────────────────────────
const SHORTCUT_GROUPS = [
  {
    title: "Chat",
    shortcuts: [
      { keys: ["Enter"], description: "Send message" },
      { keys: ["Shift", "Enter"], description: "New line in message" },
      { keys: ["+"], description: "Add document context" },
    ],
  },
  {
    title: "Flashcards",
    shortcuts: [
      { keys: ["Space"], description: "Flip card" },
      { keys: ["←"], description: "Previous card" },
      { keys: ["→"], description: "Next card" },
      { keys: ["1", "–", "4"], description: "Rate difficulty" },
      { keys: ["E"], description: "Edit current card" },
      { keys: ["Ctrl", "C"], description: "Copy all cards" },
    ],
  },
  {
    title: "PDF Viewer",
    shortcuts: [
      { keys: ["↑", "/", "↓"], description: "Scroll up / down" },
      { keys: ["Ctrl", "+"], description: "Zoom in" },
      { keys: ["Ctrl", "−"], description: "Zoom out" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["Esc"], description: "Close modal / panel" },
      { keys: ["Ctrl", "K"], description: "Open search" },
    ],
  },
];

function KbdKey({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-700 dark:text-dark-text-secondary shadow-sm">
      {k}
    </kbd>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("providers");

  // GitHub connection
  const [connState, setConnState] = useState<ConnectionState>("disconnected");
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Google connection
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleName, setGoogleName] = useState<string | null>(null);
  const [googlePicture, setGooglePicture] = useState<string | null>(null);
  const [googleConnState, setGoogleConnState] = useState<ConnectionState>("disconnected");

  // Gemini API Key (direct — no OAuth)
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [geminiKeyVisible, setGeminiKeyVisible] = useState(false);
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);

  // GitHub models
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModelState] = useState("gpt-4o");
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Gemini models
  const [selectedGeminiModel, setSelectedGeminiModelState] = useState("gemini-2.5-pro");

  // Init from stored auth
  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.githubToken) {
      setConnState("connected");
      setUserLogin(auth.login || null);
      setUserEmail(auth.email || null);
      setUserAvatar(auth.avatarUrl || null);
    }
    setSelectedModelState(getSelectedModel());

    const ga = getStoredGoogleAuth();
    if (ga) {
      setGoogleConnState("connected");
      setGoogleEmail(ga.email || null);
      setGoogleName(ga.name || null);
      setGooglePicture(ga.picture || null);
      setSelectedGeminiModelState(getSelectedGeminiModel() || "gemini-2.5-pro");
    }

    setApiKeySet(hasGeminiApiKey());
  }, []);

  // Listen for Google auth changes
  useEffect(() => {
    const handler = () => {
      const ga = getStoredGoogleAuth();
      if (ga) {
        setGoogleConnState("connected");
        setGoogleEmail(ga.email || null);
        setGoogleName(ga.name || null);
        setGooglePicture(ga.picture || null);
        setSelectedGeminiModelState(getSelectedGeminiModel() || "gemini-2.5-pro");
      } else {
        setGoogleConnState("disconnected");
        setGoogleEmail(null); setGoogleName(null); setGooglePicture(null);
      }
    };
    window.addEventListener("google-auth-changed", handler);
    return () => window.removeEventListener("google-auth-changed", handler);
  }, []);

  // Fetch GitHub Copilot models
  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const token = await ensureCopilotToken();
      if (!token) { setModelsError(t("settings.copilot_token_error")); setLoadingModels(false); return; }

      let data: any;
      if ((window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        const raw: string = await invoke("github_fetch_models", { token });
        data = JSON.parse(raw);
      } else {
        const res = await fetch("https://api.githubcopilot.com/models", {
          headers: { Authorization: "Bearer " + token, Accept: "application/json", "Copilot-Integration-Id": "vscode-chat" },
        });
        if (!res.ok) { const err = await res.json(); setModelsError(err.error || t("settings.fetch_models_error")); setLoadingModels(false); return; }
        data = await res.json();
      }
      const modelList: Model[] = (data.data || data.models || []).map((m: any) => ({
        id: m.id || m.name, name: m.id || m.name, version: m.version, capabilities: m.capabilities,
      }));
      setModels(modelList);
      if (modelList.length > 0 && !modelList.find(m => m.id === selectedModel)) {
        const def = modelList.find(m => m.id.includes("gpt-4o")) || modelList[0];
        setSelectedModelState(def.id); setSelectedModel(def.id);
      }
    } catch { setModelsError(t("settings.network_error_fetching_models")); }
    setLoadingModels(false);
  }, [selectedModel, t]);

  useEffect(() => { if (connState === "connected") fetchModels(); }, [connState, fetchModels]);

  // GitHub handlers
  const handleConnect = async () => {
    setConnState("connecting"); setErrorMsg(null);
    try {
      const deviceData = await startDeviceLogin();
      setDeviceCode(deviceData.device_code); setUserCode(deviceData.user_code);
      setVerificationUri(deviceData.verification_uri); setConnState("awaiting_auth");
      try {
        if ((window as any).__TAURI_INTERNALS__) {
          const { open } = await import("@tauri-apps/plugin-shell");
          await open(deviceData.verification_uri);
        } else { window.open(deviceData.verification_uri, "_blank"); }
      } catch { window.open(deviceData.verification_uri, "_blank"); }
      const success = await pollForToken(deviceData.device_code, deviceData.interval || 5);
      if (success) {
        const auth = getStoredAuth();
        setConnState("connected"); setUserLogin(auth?.login || null);
        setUserEmail(auth?.email || null); setUserAvatar(auth?.avatarUrl || null);
      } else { setConnState("error"); setErrorMsg(t("settings.login_timeout")); }
    } catch (err: any) { setConnState("error"); setErrorMsg(t("settings.login_failed") + ": " + (err?.message || String(err))); }
  };

  const handleDisconnect = () => {
    clearAuth(); setConnState("disconnected"); setModels([]);
    setUserLogin(null); setUserEmail(null); setUserAvatar(null);
  };

  // Google handlers
  const handleGoogleConnect = async () => {
    setGoogleConnState("connecting");
    try { await startGoogleLogin(); }
    catch (err: any) { setGoogleConnState("error"); setErrorMsg(t("settings.login_failed") + ": " + (err?.message || String(err))); }
  };

  const handleGoogleDisconnect = () => {
    clearGoogleAuth(); setGoogleConnState("disconnected");
    setGoogleEmail(null); setGoogleName(null); setGooglePicture(null);
  };

  // Gemini API Key handlers
  const handleSaveGeminiKey = () => {
    const trimmed = geminiKeyInput.trim();
    if (!trimmed) return;
    setGeminiApiKey(trimmed);
    setApiKeySet(true); setGeminiKeyInput(""); setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 2500);
  };

  const handleClearGeminiKey = () => {
    clearGeminiApiKey(); setApiKeySet(false); setGeminiKeyInput("");
  };

  // Model selectors
  const handleSelectModel = (modelId: string) => { setSelectedModelState(modelId); setSelectedModel(modelId); };
  const handleSelectGeminiModel = (model: string) => { setSelectedGeminiModelState(model); setSelectedGeminiModel(model); };

  const copyCode = () => {
    if (userCode) { navigator.clipboard.writeText(userCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
  };

  // ─── Section tabs ─────────────────────────────────────────────────────────
  const tabs: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "providers", label: "AI Providers", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="h-3.5 w-3.5" /> },
    { id: "about", label: "About", icon: <Info className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg">
      <Header title={t("settings.title")} onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-6">

          {/* Section Tabs */}
          <div className="mb-6 flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-dark-surface p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all",
                  activeSection === tab.id
                    ? "bg-white dark:bg-dark-bg shadow-sm text-gray-900 dark:text-dark-text"
                    : "text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════ */}
          {/* SECTION: AI Providers              */}
          {/* ═══════════════════════════════════ */}
          {activeSection === "providers" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                {t("settings.connect_provider")}
              </p>

              {/* ── Google AI ── */}
              <div className="rounded-2xl border border-blue-200 dark:border-dark-border overflow-hidden">
                <div className="bg-blue-50 dark:bg-dark-surface px-5 py-4 border-b border-blue-100 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text">{t("settings.ai_provider")}</h2>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("settings.google_ai_desc")}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {googleConnState === "connected" && (
                    <div className="animate-fade-in">
                      <div className="flex items-center gap-3 rounded-xl bg-yl-green-bg dark:bg-yl-green-bg-dark/50 p-3">
                        <CheckCircle2 className="h-5 w-5 text-yl-green shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {googlePicture && <img src={googlePicture} alt="" className="h-6 w-6 rounded-full" />}
                            <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{googleName || googleEmail}</span>
                          </div>
                          {googleEmail && <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{googleEmail}</p>}
                        </div>
                        <button onClick={handleGoogleDisconnect}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-text-muted hover:bg-white dark:hover:bg-dark-bg hover:text-gray-700 dark:hover:text-dark-text transition-colors">
                          <LogOut className="h-3 w-3" />{t("settings.disconnect")}
                        </button>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Cpu className="h-4 w-4 text-gray-500 dark:text-dark-text-muted" />
                          <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{t("settings.gemini_model")}</span>
                        </div>
                        <div className="space-y-1.5">
                          {["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"].map(model => (
                            <button key={model} onClick={() => handleSelectGeminiModel(model)}
                              className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                                selectedGeminiModel === model
                                  ? "border-gray-900 bg-gray-50 dark:bg-dark-surface shadow-sm dark:shadow-none"
                                  : "border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover")}>
                              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs",
                                selectedGeminiModel === model ? "bg-gray-900 text-white" : "bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-dark-text-muted")}>
                                <Sparkles className="h-3.5 w-3.5" />
                              </div>
                              <span className={cn("flex-1 text-sm font-medium truncate",
                                selectedGeminiModel === model ? "text-gray-900 dark:text-dark-text" : "text-gray-700 dark:text-dark-text-secondary")}>
                                {model}
                              </span>
                              {selectedGeminiModel === model && <Check className="h-4 w-4 text-gray-900 dark:text-dark-text shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {googleConnState === "disconnected" && (
                    <button onClick={handleGoogleConnect}
                      className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-dark-border p-3 text-left transition-all hover:border-blue-300 dark:hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-dark-hover">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-dark-text">{t("settings.connect_google_account")}</span>
                    </button>
                  )}
                  {googleConnState === "connecting" && (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-dark-text-muted">{t("settings.connecting")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Gemini API Key (direct, no OAuth) ── */}
              <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="bg-gray-50 dark:bg-dark-surface px-5 py-3.5 border-b border-gray-100 dark:border-dark-border flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-dark-card">
                    <Key className="h-4 w-4 text-gray-600 dark:text-dark-text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">Gemini API Key</h3>
                    <p className="text-xs text-gray-500 dark:text-dark-text-muted">Use your own key — no sign-in required</p>
                  </div>
                  {apiKeySet && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-yl-green-bg dark:bg-yl-green-bg-dark/50 px-2 py-0.5 text-[10px] font-medium text-yl-green">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {apiKeySet ? (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-dark-surface px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-gray-400 dark:text-dark-text-muted" />
                        <span className="text-sm text-gray-600 dark:text-dark-text-secondary font-mono">
                          {"•".repeat(12)} (saved)
                        </span>
                      </div>
                      <button onClick={handleClearGeminiKey}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 font-medium transition-colors">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={geminiKeyVisible ? "text" : "password"}
                          value={geminiKeyInput}
                          onChange={e => setGeminiKeyInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSaveGeminiKey()}
                          placeholder="AIza..."
                          className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 pr-9 text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted outline-none focus:border-gray-300 dark:focus:border-dark-border"
                        />
                        <button onClick={() => setGeminiKeyVisible(!geminiKeyVisible)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-secondary">
                          {geminiKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <button onClick={handleSaveGeminiKey} disabled={!geminiKeyInput.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40 transition-colors">
                        {geminiKeySaved ? <><Check className="h-3.5 w-3.5" /> Saved</> : "Save"}
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 dark:text-dark-text-muted">
                    Get a free key at{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                      className="underline hover:text-gray-600 dark:hover:text-dark-text-secondary">
                      aistudio.google.com/apikey
                    </a>
                  </p>
                </div>
              </div>

              {/* ── GitHub Copilot ── */}
              <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="bg-gray-50 dark:bg-dark-surface px-5 py-4 border-b border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                      <Github className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text">{t("settings.ai_provider")}</h2>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("settings.github_copilot_desc")}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {connState === "connected" && (
                    <div className="animate-fade-in space-y-4">
                      <div className="flex items-center gap-3 rounded-xl bg-yl-green-bg dark:bg-yl-green-bg-dark/50 p-3">
                        <CheckCircle2 className="h-5 w-5 text-yl-green shrink-0" />
                        <div className="flex-1 min-w-0">
                          {userAvatar && <img src={userAvatar} alt="" className="h-6 w-6 rounded-full inline mr-2" />}
                          <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{userLogin || userEmail || "Connected"}</span>
                          {userEmail && <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{userEmail}</p>}
                        </div>
                        <button onClick={handleDisconnect}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-text-muted hover:bg-white dark:hover:bg-dark-bg hover:text-gray-700 dark:hover:text-dark-text transition-colors">
                          <LogOut className="h-3 w-3" />{t("settings.disconnect")}
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-gray-500 dark:text-dark-text-muted" />
                            <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{t("settings.model")}</span>
                          </div>
                          <button onClick={fetchModels} disabled={loadingModels}
                            className="flex items-center gap-1 text-xs text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors disabled:opacity-40">
                            {loadingModels ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            {loadingModels ? t("settings.fetching_models") : t("settings.refresh_models")}
                          </button>
                        </div>
                        {modelsError && (
                          <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />{modelsError}
                          </div>
                        )}
                        {models.length > 0 && (
                          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {models.map(model => (
                              <button key={model.id} onClick={() => handleSelectModel(model.id)}
                                className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                                  selectedModel === model.id
                                    ? "border-gray-900 bg-gray-50 dark:bg-dark-surface shadow-sm dark:shadow-none"
                                    : "border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover")}>
                                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  selectedModel === model.id ? "bg-gray-900 text-white" : "bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-dark-text-muted")}>
                                  <Sparkles className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium truncate",
                                    selectedModel === model.id ? "text-gray-900 dark:text-dark-text" : "text-gray-700 dark:text-dark-text-secondary")}>
                                    {model.name}
                                  </p>
                                  {model.version && <p className="text-[10px] text-gray-400 dark:text-dark-text-muted">v{model.version}</p>}
                                </div>
                                {selectedModel === model.id && <Check className="h-4 w-4 text-gray-900 dark:text-dark-text shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {connState === "connecting" && (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-dark-text-muted">{t("settings.connecting")}</span>
                    </div>
                  )}
                  {connState === "awaiting_auth" && userCode && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-4">
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-2">
                          {t("settings.enter_code_at")} <span className="font-medium text-gray-700 dark:text-dark-text-secondary">github.com/login/device</span>
                        </p>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 rounded-lg bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-dark-text select-all">
                            {userCode}
                          </code>
                          <button onClick={copyCode}
                            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors">
                            {codeCopied ? <><CheckCircle2 className="h-3.5 w-3.5" />{t("common.copied")}</> : <><Copy className="h-3.5 w-3.5" />{t("common.copy")}</>}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-dark-text-muted mt-2">{t("settings.waiting_for_auth")}</p>
                      </div>
                    </div>
                  )}
                  {connState === "error" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-xs text-red-600 dark:text-red-400">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />{errorMsg || t("settings.connection_failed")}
                      </div>
                      <button onClick={handleConnect}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border p-3 text-left transition-all hover:border-gray-300 dark:hover:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover w-full">
                        <Github className="h-5 w-5 text-gray-900 dark:text-dark-text" />
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-dark-text">{t("settings.try_again")}</span>
                      </button>
                    </div>
                  )}
                  {connState === "disconnected" && (
                    <button onClick={handleConnect}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border p-3 text-left transition-all hover:border-gray-300 dark:hover:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover">
                      <Github className="h-5 w-5 text-gray-900 dark:text-dark-text" />
                      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-dark-text">{t("settings.connect_github_account")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════ */}
          {/* SECTION: Keyboard Shortcuts        */}
          {/* ═══════════════════════════════════ */}
          {activeSection === "shortcuts" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                Keyboard shortcuts to work faster inside ReLearn.
              </p>
              {SHORTCUT_GROUPS.map(group => (
                <div key={group.title} className="rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
                  <div className="bg-gray-50 dark:bg-dark-surface px-4 py-2.5 border-b border-gray-100 dark:border-dark-border">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-text-muted">
                      {group.title}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-dark-border">
                    {group.shortcuts.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-dark-text-secondary">{s.description}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {s.keys.map((k, j) => (
                            <React.Fragment key={j}>
                              {j > 0 && k !== "–" && <span className="text-[10px] text-gray-300 dark:text-dark-text-muted">+</span>}
                              {k === "–" ? (
                                <span className="text-[11px] text-gray-400 dark:text-dark-text-muted mx-0.5">or</span>
                              ) : (
                                <KbdKey k={k} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-center text-xs text-gray-300 dark:text-dark-text-muted pt-2">
                More shortcuts coming soon
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════ */}
          {/* SECTION: About                     */}
          {/* ═══════════════════════════════════ */}
          {activeSection === "about" && (
            <div className="space-y-4">
              {/* App identity */}
              <div className="rounded-2xl border border-gray-100 dark:border-dark-border p-6 text-center">
                <div className="flex justify-center mb-3">
                  <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
                    <path d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-white" />
                    <path d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-white" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">ReLearn</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">Study smarter, not harder</p>
                <div className="mt-3 inline-flex items-center rounded-full bg-gray-100 dark:bg-dark-surface px-3 py-1 text-xs font-medium text-gray-600 dark:text-dark-text-secondary">
                  Version 0.1.0
                </div>
              </div>

              {/* Links */}
              <div className="rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden divide-y divide-gray-50 dark:divide-dark-border">
                <a href="https://github.com/KNIGHTABDO/relearn" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                  <Github className="h-4 w-4 text-gray-400 dark:text-dark-text-muted" />
                  <span>View source on GitHub</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-300 dark:text-dark-text-muted" />
                </a>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                  <Key className="h-4 w-4 text-gray-400 dark:text-dark-text-muted" />
                  <span>Get a free Gemini API key</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-300 dark:text-dark-text-muted" />
                </a>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-gray-100 dark:border-dark-border p-4">
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed">
                  ReLearn turns your study materials — PDFs, slides, videos, and notes — into interactive
                  AI-powered learning experiences. Generate flashcards, quizzes, summaries, and chat directly
                  with your documents.
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-dark-text-muted">
                  Built with Next.js · Tauri · SQLite · Gemini · GitHub Copilot
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
