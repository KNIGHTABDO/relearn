import { generateContent } from "@/lib/ai-service";
"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Loader2,
  Sparkles,
  Trophy,
  BookMarked,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureCopilotToken, isAuthenticated, getSelectedModel } from "@/lib/github-auth";
import { useI18n } from "@/components/providers/i18n-provider";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewerProps {
  documentId?: string;
  spaceId?: string;
  renderSources?: (text: string) => React.ReactNode[];
}

export function QuizViewer({ documentId, spaceId, renderSources }: QuizViewerProps) {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiGenerated, setAiGenerated] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [documentId, spaceId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredCount(0);
    setIsComplete(false);

    try {
    try {
      const data = await generateContent("quiz", documentId, spaceId);
      const questions = Array.isArray(data) ? data : (data.questions || data.quiz || []);
      if (questions.length > 0) {
        setQuestions(questions);
        setAiGenerated(true);
      }
    } catch (err) {
      console.error("Quiz fetch error:", err);
    }
    setLoading(false);
  };

  const handleAnswer = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    setAnsweredCount((p) => p + 1);
    if (optionIndex === questions[currentIndex].correctIndex) {
      setScore((p) => p + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex === questions.length - 1) {
      setIsComplete(true);
      return;
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((p) => p + 1);
  };

  const renderText = (text: string) => {
    if (renderSources) return renderSources(text);
    return text;
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300 dark:text-dark-text-muted" />
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yl-gold animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">{t("quiz.creating")}</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-text-muted">{t("quiz.generating")}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center px-6">
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">{t("quiz.no_questions")}</p>
        <button onClick={fetchQuiz} className="mt-3 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text dark:text-dark-text">{t("common.retry")}</button>
      </div>
    );
  }

  // Score screen
  if (isComplete) {
    const pct = Math.round((score / questions.length) * 100);
    const isGreat = pct >= 80;
    const isOk = pct >= 50;

    return (
      <div className="flex flex-col items-center px-6 py-8 animate-fade-in">
        <div className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full",
          isGreat ? "bg-yl-green-bg dark:bg-yl-green-bg-dark" : isOk ? "bg-yl-gold-bg dark:bg-yl-gold-bg-dark" : "bg-yl-pink-bg dark:bg-yl-pink-bg-dark"
        )}>
          <Trophy className={cn(
            "h-10 w-10",
            isGreat ? "text-yl-green" : isOk ? "text-yl-gold" : "text-yl-pink"
          )} />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-dark-text">{pct}%</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">
          {score} {t("quiz.out_of")} {questions.length} {t("quiz.correct")}
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-dark-text-muted">
          {isGreat ? t("quiz.excellent_work") : isOk ? t("quiz.good_effort") : t("quiz.keep_studying")}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={fetchQuiz}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            {t("quiz.new_quiz")}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-card text-[10px] font-bold text-gray-600 dark:text-dark-text-secondary">
            {currentIndex + 1}
          </span>
          <span className="text-xs text-gray-400 dark:text-dark-text-muted">{t("quiz.question_of")} {questions.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {aiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yl-gold-bg dark:bg-yl-gold-bg-dark px-2 py-0.5 text-[10px] font-medium text-yl-gold">
              <Sparkles className="h-2.5 w-2.5" /> {t("common.ai_generated")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-dark-card px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-dark-text-muted">{t("common.sample")}</span>
          )}
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-gray-400 dark:text-dark-text-muted" />
            <span className="text-[10px] text-gray-400 dark:text-dark-text-muted">{score}/{answeredCount}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 w-full rounded-full bg-gray-100 dark:bg-dark-card overflow-hidden">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-dark-text leading-relaxed">{q.question}</h3>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = i === q.correctIndex;
          const showCorrect = showResult && isCorrect;
          const showWrong = showResult && isSelected && !isCorrect;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showResult}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs transition-all",
                showCorrect
                  ? "border-yl-green/50 bg-yl-green-bg dark:bg-yl-green-bg-dark/50"
                  : showWrong
                  ? "border-yl-pink/50 bg-yl-pink-bg dark:bg-yl-pink-bg-dark/50"
                  : isSelected
                  ? "border-gray-900 bg-gray-50 dark:bg-dark-surface dark:bg-dark-surface"
                  : "border-gray-100 dark:border-dark-border hover:border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
              )}
            >
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                showCorrect
                  ? "border-yl-green bg-yl-green text-white"
                  : showWrong
                  ? "border-yl-pink bg-yl-pink text-white"
                  : "border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-muted"
              )}>
                {showCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : showWrong ? <XCircle className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}
              </span>
              <span className={cn(
                "flex-1",
                showCorrect ? "text-yl-green font-medium" : showWrong ? "text-yl-pink" : "text-gray-700 dark:text-dark-text-secondary"
              )}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && q.explanation && (
        <div className="mt-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-3.5 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookMarked className="h-3 w-3 text-gray-500 dark:text-dark-text-muted" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-text-muted">{t("quiz.explanation")}</span>
          </div>
          <p className="text-xs leading-relaxed text-gray-600 dark:text-dark-text-secondary">
            {renderText(q.explanation)}
          </p>
        </div>
      )}

      {/* Next button */}
      {showResult && (
        <button
          onClick={nextQuestion}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-3 text-xs font-medium text-white hover:bg-gray-800 transition-colors animate-fade-in"
        >
          {currentIndex === questions.length - 1 ? t("quiz.see_results") : t("quiz.next_question")}
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
