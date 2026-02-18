"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  User,
  Globe,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  ChevronRight,
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
} from "@/lib/google-auth";

type ConnectionState = "disconnected" | "connecting" | "awaiting_auth" | "connected" | "error";

interface Model {
  id: string;
  name: string;
  version?: string;
  capabilities?: any;
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connState, setConnState] = useState<ConnectionState>("disconnected");
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // GitHub user info
  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Google user info
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleName, setGoogleName] = useState<string | null>(null);
  const [googlePicture, setGooglePicture] = useState<string | null>(null);
  const [googleConnState, setGoogleConnState] = useState<ConnectionState>("disconnected");

  // GitHub models
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModelState] = useState("gpt-4o");
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Gemini models
  const [selectedGeminiModel, setSelectedGeminiModelState] = useState("gemini-2.5-pro");

  // Initialize from stored auth (GitHub + Google)
  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.githubToken) {
      setConnState("connected");
      setUserLogin(auth.login || null);
      setUserEmail(auth.email || null);
      setUserAvatar(auth.avatarUrl || null);
    }
    setSelectedModelState(getSelectedModel());

    const googleAuth = getStoredGoogleAuth();
    if (googleAuth) {
      setGoogleConnState("connected");
      setGoogleEmail(googleAuth.email || null);
      setGoogleName(googleAuth.name || null);
      setGooglePicture(googleAuth.picture || null);
      setSelectedGeminiModelState(getSelectedGeminiModel() || "gemini-2.5-pro");
    }
  }, []);

  // Listen for external Google auth changes
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
        setGoogleEmail(null);
        setGoogleName(null);
        setGooglePicture(null);
      }
    };
    document.addEventListener("google-auth-changed", handler);
    return () => document.removeEventListener("google-auth-changed", handler);
  }, []);

  // Fetch GitHub Copilot models
  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const token = await ensureCopilotToken();
      if (!token) {
        setModelsError("Could not get Copilot token. Try reconnecting.");
        setLoadingModels(false);
        return;
      }

      const res = await fetch("/api/models", {
        headers: { "x-copilot-token": token },
      });

      if (!res.ok) {
        const err = await res.json();
        setModelsError(err.error || "Failed to fetch models");
        setLoadingModels(false);
        return;
      }

      const data = await res.json();
      const modelList: Model[] = (data.data || data.models || []).map((m: any) => ({
        id: m.id || m.name,
        name: m.id || m.name,
        version: m.version,
        capabilities: m.capabilities,
      }));

      setModels(modelList);
      if (modelList.length > 0 && !modelList.find((m) => m.id === selectedModel)) {
        const defaultModel = modelList.find((m) => m.id.includes("gpt-4o")) || modelList[0];
        setSelectedModelState(defaultModel.id);
        setSelectedModel(defaultModel.id);
      }
    } catch {
      setModelsError("Network error fetching models");
    }
    setLoadingModels(false);
  }, [selectedModel]);

  useEffect(() => {
    if (connState === "connected") {
      fetchModels();
    }
  }, [connState, fetchModels]);

  // GitHub auth handlers
  const handleConnect = async () => {
    setConnState("connecting");
    setErrorMsg(null);

    const deviceData = await startDeviceLogin();
    if (!deviceData) {
      setConnState("error");
      setErrorMsg("Failed to start login. Check your connection.");
      return;
    }

    setDeviceCode(deviceData.device_code);
    setUserCode(deviceData.user_code);
    setVerificationUri(deviceData.verification_uri);
    setConnState("awaiting_auth");

    window.open(deviceData.verification_uri, "_blank");

    const success = await pollForToken(deviceData.device_code, deviceData.interval || 5);
    if (success) {
      const auth = getStoredAuth();
      setConnState("connected");
      setUserLogin(auth?.login || null);
      setUserEmail(auth?.email || null);
      setUserAvatar(auth?.avatarUrl || null);
    } else {
      setConnState("error");
      setErrorMsg("Login timed out or was denied. Try again.");
    }
  };

  const handleDisconnect = () => {
    clearAuth();
    setConnState("disconnected");
    setModels([]);
    setUserLogin(null);
    setUserEmail(null);
    setUserAvatar(null);
  };

  // Google auth handlers
  const handleGoogleConnect = async () => {
    await startGoogleLogin();
  };

  const handleGoogleDisconnect = () => {
    clearGoogleAuth();
    setGoogleConnState("disconnected");
    setGoogleEmail(null);
    setGoogleName(null);
    setGooglePicture(null);
  };

  // Model selectors
  const handleSelectModel = (modelId: string) => {
    setSelectedModelState(modelId);
    setSelectedModel(modelId);
  };

  const handleSelectGeminiModel = (modelId: string) => {
    setSelectedGeminiModelState(modelId);
    setSelectedGeminiModel(modelId);
    setSelectedGeminiModel(modelId);
  };

  const copyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg">
      <Header title="Settings" onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-8">

          <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-4">
            Connect at least one AI provider to unlock all features
          </p>

          {/* ================================ */}
          {/* AI Provider — Google AI */}
          {/* ================================ */}
          <div className="rounded-2xl border border-blue-200 dark:border-dark-border overflow-hidden mb-6">
            <div className="bg-blue-50 dark:bg-dark-surface px-5 py-4 border-b border-blue-100 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text">AI Provider</h2>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                    Google AI — Recommended for Students
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Connected */}
              {googleConnState === "connected" && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-3 rounded-xl bg-yl-green-bg dark:bg-yl-green-bg-dark/50 p-3">
                    <CheckCircle2 className="h-5 w-5 text-yl-green shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {googlePicture && (
                          <img src={googlePicture} alt="" className="h-6 w-6 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                          {googleName || googleEmail}
                        </span>
                      </div>
                      {googleEmail && (
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
                          {googleEmail}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleGoogleDisconnect}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-text-muted hover:bg-white dark:bg-dark-bg hover:text-gray-700 dark:hover:text-dark-text dark:text-dark-text-secondary transition-colors"
                    >
                      <LogOut className="h-3 w-3" />
                      Disconnect
                    </button>
                  </div>

                  {/* Gemini Model Selector */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-gray-500 dark:text-dark-text-muted" />
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                          Gemini Model
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"].map((model) => (
                        <button
                          key={model}
                          onClick={() => handleSelectGeminiModel(model)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                            selectedGeminiModel === model
                              ? "border-gray-900 bg-gray-50 dark:bg-dark-surface shadow-sm dark:shadow-none"
                              : "border-gray-100 dark:border-dark-border hover:border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs",
                              selectedGeminiModel === model
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-dark-text-muted"
                            )}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                selectedGeminiModel === model
                                  ? "text-gray-900 dark:text-dark-text"
                                  : "text-gray-700 dark:text-dark-text-secondary"
                              )}
                            >
                              {model}
                            </p>
                          </div>
                          {selectedGeminiModel === model && (
                            <Check className="h-4 w-4 text-gray-900 dark:text-dark-text shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Disconnected */}
              {googleConnState === "disconnected" && (
                <button
                  onClick={handleGoogleConnect}
                  className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-dark-border p-3 text-left transition-all hover:border-blue-300 dark:hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-dark-hover"
                >
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-dark-text">
                    Connect Google Account
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ================================ */}
          {/* AI Provider — GitHub Copilot */}
          {/* ================================ */}
          <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="bg-gray-50 dark:bg-dark-surface px-5 py-4 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                  <Github className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text">AI Provider</h2>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                    GitHub Copilot — For Developers
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Connected */}
              {connState === "connected" && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-3 rounded-xl bg-yl-green-bg dark:bg-yl-green-bg-dark/50 p-3">
                    <CheckCircle2 className="h-5 w-5 text-yl-green shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {userAvatar && (
                          <img src={userAvatar} alt="" className="h-6 w-6 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                          {userLogin || "Connected"}
                        </span>
                      </div>
                      {userEmail && (
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
                          {userEmail}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-text-muted hover:bg-white dark:bg-dark-bg hover:text-gray-700 dark:hover:text-dark-text dark:text-dark-text-secondary transition-colors"
                    >
                      <LogOut className="h-3 w-3" />
                      Disconnect
                    </button>
                  </div>

                  {/* Model Selector */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-gray-500 dark:text-dark-text-muted" />
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                          Model
                        </span>
                      </div>
                      <button
                        onClick={fetchModels}
                        disabled={loadingModels}
                        className="flex items-center gap-1 text-xs text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-3 w-3", loadingModels && "animate-spin")} />
                        Refresh
                      </button>
                    </div>

                    {loadingModels && models.length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-dark-text-muted" />
                        <span className="ml-2 text-sm text-gray-400 dark:text-dark-text-muted">
                          Fetching models...
                        </span>
                      </div>
                    )}

                    {modelsError && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        {modelsError}
                      </div>
                    )}

                    {models.length > 0 && (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => handleSelectModel(model.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                              selectedModel === model.id
                                ? "border-gray-900 bg-gray-50 dark:bg-dark-surface shadow-sm dark:shadow-none"
                                : "border-gray-100 dark:border-dark-border hover:border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs",
                                selectedModel === model.id
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 dark:bg-dark-card text-gray-500 dark:text-dark-text-muted"
                              )}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-medium truncate",
                                  selectedModel === model.id
                                    ? "text-gray-900 dark:text-dark-text"
                                    : "text-gray-700 dark:text-dark-text-secondary"
                                )}
                              >
                                {model.name}
                              </p>
                              {model.version && (
                                <p className="text-[10px] text-gray-400 dark:text-dark-text-muted">
                                  v{model.version}
                                </p>
                              )}
                            </div>
                            {selectedModel === model.id && (
                              <Check className="h-4 w-4 text-gray-900 dark:text-dark-text shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disconnected */}
              {connState !== "connected" && (
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border p-3 text-left transition-all hover:border-gray-300 dark:hover:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover"
                >
                  <Github className="h-5 w-5 text-gray-900 dark:text-dark-text" />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-dark-text">
                    Connect GitHub Account
                  </span>
                </button>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}