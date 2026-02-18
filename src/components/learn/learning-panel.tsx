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
  Loader2,
  Sparkles,
  BookMarked,
  AlertCircle,
  Mic,
  Brain,
  BarChart3,
  Image,
  FileBarChart,
  RefreshCw,
  Camera,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { FlashcardViewer } from "./flashcard-viewer";
import { QuizViewer } from "./quiz-viewer";
import { ensureCopilotToken, isAuthenticated, getSelectedModel } from "@/lib/github-auth";
import { PodcastPlayer } from "./podcast-player";
import { VoiceTutor } from "./voice-tutor";
import { StudyPlanner } from "./study-planner";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { InfographicViewer } from "./infographic-viewer";
import { StudyReport } from "./study-report";
import { SpacedRepetition } from "./spaced-repetition";
import { SnapProblem } from "./snap-problem";
import { CollabPanel } from "./collab-panel";

type ActiveView = "generate" | "chat" | "flashcards" | "quiz" | "summary" | "notes" | "chapters" | "podcast" | "voice-tutor" | "study-planner" | "analytics" | "infographic" | "study-report" | "spaced-repetition" | "snap-problem" | "collab";

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
  { title: "Podcast", icon: Headphones, color: "bg-yl-purple-bg dark:bg-yl-purple-bg-dark text-yl-purple", hasSettings: true, view: "podcast" },
  { title: "Voice Tutor", icon: Mic, color: "bg-yl-pink-bg dark:bg-yl-pink-bg-dark text-yl-pink", view: "voice-tutor", badge: "New" },
  { title: "Summary", icon: FileText, color: "bg-yl-sky-bg dark:bg-yl-sky-bg-dark text-yl-sky", hasSettings: true, view: "summary" },
  { title: "Quiz", icon: ClipboardCheck, color: "bg-yl-pink-bg dark:bg-yl-pink-bg-dark text-yl-pink", hasSettings: true, view: "quiz" },
  { title: "Flashcards", icon: Layers, color: "bg-yl-orange-bg dark:bg-yl-orange-bg-dark text-yl-orange", hasSettings: true, view: "flashcards" },
  { title: "Spaced Review", icon: RefreshCw, color: "bg-yl-green-bg dark:bg-yl-green-bg-dark text-yl-green", view: "spaced-repetition", badge: "New" },
  { title: "Mind Map", icon: Image, color: "bg-yl-teal-bg dark:bg-yl-teal-bg-dark text-yl-teal", view: "infographic", badge: "New" },
  { title: "Study Report", icon: FileBarChart, color: "bg-yl-blue-bg dark:bg-yl-blue-bg-dark text-yl-blue", view: "study-report" },
  { title: "Notes", icon: StickyNote, color: "bg-yl-gold-bg dark:bg-yl-gold-bg-dark text-yl-gold", hasArrow: true, view: "notes" },
  { title: "Snap Problem", icon: Camera, color: "bg-yl-orange-bg dark:bg-yl-orange-bg-dark text-yl-orange", view: "snap-problem", badge: "New" },
  { title: "Study Planner", icon: Brain, color: "bg-yl-purple-bg dark:bg-yl-purple-bg-dark text-yl-purple", view: "study-planner", badge: "AI" },
  { title: "Collaborate", icon: Users, color: "bg-yl-sky-bg dark:bg-yl-sky-bg-dark text-yl-sky", view: "collab", badge: "New" },
];

const fullWidthCards: GenerateCard[] = [
  { title: "Chapters", icon: BookOpen, color: "bg-yl-green-bg dark:bg-yl-green-bg-dark text-yl-green", hasArrow: true, view: "chapters" },
];

interface LearningPanelProps {
  documentId?: string;
  spaceId?: string;
  className?: string;
}

