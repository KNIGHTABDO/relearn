"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { DocumentViewer } from "@/components/learn/document-viewer";
import { LearningPanel } from "@/components/learn/learning-panel";
import { FloatingActionBar } from "@/components/learn/floating-action-bar";

export default function LearnPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const documentId = searchParams.get("id") || undefined;
  const [docTitle, setDocTitle] = useState("The Genetic Code and Translation");

  useEffect(() => {
    if (documentId) {
      fetch(`/api/document/${documentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.title) setDocTitle(data.title);
        })
        .catch(() => {});
    }
  }, [documentId]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header title={docTitle} onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Two-panel split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document Viewer (~60%) */}
        <div className="relative flex-[3] overflow-hidden">
          <DocumentViewer title={docTitle} totalPages={19} />

          {/* Floating action bar */}
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
            <FloatingActionBar />
          </div>
        </div>

        {/* Right: Learning Panel (~40%) */}
        <LearningPanel documentId={documentId} className="w-[380px] shrink-0" />
      </div>
    </div>
  );
}
