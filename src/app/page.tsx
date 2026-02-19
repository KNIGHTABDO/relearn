"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { Footer } from "@/components/layout/footer";
import {
  Upload,
  Link2,
  Mic,
  Sparkles,
  ArrowRight,
  Plus,
  FolderOpen,
  FileText,
  Clock,
  BarChart3,
  Brain,
  Users,
  AlertCircle,
  Loader2,
  BookOpen,
  Zap,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  fetchSpaces,
  createSpaceAction,
  uploadTextAction,
  uploadYouTubeAction,
  SpaceInfo,
} from "@/lib/data-layer";
import { useDatabaseContext } from "@/components/providers/database-provider";

interface SpaceCard {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  updatedAt: string;
  tags: string[];
}

// ── Skeleton card ─────────────────────────────────────────────────────────
function SpaceSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-dark-card" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-28 rounded-full bg-gray-100 dark:bg-dark-card" />
          <div className="h-2.5 w-20 rounded-full bg-gray-50 dark:bg-dark-surface" />
        </div>
      </div>
      <div className="mt-3 flex justify-between">
        <div className="h-2.5 w-16 rounded-full bg-gray-50 dark:bg-dark-surface" />
        <div className="h-2.5 w-16 rounded-full bg-gray-50 dark:bg-dark-surface" />
      </div>
    </div>
  );
}

