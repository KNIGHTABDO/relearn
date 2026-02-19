"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RotateCcw, ChevronLeft, ChevronRight, Loader2, Sparkles,
  Plus, Pencil, Trash2, Copy, Check, X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { generateContent } from "@/lib/ai-service";
import { saveFlashcardsAction, loadFlashcardsAction } from "@/lib/data-layer";

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
  const { t } = useI18n();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit / Add card modal state
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [isNewCard, setIsNewCard] = useState(false);

  // Load cards — check SQLite cache first, then generate
  const fetchFlashcards = useCallback(async (forceGenerate = false) => {
    setLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    try {
      if (!forceGenerate) {
        const cached = await loadFlashcardsAction(documentId, spaceId);
        if (cached && cached.length > 0) {
          setCards(cached);
          setAiGenerated(true);
          setLoading(false);
          return;
        }
      }
      // Generate fresh from AI
      const data = await generateContent("flashcards", documentId, spaceId);
      let newCards: Flashcard[] = [];
      if (Array.isArray(data)) newCards = data;
      else if (data?.flashcards) newCards = data.flashcards;
      if (newCards.length > 0) {
        // Ensure all cards have an id
        newCards = newCards.map((c, i) => ({ ...c, id: c.id || crypto.randomUUID() }));
        setCards(newCards);
        setAiGenerated(true);
        // Persist to SQLite
        await saveFlashcardsAction(newCards, documentId, spaceId);
      }
    } catch (err) {
      console.error("Flashcard fetch error:", err);
    }
    setLoading(false);
  }, [documentId, spaceId]);

  useEffect(() => { fetchFlashcards(); }, [fetchFlashcards]);

  // Keyboard shortcuts: Space=flip, ←/→=navigate, Escape=close edit modal
  useEffect(() => {
    if (cards.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (editingCard) { if (e.code === "Escape") closeEdit(); return; }
      if (e.code === "Space") { e.preventDefault(); setIsFlipped(f => !f); }
      if (e.code === "ArrowLeft") { e.preventDefault(); setCurrentIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }
      if (e.code === "ArrowRight") { e.preventDefault(); setCurrentIndex(i => Math.min(cards.length - 1, i + 1)); setIsFlipped(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cards.length, editingCard]);

  const next = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(p => Math.min(p + 1, cards.length - 1)), 150); };
  const prev = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex(p => Math.max(p - 1, 0)), 150); };

  // ── Edit / Add / Delete handlers ──────────────────
  const openEdit = (card: Flashcard) => {
    setIsNewCard(false);
    setEditingCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const openAdd = () => {
    setIsNewCard(true);
    setEditingCard({ id: crypto.randomUUID(), front: "", back: "" });
    setEditFront("");
    setEditBack("");
  };

  const closeEdit = () => { setEditingCard(null); setEditFront(""); setEditBack(""); };

  const saveEdit = async () => {
    if (!editingCard || !editFront.trim() || !editBack.trim()) return;
    let updated: Flashcard[];
    if (isNewCard) {
      updated = [...cards, { ...editingCard, front: editFront.trim(), back: editBack.trim() }];
    } else {
      updated = cards.map(c => c.id === editingCard.id ? { ...c, front: editFront.trim(), back: editBack.trim() } : c);
    }
    setCards(updated);
    await saveFlashcardsAction(updated, documentId, spaceId);
    closeEdit();
  };

  const deleteCard = async (id: string) => {
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    if (currentIndex >= updated.length && updated.length > 0) setCurrentIndex(updated.length - 1);
    await saveFlashcardsAction(updated, documentId, spaceId);
  };

  // ── Export: copy all cards to clipboard ────────────
  const copyAll = async () => {
    const text = cards.map((c, i) => `Card ${i + 1}\nQ: ${c.front}\nA: ${c.back}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const renderText = (text: string) => renderSources ? renderSources(text) : text;

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300 dark:text-dark-text-muted" />
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yl-gold animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{t("flashcard.generating_flashcards")}</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-text-muted">{t("flashcard.creating_study_cards")}</p>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center px-6">
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">{t("flashcard.no_flashcards_generated")}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => fetchFlashcards(true)}
            className="rounded-lg bg-gray-100 dark:bg-dark-card px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors"
          >
            {t("common.retry")}
          </button>
          <button
            onClick={openAdd}
            className="rounded-lg bg-yl-gold-bg dark:bg-yl-gold-bg-dark px-3 py-1.5 text-xs font-medium text-yl-gold hover:opacity-80 transition-opacity"
          >
            + Add Card
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col items-center px-4 py-6">
      {/* Header row: counter + badges + actions */}
      <div className="mb-4 flex w-full items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-dark-text-muted">
          {currentIndex + 1} / {cards.length}
        </span>
        <div className="flex items-center gap-2">
          {aiGenerated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yl-gold-bg dark:bg-yl-gold-bg-dark px-2 py-0.5 text-[10px] font-medium text-yl-gold">
              <Sparkles className="h-2.5 w-2.5" />
              {t("common.ai_generated")}
            </span>
          )}
          {/* Copy all */}
          <button
            onClick={copyAll}
            title="Copy all cards"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-400 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {/* Add card */}
          <button
            onClick={openAdd}
            title="Add card"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-400 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
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
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg p-6 shadow-sm dark:shadow-none">
            <p className="text-center text-sm font-medium text-gray-900 dark:text-dark-text leading-relaxed">
              {card.front}
            </p>
            <p className="mt-4 text-[10px] text-gray-300 dark:text-dark-text-muted">{t("flashcard.tap_to_reveal_answer")}</p>
          </div>
          {/* Back */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-yl-green/30 bg-yl-green-bg dark:bg-yl-green-bg-dark/30 p-6 shadow-sm dark:shadow-none">
            <div className="text-center text-sm text-gray-700 dark:text-dark-text-secondary leading-relaxed">
              {renderText(card.back)}
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Delete actions for current card */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(card); }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-gray-400 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-gray-400 dark:text-dark-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center gap-4">
        <button onClick={prev} disabled={currentIndex === 0} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-hover disabled:opacity-30 transition-all">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => { setIsFlipped(false); setCurrentIndex(0); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-hover transition-all">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={next} disabled={currentIndex === cards.length - 1} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-hover disabled:opacity-30 transition-all">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {cards.map((_, i) => (
          <button key={i} onClick={() => { setIsFlipped(false); setCurrentIndex(i); }}
            className={cn("h-1.5 rounded-full transition-all", i === currentIndex ? "w-4 bg-gray-900 dark:bg-dark-text" : "w-1.5 bg-gray-200 dark:bg-dark-border hover:bg-gray-300")}
          />
        ))}
      </div>

      {/* Regenerate */}
      <button onClick={() => fetchFlashcards(true)} disabled={loading}
        className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors"
      >
        <RotateCcw className="h-3 w-3" />
        {t("flashcard.regenerate")}
      </button>

      {/* ── Edit / Add Card Modal ──────────────────── */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                {isNewCard ? "Add Card" : "Edit Card"}
              </h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-dark-text-muted">Front (Question)</label>
                <textarea
                  value={editFront}
                  onChange={e => setEditFront(e.target.value)}
                  rows={3}
                  placeholder="Question or concept..."
                  className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface px-3 py-2 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 focus:border-yl-gold focus:outline-none focus:ring-1 focus:ring-yl-gold resize-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-dark-text-muted">Back (Answer)</label>
                <textarea
                  value={editBack}
                  onChange={e => setEditBack(e.target.value)}
                  rows={3}
                  placeholder="Answer or explanation..."
                  className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface px-3 py-2 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 focus:border-yl-gold focus:outline-none focus:ring-1 focus:ring-yl-gold resize-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeEdit} className="rounded-xl px-4 py-2 text-xs font-medium text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!editFront.trim() || !editBack.trim()}
                className="rounded-xl bg-gray-900 dark:bg-dark-text px-4 py-2 text-xs font-medium text-white dark:text-dark-bg hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
