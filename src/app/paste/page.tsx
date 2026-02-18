"use client";

import React, { useState , Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  Link2,
  FileText,
  Youtube,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InputMode = "youtube" | "website" | "text";

function PastePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("spaceId");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("youtube");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (mode === "youtube") {
        formData.append("youtube_url", input.trim());
      } else {
        formData.append("text", input.trim());
      }
      if (spaceId) formData.append("space_id", spaceId);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.id) {
        router.push(`/learn?id=${data.id}`);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id: "youtube" as InputMode, label: "YouTube", icon: Youtube, placeholder: "Paste YouTube URL..." },
    { id: "website" as InputMode, label: "Website", icon: Globe, placeholder: "Paste website URL..." },
    { id: "text" as InputMode, label: "Text", icon: FileText, placeholder: "Paste your text content here..." },
  ];

  const activeMode = modes.find((m) => m.id === mode)!;

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-dark-surface dark:bg-dark-surface">
              <Link2 className="h-6 w-6 text-gray-400 dark:text-dark-text-muted" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-dark-text">Paste content</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
              {spaceId ? "Add content to your space" : "YouTube videos, websites, or text"}
            </p>
          </div>

          {/* Mode selector */}
          <div className="mx-auto mt-6 flex w-fit rounded-xl border border-gray-200 dark:border-dark-border p-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setInput(""); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all",
                  mode === m.id
                    ? "bg-black text-white"
                    : "text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text dark:text-dark-text-secondary"
                )}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Input area */}
          <div className="mt-6">
            {mode === "text" ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeMode.placeholder}
                rows={8}
                className="w-full rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-5 py-4 text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted dark:text-dark-text-muted outline-none focus:border-gray-300 dark:focus:border-dark-border dark:border-dark-border focus:shadow-sm dark:focus:shadow-none resize-none"
              />
            ) : (
              <div className="flex items-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-5 py-3 focus-within:border-gray-300 dark:focus-within:border-dark-border dark:border-dark-border focus-within:shadow-sm dark:focus-within:shadow-none">
                <activeMode.icon className="mr-3 h-4 w-4 text-gray-400 dark:text-dark-text-muted" />
                <input
                  type="url"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={activeMode.placeholder}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted dark:text-dark-text-muted outline-none"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="mt-4 w-full btn-pill-primary py-3 text-sm gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                Start Learning
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function PastePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" /></div>}>
      <PastePageInner />
    </Suspense>
  );
}
