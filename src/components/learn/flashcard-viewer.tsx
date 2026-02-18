"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, Loader2, Sparkles, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureCopilotToken, isAuthenticated, getSelectedModel } from "@/lib/github-auth";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  documentId?: string;
  spaceId?: string;
  renderSources?: (text: string) => React.ReactNode[];
}

export function FlashcardViewer({ documentId, spaceId, renderSources }: FlashcardViewerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiGenerated, setAiGenerated] = useState(false);

  useEffect(() => {
    fetchFlashcards();
  }, [documentId, spaceId]);

  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const copilotToken = isAuthenticated() ? await ensureCopilotToken() : null;
      const model = getSelectedModel();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (copilotToken) headers["x-copilot-token"] = copilotToken;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId, spaceId, type: "flashcards", model }),
      });
      const data = await res.json();
      if (data.flashcards) {
        setCards(data.flashcards);
        setAiGenerated(!!data.aiGenerated);
      }
    } catch (err) {
      console.error("Flashcard fetch error:", err);
    }
    setLoading(false);
  };

  const next = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((p) => Math.min(p + 1, cards.length - 1)), 150);
  };

  const prev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((p) => Math.max(p - 1, 0)), 150);
  };

  const renderText = (text: string) => {
    if (renderSources) return renderSources(text);
    return text;
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yl-gold animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">Generating flashcards...</p>
          <p className="mt-0.5 text-xs text-gray-400">Creating study cards from your content</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center px-6">
        <p className="text-sm text-gray-500">No flashcards generated</p>
        <button
          onClick={fetchFlashcards}
          className="mt-3 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          Try again
        </button>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col items-center px-4 py-6">
      {/* Badge & counter */}
      <div className="mb-4 flex w-full items-center justify-between">
        <span className="text-xs text-gray-400">
          {currentIndex + 1} / {cards.length}
        </span>
        {aiGenerated ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-yl-gold-bg px-2 py-0.5 text-[10px] font-medium text-yl-gold">
            <Sparkles className="h-2.5 w-2.5" />
            AI Generated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
            Sample Data
          </span>
        )}
      </div>

      {/* Card */}
      <div
        className="perspective-1000 w-full cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            "relative h-56 w-full transition-transform duration-500 transform-style-3d",
            isFlipped && "rotate-y-180"
          )}
        >
          {/* Front */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-center text-sm font-medium text-gray-900 leading-relaxed">
              {card.front}
            </p>
            <p className="mt-4 text-[10px] text-gray-300">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-yl-green/30 bg-yl-green-bg/30 p-6 shadow-sm">
            <div className="text-center text-sm text-gray-700 leading-relaxed">
              {renderText(card.back)}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(0);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={next}
          disabled={currentIndex === cards.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIsFlipped(false); setCurrentIndex(i); }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentIndex ? "w-4 bg-gray-900" : "w-1.5 bg-gray-200 hover:bg-gray-300"
            )}
          />
        ))}
      </div>

      {/* Regenerate */}
      <button
        onClick={fetchFlashcards}
        disabled={loading}
        className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <RotateCcw className="h-3 w-3" />
        Regenerate
      </button>
    </div>
  );
}
