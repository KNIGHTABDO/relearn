"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { DocumentViewer } from "@/components/learn/document-viewer";
import { LearningPanel } from "@/components/learn/learning-panel";
import { FloatingActionBar } from "@/components/learn/floating-action-bar";

export default function LearnPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header
        title="The Genetic Code and Translation"
        onMenuClick={() => setSidebarOpen(true)}
      />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Two-panel split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document Viewer (~60%) */}
        <div className="relative flex-[3] overflow-hidden">
          <DocumentViewer
            title="The Genetic Code & Translation"
            totalPages={19}
          />

          {/* Floating action bar - centered at bottom */}
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <FloatingActionBar />
          </div>
        </div>

        {/* Right: Learning Panel (~40%) */}
        <LearningPanel className="w-[380px] shrink-0" />
      </div>
    </div>
  );
}
