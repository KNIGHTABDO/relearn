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

  // User info
  const [userLogin, setUserLogin] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Models
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModelState] = useState("gpt-4o");
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Initialize from stored auth
  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.githubToken) {
      setConnState("connected");
      setUserLogin(auth.login || null);
      setUserEmail(auth.email || null);
      setUserAvatar(auth.avatarUrl || null);
    }
    setSelectedModelState(getSelectedModel());
  }, []);

  // Fetch models when connected
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
    } catch (err) {
      setModelsError("Network error fetching models");
    }
    setLoadingModels(false);
  }, [selectedModel]);

  useEffect(() => {
    if (connState === "connected") {
      fetchModels();
    }
  }, [connState, fetchModels]);

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

    // Open GitHub in new tab
    window.open(deviceData.verification_uri, "_blank");

    // Start polling
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

  const handleSelectModel = (modelId: string) => {
    setSelectedModelState(modelId);
    setSelectedModel(modelId);
  };

  const copyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header title="Settings" onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-8">

          {/* ================================ */}
          {/* AI Provider — GitHub Copilot     */}
          {/* ================================ */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                  <Github className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">AI Provider</h2>
                  <p className="text-xs text-gray-500">GitHub Copilot — link your GitHub to use AI features</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Connected state */}
              {connState === "connected" && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-3 rounded-xl bg-yl-green-bg/50 p-3">
                    <CheckCircle2 className="h-5 w-5 text-yl-green shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {userAvatar && (
                          <img src={userAvatar} alt="" className="h-6 w-6 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{userLogin || "Connected"}</span>
                      </div>
                      {userEmail && <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>}
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
                    >
                      <LogOut className="h-3 w-3" />
                      Disconnect
                    </button>
                  </div>

                  {/* Model Selector */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">Model</span>
                      </div>
                      <button
                        onClick={fetchModels}
                        disabled={loadingModels}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-3 w-3", loadingModels && "animate-spin")} />
                        Refresh
                      </button>
                    </div>

                    {loadingModels && models.length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-400">Fetching models...</span>
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
                                ? "border-gray-900 bg-gray-50 shadow-sm"
                                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs",
                              selectedModel === model.id
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-500"
                            )}>
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                selectedModel === model.id ? "text-gray-900" : "text-gray-700"
                              )}>
                                {model.name}
                              </p>
                              {model.version && (
                                <p className="text-[10px] text-gray-400">v{model.version}</p>
                              )}
                            </div>
                            {selectedModel === model.id && (
                              <Check className="h-4 w-4 text-gray-900 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Current model indicator */}
                    {models.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                        <Zap className="h-3 w-3 text-yl-gold" />
                        <span className="text-xs text-gray-500">Active model:</span>
                        <span className="text-xs font-medium text-gray-900">{selectedModel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disconnected state */}
              {connState === "disconnected" && (
                <div className="text-center py-2 animate-fade-in">
                  <p className="text-sm text-gray-500 mb-4">
                    Connect your GitHub account to unlock AI-powered study tools with models like GPT-4o, Claude, and more.
                  </p>
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    Connect GitHub
                  </button>
                </div>
              )}

              {/* Connecting state */}
              {connState === "connecting" && (
                <div className="flex items-center justify-center py-6 animate-fade-in">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">Starting login...</span>
                </div>
              )}

              {/* Awaiting auth state */}
              {connState === "awaiting_auth" && userCode && (
                <div className="text-center py-2 animate-fade-in">
                  <p className="text-sm text-gray-600 mb-3">
                    Enter this code on GitHub:
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-6 py-4">
                    <span className="font-mono text-2xl font-bold tracking-[0.3em] text-gray-900">{userCode}</span>
                    <button onClick={copyCode} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
                      {codeCopied ? <Check className="h-4 w-4 text-yl-green" /> : <Copy className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Waiting for authorization...</span>
                  </div>
                  {verificationUri && (
                    <a
                      href={verificationUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                    >
                      Open GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Error state */}
              {connState === "error" && (
                <div className="text-center py-2 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-red-500 mb-3">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Connection failed</span>
                  </div>
                  {errorMsg && <p className="text-xs text-gray-500 mb-4">{errorMsg}</p>}
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Other settings */}
          <div className="mt-6 space-y-1">
            <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-gray-400">
              General
            </h3>
            {[
              { icon: Globe, label: "Language", desc: "English (US)" },
              { icon: Bell, label: "Notifications", desc: "Email and push notifications" },
              { icon: Palette, label: "Appearance", desc: "Light mode" },
            ].map((item) => (
              <button key={item.label} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                  <item.icon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-1">
            <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-gray-400">
              Support
            </h3>
            {[
              { icon: HelpCircle, label: "Help Center", desc: "FAQs and guides" },
              { icon: Shield, label: "Privacy & Terms", desc: "Privacy policy, terms of service" },
            ].map((item) => (
              <button key={item.label} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                  <item.icon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