// Source tag renderer — converts [Source: X] to styled inline badges
function renderWithSources(text: string): React.ReactNode[] {
  if (!text) return [text];
  const parts = text.split(/(\[Source:\s*[^\]]+\])/g);
  return parts.map((part, i) => {
    const sourceMatch = part.match(/\[Source:\s*([^\]]+)\]/);
    if (sourceMatch) {
      return (
        <span
          key={i}
          className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-gray-100 dark:bg-dark-card px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-dark-text-muted align-middle leading-none"
          title={`Source: ${sourceMatch[1]}`}
        >
          <BookMarked className="h-2.5 w-2.5 text-gray-400 dark:text-dark-text-muted shrink-0" />
          {sourceMatch[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function LearningPanel({ documentId, spaceId, className }: LearningPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>("generate");
  const [chatInput, setChatInput] = useState("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [notesData, setNotesData] = useState<any>(null);
  const [chaptersData, setChaptersData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    setIsAI(isAuthenticated());
    const handler = () => setIsAI(isAuthenticated());
    window.addEventListener("github-auth-changed", handler);
    return () => window.removeEventListener("github-auth-changed", handler);
  }, []);

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
    setLoading(true);
    try {
      const copilotToken = isAI ? await ensureCopilotToken() : null;
      const model = getSelectedModel();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (copilotToken) headers["x-copilot-token"] = copilotToken;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId, spaceId, type, model }),
      });
      const data = await res.json();

      if (type === "summary") setSummaryData(data);
      if (type === "notes") setNotesData(data);
      if (type === "chapters") setChaptersData(data);

      return data;
    } catch (err) {
      console.error("Generate error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (view: ActiveView | null) => {
    if (!view) return;
    setActiveView(view);
    if (view === "summary" && !summaryData) fetchData("summary");
    if (view === "notes" && !notesData) fetchData("notes");
    if (view === "chapters" && !chaptersData) fetchData("chapters");
  };

  // Loading overlay
  const LoadingOverlay = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300 dark:text-dark-text-muted" />
        <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yl-gold animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Generating with AI...</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-text-muted">Analyzing your document</p>
      </div>
    </div>
  );

  // AI badge
  const AIBadge = ({ generated }: { generated?: boolean }) =>
    generated ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-yl-gold-bg dark:bg-yl-gold-bg-dark px-2 py-0.5 text-[10px] font-medium text-yl-gold">
        <Sparkles className="h-2.5 w-2.5" />
        AI Generated
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-dark-card px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-dark-text-muted">
        Sample Data
      </span>
    );

  return (
    <div className={cn("flex h-full flex-col border-l border-gray-100 dark:border-dark-border", className)}>
      {/* Tab header */}
      <div className="flex h-11 items-center justify-between border-b border-gray-100 dark:border-dark-border px-4">
        <div className="flex items-center gap-2">
          {activeView !== "generate" && (
            <button
              onClick={() => setActiveView("generate")}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gray-500 dark:text-dark-text-muted" />
            </button>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{viewLabel[activeView]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView("chat")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              activeView === "chat"
                ? "bg-black text-white"
                : "text-gray-500 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
        </div>
      </div>

      {/* Views */}
      <div className="flex-1 overflow-y-auto">
        {/* Generate home */}
        {activeView === "generate" && (
          <div className="p-4">
            {/* Quick chat input */}
            <div className="mb-4 flex items-center gap-2">
              <div
                className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2 cursor-text"
                onClick={() => setActiveView("chat")}
              >
                <MessageSquare className="h-3.5 w-3.5 text-gray-400 dark:text-dark-text-muted" />
                <span className="text-sm text-gray-400 dark:text-dark-text-muted">Ask about your document...</span>
              </div>
            </div>

            {/* Generate cards grid */}
            <div className="grid grid-cols-2 gap-2">
              {generateCards.map((card) => (
                <button
                  key={card.title}
                  onClick={() => handleCardClick(card.view)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg p-3 text-left transition-all hover:border-gray-200 dark:border-dark-border hover:shadow-sm dark:shadow-none"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", card.color)}>
                      <card.icon className="h-4 w-4" />
                    </div>
                    {card.badge && (
                      <span className="rounded-full bg-gray-100 dark:bg-dark-card px-1.5 py-0.5 text-[9px] font-medium text-gray-500 dark:text-dark-text-muted">
                        {card.badge}
                      </span>
                    )}
                    {card.hasSettings && !card.badge && (
                      <Settings className="h-3 w-3 text-gray-300 dark:text-dark-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {card.hasArrow && (
                      <ChevronRight className="h-3 w-3 text-gray-300 dark:text-dark-text-muted" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">{card.title}</span>
                </button>
              ))}
            </div>

            {/* Full-width cards */}
            <div className="mt-2 space-y-2">
              {fullWidthCards.map((card) => (
                <button
                  key={card.title}
                  onClick={() => handleCardClick(card.view)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg p-3 text-left transition-all hover:border-gray-200 dark:border-dark-border hover:shadow-sm dark:shadow-none"
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", card.color)}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-medium text-gray-700 dark:text-dark-text-secondary">{card.title}</span>
                  <ChevronRight className="h-3 w-3 text-gray-300 dark:text-dark-text-muted" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        {activeView === "chat" && (
          <ChatPanel documentId={documentId} spaceId={spaceId} className="h-full" />
        )}

        {/* Flashcards */}
        {activeView === "flashcards" && (
          <FlashcardViewer
            documentId={documentId}
            spaceId={spaceId}
            renderSources={renderWithSources}
          />
        )}

        {/* Quiz */}
        {activeView === "quiz" && (
          <QuizViewer
            documentId={documentId}
            spaceId={spaceId}
            renderSources={renderWithSources}
          />
        )}

        {/* Summary */}
        {activeView === "summary" && (
          <div className="p-4">
            {loading ? (
              <LoadingOverlay />
            ) : summaryData?.summary ? (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">{summaryData.summary.title}</h3>
                  <AIBadge generated={summaryData.aiGenerated} />
                </div>

                {/* Key Points */}
                {summaryData.summary.keyPoints?.length > 0 && (
                  <div className="rounded-xl border border-yl-sky/20 bg-yl-sky-bg dark:bg-yl-sky-bg-dark/30 p-3.5">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-yl-sky">
                      <Sparkles className="h-3 w-3" />
                      Key Takeaways
                    </h4>
                    <ul className="space-y-2">
                      {summaryData.summary.keyPoints.map((point: string, i: number) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-700 dark:text-dark-text-secondary">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-yl-sky/10 text-[9px] font-bold text-yl-sky">
                            {i + 1}
                          </span>
                          <span>{renderWithSources(point)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sections */}
                {summaryData.summary.sections?.map((section: any, i: number) => (
                  <div key={i} className="rounded-xl border border-gray-100 dark:border-dark-border p-3.5">
                    <h4 className="mb-1.5 text-xs font-semibold text-gray-900 dark:text-dark-text">{section.heading}</h4>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-dark-text-secondary">
                      {renderWithSources(section.content)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 dark:text-dark-text-muted" />
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">Failed to generate summary</p>
                <button onClick={() => fetchData("summary")} className="mt-3 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text dark:text-dark-text">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {activeView === "notes" && (
          <div className="p-4">
            {loading ? (
              <LoadingOverlay />
            ) : notesData?.notes ? (
              <div className="animate-fade-in space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">Study Notes</h3>
                  <AIBadge generated={notesData.aiGenerated} />
                </div>
                {notesData.notes.map((note: any, i: number) => (
                  <div
                    key={note.id || i}
                    className={cn(
                      "rounded-xl border p-3.5 transition-colors",
                      note.highlight
                        ? "border-yl-gold/30 bg-yl-gold-bg dark:bg-yl-gold-bg-dark/20"
                        : "border-gray-100 dark:border-dark-border"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {note.highlight && (
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-yl-gold/10">
                          <Sparkles className="h-2.5 w-2.5 text-yl-gold" />
                        </span>
                      )}
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-dark-text">{note.title}</h4>
                    </div>
                    <div className="space-y-1">
                      {note.content.split("\\n").filter(Boolean).map((line: string, j: number) => (
                        <p key={j} className="text-xs leading-relaxed text-gray-600 dark:text-dark-text-secondary">
                          {renderWithSources(line)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 dark:text-dark-text-muted" />
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">Failed to generate notes</p>
                <button onClick={() => fetchData("notes")} className="mt-3 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text dark:text-dark-text">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chapters */}
        {activeView === "chapters" && (
          <div className="p-4">
            {loading ? (
              <LoadingOverlay />
            ) : chaptersData?.chapters ? (
              <div className="animate-fade-in space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">Chapters</h3>
                  <AIBadge generated={chaptersData.aiGenerated} />
                </div>
                {chaptersData.chapters.map((ch: any, i: number) => (
                  <button
                    key={ch.id || i}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-100 dark:border-dark-border p-3 text-left transition-all hover:border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yl-green-bg dark:bg-yl-green-bg-dark text-xs font-bold text-yl-green">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-dark-text truncate">{ch.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-dark-text-muted">
                        Pages {ch.startPage}–{ch.endPage}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-300 dark:text-dark-text-muted" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 dark:text-dark-text-muted" />
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">Failed to generate chapters</p>
                <button onClick={() => fetchData("chapters")} className="mt-3 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text dark:text-dark-text">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Podcast */}
        {activeView === "podcast" && (
          <PodcastPlayer documentId={documentId} spaceId={spaceId} />
        )}

        {activeView === "voice-tutor" && (
          <VoiceTutor documentId={documentId} spaceId={spaceId} onClose={() => setActiveView("generate")} />
        )}

        {activeView === "study-planner" && (
          <StudyPlanner spaceId={spaceId} />
        )}

        {activeView === "analytics" && (
          <AnalyticsDashboard />
        )}

        {activeView === "infographic" && (
          <InfographicViewer documentId={documentId} spaceId={spaceId} />
        )}

        {activeView === "study-report" && (
          <StudyReport documentId={documentId} spaceId={spaceId} />
        )}

        {activeView === "spaced-repetition" && (
          <SpacedRepetition documentId={documentId} spaceId={spaceId} />
        )}

        {activeView === "snap-problem" && (
          <SnapProblem />
        )}

        {activeView === "collab" && (
          <CollabPanel spaceId={spaceId} />
        )}
      </div>
    </div>
  );
}
