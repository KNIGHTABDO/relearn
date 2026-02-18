"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  FileText,
  AlignLeft,
  MoreVertical,
  Download,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFViewer } from "./pdf-viewer";

interface DocumentViewerProps {
  title: string;
  totalPages: number;
  contentType?: "pdf" | "youtube" | "text" | "recording" | "image";
  youtubeUrl?: string;
  documentText?: string;
  /** URL to the raw PDF file for real rendering */
  pdfUrl?: string;
}

export function DocumentViewer({
  title,
  totalPages,
  contentType = "pdf",
  youtubeUrl,
  documentText,
  pdfUrl,
}: DocumentViewerProps) {
  const [isListening, setIsListening] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [ytTab, setYtTab] = useState<"video" | "transcript">("video");
  const [transcriptEntries, setTranscriptEntries] = useState<any[]>([]);

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    setListenProgress(0);
    const interval = setInterval(() => {
      setListenProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsListening(false);
          return 0;
        }
        return prev + 0.5;
      });
    }, 100);
  };

  // Parse transcript entries from document text
  useEffect(() => {
    if (contentType === "youtube" && documentText) {
      const transcriptSection = documentText.split("--- TRANSCRIPT ---")[1];
      if (transcriptSection) {
        const entries = transcriptSection
          .trim()
          .split("\n\n")
          .filter(Boolean)
          .map((block) => {
            const timeMatch = block.match(/^\[(\d+:\d+(?::\d+)?)\]\s*/);
            if (timeMatch) {
              return {
                time: timeMatch[1],
                text: block.slice(timeMatch[0].length).trim(),
              };
            }
            return { time: "", text: block.trim() };
          })
          .filter((e) => e.text);
        setTranscriptEntries(entries);
      }
    }
  }, [contentType, documentText]);

  // =====================
  // PDF — Real renderer
  // =====================
  if (contentType === "pdf") {
    return <PDFViewer file={pdfUrl || null} title={title} />;
  }

  // =====================
  // YouTube Video View
  // =====================
  if (contentType === "youtube" && youtubeUrl) {
    const videoId = youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&\s?]+)/)?.[1] || "";

    return (
      <div className="flex h-full flex-col bg-black">
        {/* Video player — responsive aspect ratio */}
        <div className="relative w-full flex-1 min-h-0">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white text-sm">
              Video not available
            </div>
          )}
        </div>

        {/* Tabs bar */}
        <div className="bg-gray-900 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-1 px-3 pt-2 md:px-4">
            <button
              onClick={() => setYtTab("video")}
              className={cn(
                "rounded-t-lg px-3 py-2 text-xs font-medium transition-colors md:px-4",
                ytTab === "video" ? "bg-gray-800 text-white" : "text-gray-400 dark:text-dark-text-muted hover:text-gray-300 dark:text-dark-text-muted"
              )}
            >
              Video
            </button>
            <button
              onClick={() => setYtTab("transcript")}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors md:px-4",
                ytTab === "transcript" ? "bg-gray-800 text-white" : "text-gray-400 dark:text-dark-text-muted hover:text-gray-300 dark:text-dark-text-muted"
              )}
            >
              <AlignLeft className="h-3 w-3" />
              Transcript
              {transcriptEntries.length > 0 && (
                <span className="rounded-full bg-gray-700 px-1.5 py-0.5 text-[9px]">
                  {transcriptEntries.length}
                </span>
              )}
            </button>
          </div>

          {/* Transcript panel */}
          {ytTab === "transcript" && (
            <div className="max-h-48 overflow-y-auto bg-gray-800 px-3 py-3 md:px-4">
              {transcriptEntries.length > 0 ? (
                <div className="space-y-2">
                  {transcriptEntries.map((entry, i) => (
                    <div key={i} className="flex gap-2 group md:gap-3">
                      {entry.time && (
                        <span className="shrink-0 text-[11px] font-mono text-blue-400 mt-0.5 w-10 text-right md:w-12">
                          {entry.time}
                        </span>
                      )}
                      <p className="text-xs leading-relaxed text-gray-300 dark:text-dark-text-muted group-hover:text-white transition-colors">
                        {entry.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-dark-text-muted text-center py-4">
                  No transcript available for this video
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================
  // Text / Recording View
  // =====================
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-100 dark:border-dark-border px-3 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleListen}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
              isListening ? "bg-black text-white" : "text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
            )}
          >
            {isListening ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Listen</span>
          </button>
          {isListening && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="h-1 w-16 md:w-24 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
                <div className="h-full rounded-full bg-black transition-all" style={{ width: `${listenProgress}%` }} />
              </div>
              <Volume2 className="h-3 w-3 text-gray-400 dark:text-dark-text-muted hidden sm:block" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-dark-text-muted">
          <FileText className="h-3 w-3" />
          <span className="hidden sm:inline">{contentType === "recording" ? "Recording" : "Text Document"}</span>
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-dark-bg md:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4 md:text-xl">{title}</h1>
          <div className="prose prose-sm prose-gray max-w-none">
            {(documentText || "No content available.").split("\n\n").map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-gray-700 dark:text-dark-text-secondary mb-3">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
