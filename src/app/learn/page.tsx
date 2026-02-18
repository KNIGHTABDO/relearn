"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { DocumentViewer } from "@/components/learn/document-viewer";
import { LearningPanel } from "@/components/learn/learning-panel";
import { FloatingActionBar } from "@/components/learn/floating-action-bar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LearnPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const documentId = searchParams.get("id") || undefined;
  const spaceId = searchParams.get("spaceId") || undefined;
  const [docTitle, setDocTitle] = useState("Document");
  const [pageCount, setPageCount] = useState(19);
  const [contentType, setContentType] = useState<"pdf" | "youtube" | "text" | "recording" | "image">("pdf");
  const [youtubeUrl, setYoutubeUrl] = useState<string | undefined>();
  const [documentText, setDocumentText] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const [showPanel, setShowPanel] = useState(true);

  // On tablet/mobile, default to panel hidden
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    if (mq.matches) setShowPanel(false);
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setShowPanel(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (documentId) {
      fetch(`/api/document/${documentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.title) setDocTitle(data.title);
          if (data.pageCount) setPageCount(data.pageCount);
          if (data.type) setContentType(data.type);
          if (data.text) setDocumentText(data.text);

          // For PDFs, set URL to the PDF serving endpoint
          if (data.type === "pdf") {
            setPdfUrl(`/api/document/${documentId}/pdf`);
          }

          // YouTube
          if (data.type === "youtube") {
            if (data.url) {
              setYoutubeUrl(data.url);
            } else if (data.text) {
              const urlMatch = data.text.match(/URL:\s*(https?:\/\/[^\s\n]+)/);
              if (urlMatch) setYoutubeUrl(urlMatch[1]);
            }
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
    <div className="flex h-[100dvh] flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
      <Header title={docTitle} onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Document Viewer — takes full width when panel hidden */}
        <div className={cn("relative flex-1 overflow-hidden transition-all duration-200", showPanel && "lg:mr-0")}>
          <DocumentViewer
            title={docTitle}
            totalPages={pageCount}
            contentType={contentType}
            youtubeUrl={youtubeUrl}
            documentText={documentText}
            pdfUrl={pdfUrl}
          />
          {contentType !== "youtube" && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 md:bottom-6">
              <FloatingActionBar />
            </div>
          )}
        </div>

        {/* Toggle panel button */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={cn(
            "absolute right-0 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-l-lg border border-r-0 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-all",
            showPanel && "lg:right-[380px] right-[320px]"
          )}
        >
          {showPanel ? (
            <PanelLeftClose className="h-3.5 w-3.5 text-gray-500 dark:text-dark-text-muted" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5 text-gray-500 dark:text-dark-text-muted" />
          )}
        </button>

        {/* Right: Learning Panel — slide in/out */}
        <div
          className={cn(
            "shrink-0 border-l border-gray-100 dark:border-dark-border transition-all duration-200 overflow-hidden",
            showPanel ? "w-[320px] lg:w-[380px]" : "w-0"
          )}
        >
          {showPanel && (
            <LearningPanel
              documentId={documentId}
              spaceId={spaceId}
              className="w-[320px] lg:w-[380px] h-full"
            />
          )}
        </div>

        {/* Mobile overlay for learning panel */}
        {showPanel && (
          <div
            className="fixed inset-0 z-10 bg-black/20 dark:bg-black/50 lg:hidden"
            onClick={() => setShowPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
