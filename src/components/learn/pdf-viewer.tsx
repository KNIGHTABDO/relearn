"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { pdfjs } from "react-pdf";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Volume2,
  Download,
  Printer,
  Check,
  Loader2,
  AlertCircle,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectionToolbar, SelectionAction } from "./selection-toolbar";

// Set pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  /** The file source: URL string, File object, or ArrayBuffer */
  file: string | File | ArrayBuffer | null;
  title: string;
}

const ZOOM_LEVELS = [
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.0 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2.0 },
];

export function PDFViewer({ file, title }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // Handle PDF text selection actions
  const handleSelectionAction = useCallback((action: SelectionAction, text: string) => {
    // Dispatch a custom event that the learning panel / chat panel can listen to
    window.dispatchEvent(
      new CustomEvent("pdf-selection-action", {
        detail: { action, text },
      })
    );
  }, []);

  // Measure container width for responsive page sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setContainerWidth(w);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll to page on page number change
  const scrollToPage = useCallback((page: number) => {
    const el = document.getElementById(`pdf-page-${page}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Track visible page on scroll
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || numPages === 0) return;

    const handleScroll = () => {
      const scrollTop = scrollEl.scrollTop;
      const viewCenter = scrollTop + scrollEl.clientHeight / 3;

      for (let i = numPages; i >= 1; i--) {
        const pageEl = document.getElementById(`pdf-page-${i}`);
        if (pageEl && pageEl.offsetTop <= viewCenter) {
          if (currentPage !== i) setCurrentPage(i);
          break;
        }
      }
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [numPages, currentPage]);

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    setError("Failed to load PDF");
    setLoading(false);
    console.error("PDF load error:", err);
  };

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

  // Calculate page width based on container and zoom
  const pageWidth = Math.max(300, (containerWidth - 64) * scale); // 64px for padding

  const zoomLabel = ZOOM_LEVELS.find((z) => z.value === scale)?.label || `${Math.round(scale * 100)}%`;

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-100 dark:border-dark-border px-3 md:px-4 gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Listen */}
          <button
            onClick={toggleListen}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all shrink-0",
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

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {/* Page navigation */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-text-muted">
            <button
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); scrollToPage(p); }}
              disabled={currentPage <= 1}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card disabled:opacity-30"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <span className="tabular-nums min-w-[3ch] text-center">{currentPage}</span>
            <span>/</span>
            <span>{numPages || "–"}</span>
            <button
              onClick={() => { const p = Math.min(numPages, currentPage + 1); setCurrentPage(p); scrollToPage(p); }}
              disabled={currentPage >= numPages}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card disabled:opacity-30"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 border-l border-gray-200 dark:border-dark-border pl-1.5 md:pl-3">
            <button
              onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card"
            >
              <Minus className="h-3 w-3 text-gray-500 dark:text-dark-text-muted" />
            </button>
            <div className="relative">
              <button
                onClick={() => { setShowZoomDropdown(!showZoomDropdown); setShowMoreMenu(false); }}
                className="flex items-center gap-0.5 rounded px-1.5 py-1 text-xs text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface tabular-nums min-w-[4ch]"
              >
                {zoomLabel}
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
              {showZoomDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowZoomDropdown(false)} />
                  <div className="absolute right-0 top-full z-40 mt-1 w-24 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg py-1 shadow-lg animate-fade-in">
                    {ZOOM_LEVELS.map((z) => (
                      <button
                        key={z.value}
                        onClick={() => { setScale(z.value); setShowZoomDropdown(false); }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors",
                          scale === z.value ? "bg-gray-50 dark:bg-dark-surface font-medium" : "text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
                        )}
                      >
                        <span>{z.label}</span>
                        {scale === z.value && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card"
            >
              <Plus className="h-3 w-3 text-gray-500 dark:text-dark-text-muted" />
            </button>
          </div>

          {/* More menu */}
          <div className="relative border-l border-gray-200 dark:border-dark-border pl-1.5">
            <button
              onClick={() => { setShowMoreMenu(!showMoreMenu); setShowZoomDropdown(false); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
            >
              <MoreVertical className="h-3.5 w-3.5 text-gray-500 dark:text-dark-text-muted" />
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg py-1 shadow-lg animate-fade-in">
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Pages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-dark-border">
        <div ref={pdfContentRef} className="relative">
          <SelectionToolbar containerRef={pdfContentRef} onAction={handleSelectionAction} />
        {!file ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-dark-text-muted">No PDF file loaded</p>
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex h-full items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300 dark:text-dark-text-muted" />
              </div>
            }
            error={
              <div className="flex h-full flex-col items-center justify-center py-20">
                <AlertCircle className="h-8 w-8 text-gray-300 dark:text-dark-text-muted" />
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">Failed to load PDF</p>
              </div>
            }
          >
            <div className="flex flex-col items-center gap-4 px-4 py-6 md:px-8">
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i + 1}
                  id={`pdf-page-${i + 1}`}
                  className="shadow-md bg-white dark:bg-dark-bg rounded-sm"
                >
                  <Page
                    pageNumber={i + 1}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div
                        className="flex items-center justify-center bg-white dark:bg-dark-bg dark:bg-dark-bg"
                        style={{ width: pageWidth, height: pageWidth * 1.414 }}
                      >
                        <Loader2 className="h-6 w-6 animate-spin text-gray-200" />
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </Document>
        )}
        </div>
      </div>
    </div>
  );
}
