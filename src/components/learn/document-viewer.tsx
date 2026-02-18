"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  ChevronDown,
  MoreVertical,
  Volume2,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  title: string;
  totalPages: number;
  contentType?: "pdf" | "youtube" | "text" | "recording";
  youtubeUrl?: string;
}

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇲🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

const zoomLevels = ["50%", "75%", "100%", "125%", "150%", "Page fit", "Page width"];

export function DocumentViewer({ title, totalPages, contentType = "pdf", youtubeUrl }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [currentZoom, setCurrentZoom] = useState("Page fit");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    setListenProgress(0);
    // Simulate read-aloud progress
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

  // YouTube video view
  if (contentType === "youtube" && youtubeUrl) {
    const videoId = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] || "";
    return (
      <div className="flex h-full flex-col bg-black">
        <div className="flex-1 flex items-center justify-center">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-white text-sm">Video not available</div>
          )}
        </div>
        {/* Video controls bar */}
        <div className="flex items-center gap-3 bg-gray-900 px-4 py-2.5">
          <button className="text-xs text-gray-300 hover:text-white transition-colors">Chapters</button>
          <button className="text-xs text-gray-300 hover:text-white transition-colors">Transcripts</button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400">Auto Scroll</span>
            <div className="relative h-4 w-8 rounded-full bg-gray-700 cursor-pointer">
              <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-gray-400 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PDF / Text document view
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-gray-100 px-4">
        <div className="flex items-center gap-3">
          {/* Listen / Read Aloud button */}
          <button
            onClick={toggleListen}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              isListening
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {isListening ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>Listen</span>
          </button>

          {/* Listen progress bar (when active) */}
          {isListening && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="h-1 w-24 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-black transition-all duration-100"
                  style={{ width: `${listenProgress}%` }}
                />
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

          {/* More options menu */}
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
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                    <ZoomIn className="h-3.5 w-3.5" /> Zoom In
                  </button>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                    <ZoomOut className="h-3.5 w-3.5" /> Zoom Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Document content area */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-50 p-8">
        <div className="flex aspect-[3/4] w-full max-w-xl flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="relative flex flex-1 flex-col items-center justify-center p-8">
            <div className="absolute inset-0 opacity-[0.07]">
              <svg viewBox="0 0 400 300" className="h-full w-full">
                <path d="M200 50 Q250 100 230 150 Q210 200 250 250" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.5" />
                <path d="M150 80 Q200 60 220 120 Q240 180 200 220" stroke="#0EA5E9" strokeWidth="2" fill="none" opacity="0.4" />
                <circle cx="180" cy="130" r="30" stroke="#A855F7" strokeWidth="1.5" fill="none" opacity="0.3" />
                <circle cx="220" cy="170" r="20" stroke="#F43F5E" strokeWidth="1.5" fill="none" opacity="0.3" />
              </svg>
            </div>
            <div className="relative z-10 text-center">
              <span className="text-5xl font-bold text-teal-600/30">11</span>
              <h2 className="mt-2 text-xl font-bold text-gray-900">{title}</h2>
              <div className="mx-auto mt-2 h-0.5 w-24 bg-orange-400" />
              <p className="mt-4 text-xs text-gray-400">Page {currentPage} of {totalPages}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
