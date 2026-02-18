"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare,
  HelpCircle,
  BookOpen,
  Layers,
  StickyNote,
  Volume2,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAction: (action: SelectionAction, text: string) => void;
}

export type SelectionAction =
  | "explain"
  | "chat"
  | "quiz"
  | "flashcards"
  | "add_notes"
  | "read_aloud"
  | "summarize";

interface ToolbarPosition {
  x: number;
  y: number;
  visible: boolean;
}

const actions: { action: SelectionAction; icon: React.ElementType; labelKey: string; color: string }[] = [
  { action: "explain", icon: Sparkles, labelKey: "selection.explain", color: "text-purple-500" },
  { action: "chat", icon: MessageSquare, labelKey: "selection.chat", color: "text-blue-500" },
  { action: "quiz", icon: HelpCircle, labelKey: "selection.quiz", color: "text-pink-500" },
  { action: "flashcards", icon: Layers, labelKey: "selection.flashcards", color: "text-orange-500" },
  { action: "add_notes", icon: StickyNote, labelKey: "selection.add_notes", color: "text-yellow-600" },
  { action: "read_aloud", icon: Volume2, labelKey: "selection.read_aloud", color: "text-green-500" },
  { action: "summarize", icon: BookOpen, labelKey: "selection.summarize", color: "text-sky-500" },
];

export function SelectionToolbar({ containerRef, onAction }: SelectionToolbarProps) {
  const [position, setPosition] = useState<ToolbarPosition>({ x: 0, y: 0, visible: false });
  const [selectedText, setSelectedText] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setPosition((prev) => ({ ...prev, visible: false }));
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) return; // Ignore tiny selections

    // Check if selection is within our container
    const container = containerRef.current;
    if (!container) return;

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    if (!container.contains(ancestor)) return;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Position toolbar above the selection, centered
    const toolbarWidth = 420; // approximate width
    let x = rect.left + rect.width / 2 - containerRect.left;
    let y = rect.top - containerRect.top - 12; // 12px above selection

    // Clamp x to stay within container
    x = Math.max(toolbarWidth / 2, Math.min(x, containerRect.width - toolbarWidth / 2));

    // If too close to top, show below selection instead
    if (y < 50) {
      y = rect.bottom - containerRect.top + 12;
    }

    setSelectedText(text);
    setPosition({ x, y, visible: true });
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Small delay to let selection finalize
      setTimeout(updatePosition, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Hide toolbar if clicking outside it
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setPosition((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPosition((prev) => ({ ...prev, visible: false }));
        window.getSelection()?.removeAllRanges();
      }
    };

    container.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [containerRef, updatePosition]);

  const handleAction = (action: SelectionAction) => {
    onAction(action, selectedText);
    setPosition((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  if (!position.visible || !selectedText) return null;

  // Try to use i18n, fallback to static labels
  let t: (key: string) => string;
  try {
    // Dynamic import would break here, so we use a simple fallback map
    const fallbackLabels: Record<string, string> = {
      "selection.explain": "Explain",
      "selection.chat": "Chat",
      "selection.quiz": "Quiz",
      "selection.flashcards": "Flashcards",
      "selection.add_notes": "Notes",
      "selection.read_aloud": "Read",
      "selection.summarize": "Summarize",
    };
    t = (key: string) => fallbackLabels[key] || key;
  } catch {
    t = (key: string) => key.split(".").pop() || key;
  }

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "absolute z-50 transform -translate-x-1/2",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
        "duration-200"
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Arrow pointing down to selection */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-0.5 px-2 py-1.5 rounded-xl",
            "bg-white dark:bg-zinc-800",
            "border border-gray-200 dark:border-zinc-700",
            "shadow-lg shadow-black/10 dark:shadow-black/30",
            "backdrop-blur-sm"
          )}
        >
          {actions.map(({ action, icon: Icon, labelKey, color }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                "text-xs font-medium",
                "text-gray-600 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-zinc-700",
                "transition-colors duration-150",
                "whitespace-nowrap"
              )}
              title={t(labelKey)}
            >
              <Icon className={cn("w-3.5 h-3.5", color)} />
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </button>
          ))}
        </div>
        {/* Down arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5">
          <div className="w-3 h-3 rotate-45 bg-white dark:bg-zinc-800 border-r border-b border-gray-200 dark:border-zinc-700" />
        </div>
      </div>
    </div>
  );
}
