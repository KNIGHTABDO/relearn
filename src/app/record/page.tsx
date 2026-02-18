"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { Mic } from "lucide-react";

export default function RecordPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <Mic className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Record a lecture
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Record your class or video call and AI will transform it into study materials
          </p>
          <button className="mt-6 btn-pill-primary">
            Start Recording
          </button>
        </div>
      </main>
    </div>
  );
}
