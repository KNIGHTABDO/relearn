"use client";

import React, { useState, useEffect, useCallback , Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  ClipboardCheck,
  Check,
  X as XIcon,
  RotateCcw,
  ChevronRight,
  Trophy,
  Clock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source?: string;
}

interface ExamData {
  id: string;
  title: string;
  questions: ExamQuestion[];
  timeLimit: number;
  documentsCovered: string[];
}

function ExamPageInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const spaceId = searchParams.get("spaceId");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!spaceId) {
      router.push("/");
      return;
    }
    fetch("/api/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, questionCount: 10, timeLimit: 30 }),
    })
      .then((r) => r.json())
      .then((d) => {
        setExam(d);
        setTimeLeft(d.timeLimit * 60);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [spaceId, router]);

  // Timer
  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCompleted(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading || !exam) {
    return (
      <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-1 items-center justify-center">
          <ClipboardCheck className="h-8 w-8 text-gray-300 dark:text-dark-text-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const score = Array.from(answers.entries()).reduce(
    (acc, [qId, ans]) => {
      const q = exam.questions.find((x) => x.id === qId);
      return acc + (q && ans === q.correctIndex ? 1 : 0);
    },
    0
  );

  const selectAnswer = (idx: number) => {
    if (answers.has(currentQ.id)) return;
    setAnswers((prev) => new Map(prev).set(currentQ.id, idx));
    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  // Pre-exam screen
  if (!started) {
    return (
      <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yl-pink-bg dark:bg-yl-pink-bg-dark">
              <ClipboardCheck className="h-7 w-7 text-yl-pink" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-dark-text">{exam.title}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
              {exam.questions.length} {t("exam.question")} • {exam.timeLimit} {t("exam.minutes")}
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 dark:bg-dark-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-dark-text-muted mb-2">
                {t("exam.documents_covered")}
              </p>
              <div className="space-y-1">
                {exam.documentsCovered.map((doc, i) => (
                  <p key={i} className="text-sm text-gray-600 dark:text-dark-text-secondary">{doc}</p>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="mt-6 w-full btn-pill-primary py-3 text-sm"
            >
              {t("exam.start")}
            </button>
            <button
              onClick={() => router.back()}
              className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary dark:text-dark-text-secondary mx-auto"
            >
              <ArrowLeft className="h-3 w-3" />
              {t("exam.back_to_space")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Completed screen
  if (completed) {
    const total = exam.questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
              pct >= 80 ? "bg-yl-green-bg dark:bg-yl-green-bg-dark" : pct >= 50 ? "bg-yl-gold-bg dark:bg-yl-gold-bg-dark" : "bg-yl-pink-bg dark:bg-yl-pink-bg-dark"
            )}>
              <Trophy className={cn(
                "h-7 w-7",
                pct >= 80 ? "text-yl-green" : pct >= 50 ? "text-yl-gold" : "text-yl-pink"
              )} />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-dark-text">{t("exam.complete")}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">
              {t("exam.score", { score, total, pct })}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => router.back()}
                className="btn-pill-secondary text-xs"
              >
                {t("exam.back_to_space")}
              </button>
              <button
                onClick={() => {
                  setStarted(false);
                  setCompleted(false);
                  setCurrentIndex(0);
                  setAnswers(new Map());
                  setShowResult(false);
                  setTimeLeft(exam.timeLimit * 60);
                }}
                className="btn-pill-primary text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                {t("exam.retake")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
      <Header title={exam.title} onMenuClick={() => setSidebarOpen(true)} />
      <main className="flex flex-1 flex-col items-center px-6 py-6">
        <div className="w-full max-w-lg">
          {/* Timer + Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
              {t("exam.question_progress", { current: currentIndex + 1, total: exam.questions.length })}
            </span>
            <span className={cn(
              "flex items-center gap-1 text-sm font-medium",
              timeLeft < 120 ? "text-yl-pink" : "text-gray-600 dark:text-dark-text-secondary"
            )}>
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1.5 w-full rounded-full bg-gray-100 dark:bg-dark-card overflow-hidden">
            <div
              className="h-full rounded-full bg-yl-pink transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / exam.questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <p className="text-base font-medium text-gray-900 dark:text-dark-text leading-relaxed mb-6">
            {currentQ.question}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt, idx) => {
              const selected = answers.get(currentQ.id);
              const isSelected = selected === idx;
              const isCorrect = idx === currentQ.correctIndex;
              const hasAnswered = selected !== undefined;

              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  disabled={hasAnswered}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all",
                    hasAnswered
                      ? isCorrect
                        ? "border-green-200 bg-yl-green-bg dark:bg-yl-green-bg-dark"
                        : isSelected
                        ? "border-red-200 bg-yl-pink-bg dark:bg-yl-pink-bg-dark"
                        : "border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg opacity-50"
                      : "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
                  )}
                >
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    hasAnswered
                      ? isCorrect ? "border-green-300 bg-yl-green text-white"
                      : isSelected ? "border-red-300 bg-yl-pink text-white"
                      : "border-gray-200 dark:border-dark-border text-gray-400 dark:text-dark-text-muted"
                    : "border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-muted"
                  )}>
                    {hasAnswered ? (
                      isCorrect ? <Check className="h-3.5 w-3.5" /> :
                      isSelected ? <XIcon className="h-3.5 w-3.5" /> :
                      String.fromCharCode(65 + idx)
                    ) : String.fromCharCode(65 + idx)}
                  </div>
                  <span className={cn("flex-1", hasAnswered && isCorrect && "font-medium text-green-800")}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <div className="mt-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-4 animate-fade-in">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-dark-text-muted mb-1">{t("exam.explanation")}</p>
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary leading-relaxed">{currentQ.explanation}</p>
              {currentQ.source && (
                <p className="mt-2 text-xs text-gray-400 dark:text-dark-text-muted">{t("exam.source_label")} {currentQ.source}</p>
              )}
            </div>
          )}

          {/* Next */}
          {showResult && (
            <button
              onClick={nextQuestion}
              className="mt-4 w-full btn-pill-primary py-3 text-sm gap-1.5 animate-fade-in"
            >
              {currentIndex < exam.questions.length - 1 ? t("exam.next_question") : t("exam.see_results")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" /></div>}>
      <ExamPageInner />
    </Suspense>
  );
}
