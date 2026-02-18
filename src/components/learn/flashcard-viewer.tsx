"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Check,
  X as XIcon,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  documentId?: string;
  onClose?: () => void;
}

export function FlashcardViewer({ documentId, onClose }: FlashcardViewerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, [documentId]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, type: "flashcards" }),
      });
      const data = await res.json();
      setCards(data.flashcards || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const markKnown = () => {
    if (currentCard) {
      setKnown((prev) => new Set(prev).add(currentCard.id));
    }
    nextCard();
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Layers className="h-8 w-8 text-gray-300 animate-pulse" />
          <p className="text-sm text-gray-400">Generating flashcards...</p>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="flex h-full flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Flashcards</h3>
          <p className="text-xs text-gray-400">
            {currentIndex + 1} of {cards.length} • {known.size} learned
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={shuffleCards}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <Shuffle className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <button
            onClick={() => { setCurrentIndex(0); setIsFlipped(false); setKnown(new Set()); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-yl-orange transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex-1 cursor-pointer perspective-1000"
      >
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500 preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-yl-orange mb-3">
              Question
            </p>
            <p className="text-lg font-medium text-gray-900 leading-relaxed">
              {currentCard.front}
            </p>
            <p className="mt-4 text-xs text-gray-400">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-yl-orange-bg p-6 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-yl-orange mb-3">
              Answer
            </p>
            <p className="text-base text-gray-800 leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={prevCard}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>

        <button
          onClick={nextCard}
          className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <XIcon className="h-3.5 w-3.5 text-yl-pink" />
          Still learning
        </button>

        <button
          onClick={markKnown}
          className="flex items-center gap-2 rounded-full bg-yl-green-bg px-4 py-2 text-xs font-medium text-yl-green hover:bg-green-100"
        >
          <Check className="h-3.5 w-3.5" />
          Got it
        </button>

        <button
          onClick={nextCard}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
