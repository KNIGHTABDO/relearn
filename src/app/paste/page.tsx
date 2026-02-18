"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { Link2, ArrowRight } from "lucide-react";

export default function PastePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");

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
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2 transition-all focus-within:border-gray-300 focus-within:shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste YouTube URL, website, or text..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {input && (
                <button className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800">
                  <span>Learn</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-300">
            Supports YouTube, websites, and raw text
          </p>
        </div>
      </main>
    </div>
  );
}