// ── Coming-soon badge ──────────────────────────────────────────────────────
function ComingSoon() {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-gray-100 dark:bg-dark-card px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-dark-text-muted">
      Soon
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { ready: dbReady } = useDatabaseContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spaces, setSpaces] = useState<SpaceCard[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [learnInput, setLearnInput] = useState("");
  const [isLearning, setIsLearning] = useState(false);
  const [learnError, setLearnError] = useState<string | null>(null);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  const inputCards = [
    { title: t("home.upload"), description: t("home.upload_desc"), icon: Upload, href: "/upload", image: "/images/icon-upload.jpg" },
    { title: t("home.paste"), description: t("home.paste_desc"), icon: Link2, href: "/paste", image: "/images/icon-paste.jpg" },
    { title: t("home.record"), description: t("home.record_desc"), icon: Mic, href: "/record", image: "/images/icon-record.jpg" },
  ];

  // Load spaces once DB is ready
  useEffect(() => {
    if (!dbReady) return;
    setIsLoadingSpaces(true);
    fetchSpaces()
      .then(s => setSpaces(s))
      .catch(e => console.warn("[HomePage] fetchSpaces error:", e))
      .finally(() => setIsLoadingSpaces(false));
  }, [dbReady]);

  // Auto-focus create space input
  useEffect(() => {
    if (showCreateSpace) setTimeout(() => createInputRef.current?.focus(), 50);
  }, [showCreateSpace]);

  const handleLearn = async () => {
    if (!learnInput.trim() || isLearning) return;
    setIsLearning(true);
    setLearnError(null);
    try {
      const input = learnInput.trim();
      const isYouTube = /(?:youtube\.com\/watch|youtu\.be\/)/.test(input);
      const id = isYouTube ? await uploadYouTubeAction(input) : await uploadTextAction(input);
      if (id) router.push(`/learn?id=${id}`);
      else setLearnError("Couldn't process that input — try a YouTube link or paste some text.");
    } catch (e: any) {
      console.warn("[HomePage] handleLearn error:", e);
      setLearnError("Something went wrong. Please try again.");
    } finally {
      setIsLearning(false);
    }
  };

  const createSpace = async () => {
    if (!newSpaceName.trim()) return;
    setCreateError(null);
    try {
      const space = await createSpaceAction(newSpaceName.trim());
      if (space) {
        setSpaces(prev => [space, ...prev]);
        setNewSpaceName("");
        setShowCreateSpace(false);
        router.push(`/space?id=${space.id}`);
      } else {
        setCreateError("Failed to create space. Please try again.");
      }
    } catch (e: any) {
      console.warn("[HomePage] createSpace error:", e);
      setCreateError("Something went wrong creating the space.");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} spaces={spaces} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">

          {/* ── Hero ── */}
          <div className="text-center">
            <div className="mb-6">
              <Image
                src="/images/hero.jpg"
                alt={t("home.hero_alt")}
                width={480}
                height={270}
                className="mx-auto rounded-2xl"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text sm:text-3xl">
              {t("home.title")}
            </h1>

            {/* Input cards */}
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
              {inputCards.map(card => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-5 transition-all hover:border-gray-300 dark:hover:border-dark-border hover:shadow-sm dark:shadow-none"
                >
                  {card.image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden mb-1">
                      <Image src={card.image} alt={card.title} width={64} height={64} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-dark-surface">
                    <card.icon className="h-4 w-4 text-gray-600 dark:text-dark-text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{card.title}</span>
                  <span className="text-[11px] text-gray-400 dark:text-dark-text-muted">{card.description}</span>
                </Link>
              ))}
            </div>

            {/* Learn anything input */}
            <div className="mx-auto mt-6 max-w-lg">
              <div className={cn(
                "flex items-center rounded-full border bg-white dark:bg-dark-bg px-5 py-3 shadow-sm transition-all",
                learnError
                  ? "border-red-200 dark:border-red-900/40"
                  : "border-gray-200 dark:border-dark-border focus-within:border-gray-300 dark:focus-within:border-dark-border focus-within:shadow-md"
              )}>
                {isLearning
                  ? <Loader2 className="mr-3 h-4 w-4 text-gray-400 dark:text-dark-text-muted animate-spin" />
                  : <Sparkles className="mr-3 h-4 w-4 text-gray-400 dark:text-dark-text-muted" />
                }
                <input
                  type="text"
                  value={learnInput}
                  onChange={e => { setLearnInput(e.target.value); setLearnError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleLearn()}
                  placeholder={t("home.learn_anything")}
                  disabled={isLearning}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleLearn}
                  disabled={isLearning || !learnInput.trim()}
                  className="ml-2 flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40 transition-opacity"
                >
                  {isLearning ? <Loader2 className="h-3 w-3 animate-spin" /> : <><span>{t("home.learn_button")}</span><ArrowRight className="h-3 w-3" /></>}
                </button>
              </div>
              {learnError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 justify-center">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {learnError}
                </div>
              )}
            </div>
          </div>

          {/* ── Value props strip (replaces fake university section) ── */}
          <div className="mt-10 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: BookOpen, label: "PDFs, slides & notes" },
              { icon: Zap, label: "AI flashcards & quizzes" },
              { icon: FlaskConical, label: "Chat with your material" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 dark:border-dark-border px-3 py-3.5">
                <Icon className="h-4 w-4 text-gray-400 dark:text-dark-text-muted" />
                <span className="text-xs text-gray-500 dark:text-dark-text-muted">{label}</span>
              </div>
            ))}
          </div>

          {/* ── Quick Actions ── */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Link href="/progress"
              className="group flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg p-4 transition-all hover:border-purple-200 dark:hover:border-purple-900 hover:shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{t("home.your_progress")}</p>
                <p className="text-xs text-gray-400 dark:text-dark-text-muted">{t("home.analytics_and_stats")}</p>
              </div>
            </Link>

            <div className="group flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg p-4 opacity-60 cursor-not-allowed">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{t("home.study_planner")}</p>
                <p className="text-xs text-gray-400 dark:text-dark-text-muted">{t("home.ai_powered_schedule")}</p>
              </div>
              <ComingSoon />
            </div>

            <div className="group flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg p-4 opacity-60 cursor-not-allowed">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950">
                <Users className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{t("home.collaborate")}</p>
                <p className="text-xs text-gray-400 dark:text-dark-text-muted">{t("home.share_and_study_together")}</p>
              </div>
              <ComingSoon />
            </div>
          </div>

          {/* ── Spaces section ── */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                {t("home.recent_spaces")}
              </h2>
              <button
                onClick={() => setShowCreateSpace(true)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-dark-border px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
              >
                <Plus className="h-3 w-3" />
                {t("home.create_space")}
              </button>
            </div>

            {/* Create space inline form */}
            {showCreateSpace && (
              <div className="mt-3 animate-fade-in space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-3">
                  <FolderOpen className="h-5 w-5 text-gray-400 dark:text-dark-text-muted shrink-0" />
                  <input
                    ref={createInputRef}
                    type="text"
                    value={newSpaceName}
                    onChange={e => { setNewSpaceName(e.target.value); setCreateError(null); }}
                    onKeyDown={e => { if (e.key === "Enter") createSpace(); if (e.key === "Escape") setShowCreateSpace(false); }}
                    placeholder={t("home.space_name")}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted outline-none"
                  />
                  <button onClick={createSpace} disabled={!newSpaceName.trim()}
                    className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40 transition-opacity">
                    {t("common.create")}
                  </button>
                  <button onClick={() => { setShowCreateSpace(false); setCreateError(null); }}
                    className="text-xs text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary">
                    {t("common.cancel")}
                  </button>
                </div>
                {createError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{createError}
                  </div>
                )}
              </div>
            )}

            {/* Space cards grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Loading skeletons */}
              {isLoadingSpaces && !dbReady && (
                <>{[...Array(3)].map((_, i) => <SpaceSkeleton key={i} />)}</>
              )}
              {isLoadingSpaces && dbReady && (
                <>{[...Array(3)].map((_, i) => <SpaceSkeleton key={i} />)}</>
              )}

              {/* Space cards */}
              {!isLoadingSpaces && spaces.map(space => (
                <Link
                  key={space.id}
                  href={`/space?id=${space.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg p-4 transition-all hover:border-gray-300 dark:hover:border-dark-border hover:shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg shrink-0"
                      style={{ backgroundColor: space.color + "20" }}>
                      {space.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">{space.name}</h3>
                      {space.description && (
                        <p className="text-xs text-gray-400 dark:text-dark-text-muted truncate">{space.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-dark-text-muted">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {space.documentCount} {space.documentCount === 1 ? t("common.file") : t("common.files")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(space.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {space.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {space.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-full bg-gray-100 dark:bg-dark-card px-2 py-0.5 text-[10px] text-gray-500 dark:text-dark-text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}

              {/* Empty state — no image dependency */}
              {!isLoadingSpaces && spaces.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-border py-14 gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-dark-surface">
                    <FolderOpen className="h-7 w-7 text-gray-200 dark:text-dark-text-muted" />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-dark-text-muted">{t("home.no_spaces")}</p>
                  <button
                    onClick={() => setShowCreateSpace(true)}
                    className="mt-1 text-xs font-medium text-gray-500 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text transition-colors"
                  >
                    {t("home.no_spaces_desc")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
