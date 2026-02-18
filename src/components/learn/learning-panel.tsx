"use client";

import React, { useState, useEffect } from "react";
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
  ArrowLeft,
  MessageSquare,
  Volume2,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { FlashcardViewer } from "./flashcard-viewer";
import { QuizViewer } from "./quiz-viewer";

type ActiveView = "generate" | "chat" | "flashcards" | "quiz" | "summary" | "notes" | "chapters" | "podcast";

interface GenerateCard {
  title: string;
  icon: React.ElementType;
  color: string;
  view: ActiveView | null;
  hasSettings?: boolean;
  hasArrow?: boolean;
  badge?: string;
}

const generateCards: GenerateCard[] = [
  { title: "Podcast", icon: Headphones, color: "bg-yl-purple-bg text-yl-purple", hasSettings: true, view: "podcast" },
  { title: "Video", icon: Video, color: "bg-yl-blue-bg text-yl-blue", hasSettings: true, badge: "Beta", view: null },
  { title: "Summary", icon: FileText, color: "bg-yl-sky-bg text-yl-sky", hasSettings: true, view: "summary" },
  { title: "Quiz", icon: ClipboardCheck, color: "bg-yl-pink-bg text-yl-pink", hasSettings: true, view: "quiz" },
  { title: "Flashcards", icon: Layers, color: "bg-yl-orange-bg text-yl-orange", hasSettings: true, view: "flashcards" },
  { title: "Notes", icon: StickyNote, color: "bg-yl-gold-bg text-yl-gold", hasArrow: true, view: "notes" },
];

const fullWidthCards: GenerateCard[] = [
  { title: "Chapters", icon: BookOpen, color: "bg-yl-green-bg text-yl-green", hasArrow: true, view: "chapters" },
];

interface LearningPanelProps {
  documentId?: string;
  spaceId?: string;
  className?: string;
}

export function LearningPanel({ documentId, spaceId, className }: LearningPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>("generate");
  const [chatInput, setChatInput] = useState("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [notesData, setNotesData] = useState<any>(null);
  const [chaptersData, setChaptersData] = useState<any>(null);

  const viewLabel: Record<ActiveView, string> = {
    generate: "Learn Tab",
    chat: "AI Chat",
    flashcards: "Flashcards",
    quiz: "Quiz",
    summary: "Summary",
    notes: "Notes",
    chapters: "Chapters",
    podcast: "Podcast",
  };

  const fetchData = async (type: string) => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, spaceId, type }),
      });
      return await res.json();
    } catch { return null; }
  };

  const openView = async (view: ActiveView) => {
    setActiveView(view);
    if (view === "summary" && !summaryData) setSummaryData(await fetchData("summary"));
    if (view === "notes" && !notesData) setNotesData(await fetchData("notes"));
    if (view === "chapters" && !chaptersData) setChaptersData(await fetchData("chapters"));
  };

  const renderContent = () => {
    switch (activeView) {
      case "chat": return <ChatPanel documentId={documentId} spaceId={spaceId} />;
      case "flashcards": return <FlashcardViewer documentId={documentId} />;
      case "quiz": return <QuizViewer documentId={documentId} />;
      case "summary": return renderSummary();
      case "notes": return renderNotes();
      case "chapters": return renderChapters();
      case "podcast": return renderPodcast();
      default: return renderGenerateView();
    }
  };

  const renderSummary = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {summaryData?.summary ? (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Key Points</p>
            <ul className="space-y-2">
              {summaryData.summary.keyPoints.map((point: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yl-sky shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          {summaryData.summary.sections.map((sec: any, i: number) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{sec.heading}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{sec.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <FileText className="h-8 w-8 text-gray-300 animate-pulse" />
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {notesData?.notes ? (
        <div className="space-y-3 animate-fade-in">
          {notesData.notes.map((note: any) => (
            <div key={note.id} className={cn("rounded-xl border p-4", note.highlight ? "border-yl-gold bg-yl-gold-bg/30" : "border-gray-100")}>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{note.title}</h4>
              <pre className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{note.content}</pre>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <StickyNote className="h-8 w-8 text-gray-300 animate-pulse" />
        </div>
      )}
    </div>
  );

  const renderChapters = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {chaptersData?.chapters ? (
        <div className="space-y-2 animate-fade-in">
          {chaptersData.chapters.map((ch: any, i: number) => (
            <button key={ch.id} className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left hover:border-gray-200 hover:bg-gray-50 transition-all">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yl-green-bg text-xs font-bold text-yl-green">{i + 1}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{ch.title}</p>
                <p className="text-xs text-gray-400">Pages {ch.startPage}–{ch.endPage}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <BookOpen className="h-8 w-8 text-gray-300 animate-pulse" />
        </div>
      )}
    </div>
  );

  const renderPodcast = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yl-purple-bg">
          <Headphones className="h-9 w-9 text-yl-purple" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-gray-900">AI Podcast</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-xs">
          Generate a podcast-style audio summary of your material
        </p>
        <button className="mt-4 btn-pill-primary text-sm gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Generate Podcast
        </button>
        <p className="mt-3 text-xs text-gray-400">~6 min • Powered by AI</p>
        {/* Mock audio player */}
        <div className="mt-6 w-full max-w-xs rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-yl-purple text-white">
              <Play className="h-3.5 w-3.5 ml-0.5" />
            </button>
            <div className="flex-1">
              <div className="h-1 w-full rounded-full bg-gray-200">
                <div className="h-full w-0 rounded-full bg-yl-purple" />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>0:00</span>
                <span>6:24</span>
              </div>
            </div>
            <Volume2 className="h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenerateView = () => (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Generate</p>
        <div className="grid grid-cols-2 gap-2">
          {generateCards.map((card) => (
            <button
              key={card.title}
              onClick={() => card.view && openView(card.view)}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:shadow-sm",
                card.view ? "cursor-pointer" : "cursor-default opacity-70"
              )}
            >
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-800">{card.title}</span>
                  {card.badge && <span className="rounded bg-yl-green-bg px-1 py-0.5 text-[9px] font-bold uppercase text-yl-green">{card.badge}</span>}
                </div>
              </div>
              {card.hasSettings && card.view && <Settings className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100" />}
              {card.hasArrow && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          {fullWidthCards.map((card) => (
            <button
              key={card.title}
              onClick={() => card.view && openView(card.view)}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
            >
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800">{card.title}</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 focus-within:border-gray-300 focus-within:shadow-sm">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && chatInput.trim()) setActiveView("chat"); }}
            onFocus={() => setActiveView("chat")}
            placeholder="Learn anything"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          />
          <button className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white hover:bg-gray-800">
            <AudioLines className="h-3 w-3" />
            <span>Voice</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("flex h-full flex-col border-l border-gray-100 bg-white", className)}>
      <div className="flex h-11 items-center justify-between border-b border-gray-100 px-3">
        <div className="flex items-center gap-2">
          {activeView !== "generate" && (
            <button onClick={() => setActiveView("generate")} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 mr-1">
              <ArrowLeft className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-yl-green" />
            <span className="text-xs font-medium text-gray-700">{viewLabel[activeView]}</span>
            <button onClick={() => setActiveView("generate")} className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200">
              <X className="h-2.5 w-2.5 text-gray-400" />
            </button>
          </div>
          <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100">
            <Plus className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {activeView === "generate" && (
            <button onClick={() => setActiveView("chat")} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
          <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50">
            <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
