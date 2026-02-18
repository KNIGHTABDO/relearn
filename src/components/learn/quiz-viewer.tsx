"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Check,
  X as XIcon,
  RotateCcw,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewerProps {
  documentId?: string;
  onClose?: () => void;
}

export function QuizViewer({ documentId, onClose }: QuizViewerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [documentId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, type: "quiz" }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const selectAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    setScore((prev) => ({
      correct: prev.correct + (idx === currentQuestion.correctIndex ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
    setCompleted(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-gray-300 animate-pulse" />
          <p className="text-sm text-gray-400">Generating quiz...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          percentage >= 80 ? "bg-yl-green-bg" : percentage >= 50 ? "bg-yl-gold-bg" : "bg-yl-pink-bg"
        )}>
          <Trophy className={cn(
            "h-7 w-7",
            percentage >= 80 ? "text-yl-green" : percentage >= 50 ? "text-yl-gold" : "text-yl-pink"
          )} />
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-900">Quiz Complete!</h3>
        <p className="mt-1 text-sm text-gray-500">
          You scored {score.correct} out of {score.total} ({percentage}%)
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={resetQuiz} className="btn-pill-secondary text-xs gap-1.5">
            <RotateCcw className="h-3 w-3" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex h-full flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Quiz</h3>
          <p className="text-xs text-gray-400">
            Question {currentIndex + 1} of {questions.length} • Score: {score.correct}/{score.total}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-yl-pink transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-base font-medium text-gray-900 leading-relaxed">
          {currentQuestion.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2 flex-1">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = idx === currentQuestion.correctIndex;
          const showResult = selectedAnswer !== null;

          return (
            <button
              key={idx}
              onClick={() => selectAnswer(idx)}
              disabled={selectedAnswer !== null}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all",
                showResult
                  ? isCorrect
                    ? "border-green-200 bg-yl-green-bg"
                    : isSelected
                    ? "border-red-200 bg-yl-pink-bg"
                    : "border-gray-100 bg-white opacity-50"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  showResult
                    ? isCorrect
                      ? "border-green-300 bg-yl-green text-white"
                      : isSelected
                      ? "border-red-300 bg-yl-pink text-white"
                      : "border-gray-200 text-gray-400"
                    : "border-gray-200 text-gray-500"
                )}
              >
                {showResult ? (
                  isCorrect ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isSelected ? (
                    <XIcon className="h-3.5 w-3.5" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </div>
              <span className={cn(
                "flex-1",
                showResult && isCorrect ? "font-medium text-green-800" : ""
              )}>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 animate-fade-in">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
            Explanation
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {selectedAnswer !== null && (
        <button
          onClick={nextQuestion}
          className="mt-4 w-full btn-pill-primary py-3 text-sm gap-1.5 animate-fade-in"
        >
          {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
