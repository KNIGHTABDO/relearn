"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Volume2,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Check,
  FileText,
  Clock,
  BookOpen,
  AlignLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  title: string;
  totalPages: number;
  contentType?: "pdf" | "youtube" | "text" | "recording" | "image";
  youtubeUrl?: string;
  documentText?: string;
}

const zoomLevels = ["50%", "75%", "100%", "125%", "150%", "Page fit", "Page width"];

export function DocumentViewer({
  title,
  totalPages,
  contentType = "pdf",
  youtubeUrl,
  documentText,
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [currentZoom, setCurrentZoom] = useState("Page fit");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
  // YouTube Video View
  // =====================
  if (contentType === "youtube" && youtubeUrl) {
    const videoId = youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&\s?]+)/)?.[1] || "";

    return (
      <div className="flex h-full flex-col bg-black">
        {/* Video player */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-white text-sm">Video not available</div>
          )}
        </div>

        {/* Tabs bar */}
        <div className="bg-gray-900 border-t border-gray-800">
          <div className="flex items-center gap-1 px-4 pt-2">
            <button
              onClick={() => setYtTab("video")}
              className={cn(
                "rounded-t-lg px-4 py-2 text-xs font-medium transition-colors",
                ytTab === "video"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              Video
            </button>
            <button
              onClick={() => setYtTab("transcript")}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-medium transition-colors",
                ytTab === "transcript"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-300"
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
            <div className="max-h-48 overflow-y-auto bg-gray-800 px-4 py-3">
              {transcriptEntries.length > 0 ? (
                <div className="space-y-2">
                  {transcriptEntries.map((entry, i) => (
                    <div key={i} className="flex gap-3 group">
                      {entry.time && (
                        <span className="shrink-0 text-[11px] font-mono text-blue-400 mt-0.5 w-12 text-right">
                          {entry.time}
                        </span>
                      )}
                      <p className="text-xs leading-relaxed text-gray-300 group-hover:text-white transition-colors">
                        {entry.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">
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
  if (contentType === "text" || contentType === "recording") {
    return (
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex h-11 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleListen}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                isListening ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {isListening ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              Listen
            </button>
            {isListening && (
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="h-1 w-24 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full bg-black transition-all" style={{ width: `${listenProgress}%` }} />
                </div>
                <Volume2 className="h-3 w-3 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <FileText className="h-3 w-3" />
            <span>{contentType === "recording" ? "Recording" : "Text Document"}</span>
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{title}</h1>
            <div className="prose prose-sm prose-gray max-w-none">
              {(documentText || "No content available.").split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-gray-700 mb-3">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // PDF Document View
  // =====================
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-gray-100 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleListen}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              isListening ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {isListening ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            Listen
          </button>
          {isListening && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="h-1 w-24 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-black transition-all" style={{ width: `${listenProgress}%` }} />
              </div>
              <Volume2 className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Page navigation */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 1 && v <= totalPages) setCurrentPage(v);
              }}
              className="w-8 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-center text-xs text-gray-700 outline-none focus:border-gray-300"
              min={1}
              max={totalPages}
            />
            <span>/</span>
            <span>{totalPages}</span>
          </div>

          {/* Zoom dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowZoomDropdown(!showZoomDropdown); setShowMoreMenu(false); }}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>{currentZoom}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showZoomDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowZoomDropdown(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-32 rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
                  {zoomLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => { setCurrentZoom(level); setShowZoomDropdown(false); }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors",
                        currentZoom === level ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <span>{level}</span>
                      {currentZoom === level && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* More options */}
          <div className="relative">
            <button
              onClick={() => { setShowMoreMenu(!showMoreMenu); setShowZoomDropdown(false); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF content area — rendered text from extracted content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl">
          {documentText && documentText.length > 100 ? (
            <div className="space-y-4">
              {/* PDF page simulation — renders actual extracted text */}
              {splitIntoPages(documentText, totalPages).map((pageText, i) => (
                <div
                  key={i}
                  id={`page-${i + 1}`}
                  className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  {/* Page header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2">
                    <span className="text-[10px] font-medium text-gray-400">Page {i + 1}</span>
                  </div>
                  {/* Page content */}
                  <div className="px-8 py-6 min-h-[200px]">
                    {pageText.split("\n\n").map((para, j) => {
                      // Detect headings (all caps or short lines)
                      const isHeading = para.length < 80 && para === para.toUpperCase() && para.length > 3;
                      if (isHeading) {
                        return (
                          <h3 key={j} className="text-sm font-bold text-gray-900 mt-4 mb-2">
                            {para}
                          </h3>
                        );
                      }
                      return (
                        <p key={j} className="text-[13px] leading-relaxed text-gray-700 mb-3">
                          {para}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Placeholder when no real text available */
            <div className="flex aspect-[3/4] w-full max-w-xl mx-auto flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="relative flex flex-1 flex-col items-center justify-center p-8">
                <div className="absolute inset-0 opacity-[0.07]">
                  <svg viewBox="0 0 400 300" className="h-full w-full">
                    <path d="M200 50 Q250 100 230 150 Q210 200 250 250" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.5" />
                    <path d="M150 80 Q200 60 220 120 Q240 180 200 220" stroke="#0EA5E9" strokeWidth="2" fill="none" opacity="0.4" />
                    <circle cx="180" cy="130" r="30" stroke="#A855F7" strokeWidth="1.5" fill="none" opacity="0.3" />
                  </svg>
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl font-bold text-teal-600/30">{totalPages}</span>
                  <h2 className="mt-2 text-xl font-bold text-gray-900">{title}</h2>
                  <div className="mx-auto mt-2 h-0.5 w-24 bg-orange-400" />
                  <p className="mt-4 text-xs text-gray-400">
                    {totalPages} pages — upload a PDF to see rendered content
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Split text into approximately equal pages
function splitIntoPages(text: string, numPages: number): string[] {
  if (!text) return [""];
  const paragraphs = text.split("\n\n").filter(Boolean);
  if (paragraphs.length <= numPages) {
    return paragraphs.map((p) => p);
  }

  const pages: string[] = [];
  const parasPerPage = Math.ceil(paragraphs.length / Math.max(numPages, 1));

  for (let i = 0; i < paragraphs.length; i += parasPerPage) {
    pages.push(paragraphs.slice(i, i + parasPerPage).join("\n\n"));
  }

  return pages.length > 0 ? pages : [text];
}
