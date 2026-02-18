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
  const spaceId = searchParams.get("spaceId") || undefined;
  const [docTitle, setDocTitle] = useState("Document");
  const [pageCount, setPageCount] = useState(19);
  const [contentType, setContentType] = useState<"pdf" | "youtube" | "text" | "recording">("pdf");
  const [youtubeUrl, setYoutubeUrl] = useState<string | undefined>();

  useEffect(() => {
    if (documentId) {
      fetch(`/api/document/${documentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.title) setDocTitle(data.title);
          if (data.pageCount) setPageCount(data.pageCount);
          if (data.type) setContentType(data.type);
          // Extract YouTube URL from text if it's a YouTube doc
          if (data.type === "youtube" && data.text) {
            const urlMatch = data.text.match(/URL:\s*(https?:\/\/[^\s\n]+)/);
            if (urlMatch) setYoutubeUrl(urlMatch[1]);
          }
        })
        .catch(() => {});
    } else if (spaceId) {
      fetch(`/api/spaces/${spaceId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.name) setDocTitle(data.name + " (Space)");
        })
        .catch(() => {});
    }
  }, [documentId, spaceId]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header title={docTitle} onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document Viewer */}
        <div className="relative flex-[3] overflow-hidden">
          <DocumentViewer
            title={docTitle}
            totalPages={pageCount}
            contentType={contentType}
            youtubeUrl={youtubeUrl}
          />
          {contentType !== "youtube" && (
            <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
              <FloatingActionBar />
            </div>
          )}
        </div>

        {/* Right: Learning Panel */}
        <LearningPanel
          documentId={documentId}
          spaceId={spaceId}
          className="w-[380px] shrink-0"
        />
      </div>
    </div>
  );
}
