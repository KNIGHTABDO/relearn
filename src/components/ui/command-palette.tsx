"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  Link2,
  Mic,
  Settings,
  BarChart3,
  FolderOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { fetchSpaces, SpaceInfo } from "@/lib/data-layer";

interface Command {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  action: () => void;
  type: "command" | "space";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const router = useRouter();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Global Cmd+K / Ctrl+K toggle ─────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  // ── Load spaces when palette opens ───────────────────────────────
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIdx(0);
    setTimeout(() => inputRef.current?.focus(), 50);
    fetchSpaces()
      .then(setSpaces)
      .catch((e) => console.warn("[CommandPalette] fetchSpaces:", e));
  }, [open]);

  // ── Static commands ──────────────────────────────────────────────
  const staticCommands: Command[] = [
    {
      id: "upload",
      icon: Upload,
      label: t("cmd.upload"),
      description: t("cmd.upload_desc"),
      action: () => router.push("/upload"),
      type: "command",
    },
    {
      id: "paste",
      icon: Link2,
      label: t("cmd.paste"),
      description: t("cmd.paste_desc"),
      action: () => router.push("/paste"),
      type: "command",
    },
    {
      id: "record",
      icon: Mic,
      label: t("cmd.record"),
      description: t("cmd.record_desc"),
      action: () => router.push("/record"),
      type: "command",
    },
    {
      id: "settings",
      icon: Settings,
      label: t("cmd.settings"),
      action: () => router.push("/settings"),
      type: "command",
    },
    {
      id: "progress",
      icon: BarChart3,
      label: t("cmd.progress"),
      action: () => router.push("/progress"),
      type: "command",
    },
  ];

  const q = query.toLowerCase();

  const filteredCommands = staticCommands.filter(
    (c) =>
      !q ||
      c.label.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
  );

  const filteredSpaces = spaces.filter(
    (s) => !q || s.name.toLowerCase().includes(q)
  );

  const allItems: Command[] = [
    ...filteredCommands,
    ...filteredSpaces.map((s) => ({
      id: s.id,
      icon: FolderOpen,
      label: s.name,
      description: `${s.documentCount} file${s.documentCount !== 1 ? "s" : ""}`,
      action: () => router.push(`/space?id=${s.id}`),
      type: "space" as const,
    })),
  ];

  // ── Keyboard navigation ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = allItems[selectedIdx];
        if (item) {
          item.action();
          setOpen(false);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selectedIdx, allItems]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-dark-border">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            placeholder={t("cmd.placeholder")}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-dark-text-muted dark:text-dark-text"
          />
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filteredCommands.length > 0 && (
            <div>
              <p className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-muted">
                {t("cmd.section_commands")}
              </p>
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                const idx = allItems.findIndex((i) => i.id === cmd.id);
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onClick={() => {
                      cmd.action();
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        : "text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-surface"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-xs text-gray-400 dark:text-dark-text-muted">
                        {cmd.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {filteredSpaces.length > 0 && (
            <div className="mt-1">
              <p className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-muted">
                {t("cmd.section_spaces")}
              </p>
              {filteredSpaces.map((s) => {
                const spaceCmd = allItems.find((i) => i.id === s.id);
                const idx = allItems.findIndex((i) => i.id === s.id);
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={s.id}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onClick={() => {
                      router.push(`/space?id=${s.id}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        : "text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-surface"
                    )}
                  >
                    <span className="text-base shrink-0">{s.icon || "📁"}</span>
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-gray-400 dark:text-dark-text-muted">
                      {s.documentCount} {s.documentCount !== 1 ? t("common.files") : t("common.file")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {t("cmd.no_results").replace("{q}", query)}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-dark-border">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <kbd className="rounded border border-gray-200 dark:border-dark-border px-1 font-mono">↑↓</kbd>
            {t("cmd.hint_navigate")}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <kbd className="rounded border border-gray-200 dark:border-dark-border px-1 font-mono">↵</kbd>
            {t("cmd.hint_open")}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <kbd className="rounded border border-gray-200 dark:border-dark-border px-1 font-mono">⌘K</kbd>
            {t("cmd.hint_toggle")}
          </span>
        </div>
      </div>
    </div>
  );
}
