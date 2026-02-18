"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { Upload, Link2, Mic, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const inputCards = [
  {
    title: "Upload",
    description: "File, audio, video",
    icon: Upload,
    href: "/upload",
    color: "text-gray-700",
  },
  {
    title: "Paste",
    description: "YouTube, website, text",
    icon: Link2,
    href: "/paste",
    color: "text-gray-700",
  },
  {
    title: "Record",
    description: "Record class, video call",
    icon: Mic,
    href: "/record",
    color: "text-gray-700",
  },
];

export default function StartPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          {/* Main heading */}
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            What do you want to learn?
          </h1>

          {/* Input cards */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {inputCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-5 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <card.icon className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {card.title}
                </span>
                <span className="text-[11px] text-gray-400">
                  {card.description}
                </span>
              </Link>
            ))}
          </div>

          {/* Chat input - "Learn anything..." */}
          <div className="relative mt-8">
            <div className="flex items-center rounded-full border border-gray-200 bg-white px-5 py-3 shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md">
              <Sparkles className="mr-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Learn anything..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              <button className="ml-2 flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800">
                <span>Learn</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
