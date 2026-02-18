"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { Link2, ArrowRight, Loader2 } from "lucide-react";

export default function PastePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    try {
      const formData = new FormData();
      // Check if it's a YouTube URL
      if (input.includes("youtube.com") || input.includes("youtu.be")) {
        formData.append("youtube_url", input.trim());
      } else {
        formData.append("text", input.trim());
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/learn?id=${data.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Paste a link or text
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            YouTube video, website URL, or raw text
          </p>

          <div className="mt-8">
            <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-2 transition-all focus-within:border-gray-300 focus-within:shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 mt-0.5">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste YouTube URL, website, or text..."
                rows={4}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none mt-2"
              />
            </div>
            {input.trim() && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full btn-pill-primary py-3 text-sm gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Learning
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-300">
            Supports YouTube, websites, and raw text
          </p>
        </div>
      </main>
    </div>
  );
}
