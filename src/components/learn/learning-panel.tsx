"use client";

import React, { useState } from "react";
import {
  Headphones,
  Video,
  FileText,
  ClipboardCheck,
  Layers,
  StickyNote,
  BookOpen,
  Settings,
  ChevronRight,
  AudioLines,
  X,
  Plus,
  Maximize2,
  Send,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { FlashcardViewer } from "./flashcard-viewer";
import { QuizViewer } from "./quiz-viewer";

type ActiveView = "generate" | "chat" | "flashcards" | "quiz" | "summary";

const generateCards = [
  {
    title: "Podcast",
    icon: Headphones,
    color: "bg-yl-purple-bg text-yl-purple",
    hasSettings: true,
    view: null as ActiveView | null,
  },
  {
    title: "Video",
    icon: Video,
    color: "bg-yl-blue-bg text-yl-blue",
    hasSettings: true,
    badge: "Beta",
    view: null as ActiveView | null,
  },
  {
    title: "Summary",
    icon: FileText,
    color: "bg-yl-sky-bg text-yl-sky",
    hasSettings: true,
    view: "summary" as ActiveView,
  },
  {
    title: "Quiz",
    icon: ClipboardCheck,
    color: "bg-yl-pink-bg text-yl-pink",
    hasSettings: true,
    view: "quiz" as ActiveView,
  },
  {
    title: "Flashcards",
    icon: Layers,
    color: "bg-yl-orange-bg text-yl-orange",
    hasSettings: true,
    view: "flashcards" as ActiveView,
  },
  {
    title: "Notes",
    icon: StickyNote,
    color: "bg-yl-gold-bg text-yl-gold",
    hasArrow: true,
    view: null as ActiveView | null,
  },
];

const fullWidthCards = [
  {
    title: "Chapters",
    icon: BookOpen,
    color: "bg-yl-green-bg text-yl-green",
    hasArrow: true,
  },
];

interface LearningPanelProps {
  documentId?: string;
  className?: string;
}

export function LearningPanel({ documentId, className }: LearningPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>("generate");
  const [chatInput, setChatInput] = useState("");

  const renderContent = () => {
    switch (activeView) {
      case "chat":
        return <ChatPanel documentId={documentId} />;
      case "flashcards":
        return (
          <FlashcardViewer
            documentId={documentId}
            onClose={() => setActiveView("generate")}
          />
        );
      case "quiz":
        return (
          <QuizViewer
            documentId={documentId}
            onClose={() => setActiveView("generate")}
          />
        );
      case "summary":
        return <ChatPanel documentId={documentId} />;
      default:
        return renderGenerateView();
    }
  };

  const renderGenerateView = () => (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Generate section header */}
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
          Generate
        </p>

        {/* 2-column grid cards */}
        <div className="grid grid-cols-2 gap-2">
          {generateCards.map((card) => (
            <button
              key={card.title}
              onClick={() => card.view && setActiveView(card.view)}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:shadow-sm",
                card.view ? "cursor-pointer" : "cursor-default opacity-70"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  card.color
                )}
              >
                <card.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-800">
                    {card.title}
                  </span>
                  {card.badge && (
                    <span className="rounded bg-yl-green-bg px-1 py-0.5 text-[9px] font-bold uppercase text-yl-green">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
              {card.hasSettings && card.view && (
                <Settings className="h-3.5 w-3.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
              {card.hasArrow && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              )}
            </button>
          ))}
        </div>

        {/* Full-width cards */}
        <div className="mt-2 space-y-2">
          {fullWidthCards.map((card) => (
            <button
              key={card.title}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  card.color
                )}
              >
                <card.icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800">
                {card.title}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom chat input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 transition-all focus-within:border-gray-300 focus-within:shadow-sm">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && chatInput.trim()) {
                setActiveView("chat");
              }
            }}
            onFocus={() => setActiveView("chat")}
            placeholder="Learn anything"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          />
          <button className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-800">
            <AudioLines className="h-3 w-3" />
            <span>Voice</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-gray-100 bg-white",
        className
      )}
    >
      {/* Tab bar */}
      <div className="flex h-11 items-center justify-between border-b border-gray-100 px-3">
        <div className="flex items-center gap-2">
          {activeView !== "generate" && (
            <button
              onClick={() => setActiveView("generate")}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 mr-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-yl-green" />
            <span className="text-xs font-medium text-gray-700">
              {activeView === "generate"
                ? "Learn Tab"
                : activeView === "chat"
                ? "AI Chat"
                : activeView === "flashcards"
                ? "Flashcards"
                : activeView === "quiz"
                ? "Quiz"
                : activeView === "summary"
                ? "Summary"
                : "Learn Tab"}
            </span>
            <button
              onClick={() => setActiveView("generate")}
              className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200"
            >
              <X className="h-2.5 w-2.5 text-gray-400" />
            </button>
          </div>
          <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100">
            <Plus className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {activeView === "generate" && (
            <button
              onClick={() => setActiveView("chat")}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50"
              title="Open chat"
            >
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
          <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50">
            <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
