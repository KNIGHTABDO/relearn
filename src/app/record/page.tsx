"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Clock,
  FileText,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

type RecordState = "idle" | "recording" | "paused" | "done";

function RecordPageInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("spaceId");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(40).fill(4));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startRecording = () => {
    setState("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    waveRef.current = setInterval(() => {
      setWaveform(Array(40).fill(0).map(() => 4 + Math.random() * 28));
    }, 120);
  };

  const pauseRecording = () => {
    setState("paused");
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveRef.current) clearInterval(waveRef.current);
  };

  const resumeRecording = () => {
    setState("recording");
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    waveRef.current = setInterval(() => {
      setWaveform(Array(40).fill(0).map(() => 4 + Math.random() * 28));
    }, 120);
  };

  const stopRecording = () => {
    setState("done");
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveRef.current) clearInterval(waveRef.current);
    setWaveform(Array(40).fill(4));
  };

  const processRecording = async () => {
    // In production: upload audio blob to /api/upload
    const formData = new FormData();
    formData.append(
      "text",
      `[${t("record.title")} - ${formatTime(elapsed)}]\n\n${t(
        "record.transcript_preview"
      )}\n\n${t("record.duration")}: ${formatTime(elapsed)}\nRecorded at: ${new Date().toLocaleString()}`
    );
    if (spaceId) formData.append("space_id", spaceId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.id) router.push(`/learn?id=${data.id}`);
    } catch {
      router.push("/");
    }
  };

  const resetRecording = () => {
    setState("idle");
    setElapsed(0);
    setWaveform(Array(40).fill(4));
  };

  // Post-recording view with chapters + transcript
  if (state === "done") {
    const chapters = [
      { time: "0:00", title: t("record.chapter_1"), duration: "2:15" },
      { time: "2:15", title: t("record.chapter_2"), duration: "5:30" },
      { time: "7:45", title: t("record.chapter_3"), duration: "4:10" },
      {
        time: "11:55",
        title: t("record.chapter_4"),
        duration: formatTime(Math.max(0, elapsed - 715)),
      },
    ];

    return (
      <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8">
          <div className="w-full max-w-lg">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yl-green-bg dark:bg-yl-green-bg-dark">
                <Mic className="h-6 w-6 text-yl-green" />
              </div>
              <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-dark-text">
                {t("record.recording_complete")}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">
                {t("record.duration")}: {formatTime(elapsed)}
              </p>
            </div>

            {/* Audio playback bar */}
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-dark-border p-4">
              <div className="flex items-center gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800">
                  <Play className="h-4 w-4 ml-0.5" />
                </button>
                <div className="flex-1">
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-dark-border">
                    <div className="h-full w-0 rounded-full bg-black" />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-dark-text-muted">
                    <span>0:00</span>
                    <span>{formatTime(elapsed)}</span>
                  </div>
                </div>
                <Volume2 className="h-4 w-4 text-gray-400 dark:text-dark-text-muted" />
              </div>
            </div>

            {/* Chapters */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-yl-green" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                  {t("record.chapters")}
                </h3>
              </div>
              <div className="space-y-1.5">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-100 dark:border-dark-border p-3 text-left hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-all"
                  >
                    <span className="text-xs font-mono text-gray-400 dark:text-dark-text-muted w-10 shrink-0">
                      {ch.time}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-dark-text-secondary">
                      {ch.title}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-dark-text-muted">
                      {ch.duration}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript preview */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-yl-sky" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                  {t("record.transcript")}
                </h3>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-4">
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed">
                  {t("record.transcript_preview")}
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-dark-text-muted">
                  {t("record.full_transcript_available")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button onClick={resetRecording} className="btn-pill-secondary flex-1 text-sm gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> {t("record.record_again")}
              </button>
              <button onClick={processRecording} className="btn-pill-primary flex-1 text-sm gap-1.5">
                {t("record.start_learning")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Recording / Idle view
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {state === "idle" ? t("record.record_your_class") : t("record.recording")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
            {state === "idle"
              ? t("record.record_lectures")
              : t("record.recording_in_progress")}
          </p>

          {/* Timer */}
          <div className="mt-8">
            <span
              className={cn(
                "font-mono text-4xl font-bold tabular-nums",
                state === "recording"
                  ? "text-gray-900 dark:text-dark-text"
                  : state === "paused"
                  ? "text-gray-400 dark:text-dark-text-muted"
                  : "text-gray-300 dark:text-dark-text-muted"
              )}
            >
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Waveform visualization */}
          <div className="mt-6 flex h-16 items-center justify-center gap-[3px]">
            {waveform.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 rounded-full transition-all duration-100",
                  state === "recording" ? "bg-black" : "bg-gray-200 dark:bg-dark-border"
                )}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {state === "idle" ? (
              <button
                onClick={startRecording}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
              >
                <Mic className="h-8 w-8" />
              </button>
            ) : (
              <>
                <button
                  onClick={state === "recording" ? pauseRecording : resumeRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-all"
                >
                  {state === "recording" ? <Pause className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  onClick={stopRecording}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-yl-pink text-white shadow-lg hover:bg-red-500 transition-all hover:scale-105 active:scale-95"
                >
                  <Square className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {state !== "idle" && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-dark-text-muted animate-fade-in">
              <Clock className="h-3 w-3" />
              {state === "recording"
                ? t("record.recording_in_progress")
                : t("record.paused")}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" />
        </div>
      }
    >
      <RecordPageInner />
    </Suspense>
  );
}
