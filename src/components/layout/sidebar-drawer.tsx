"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { useDatabaseContext } from "@/components/providers/database-provider";
import { fetchSpaces, SpaceInfo, searchAction, getRecentDocumentsAction } from "@/lib/data-layer";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  Plus,
  Search,
  Clock,
  FileText,
  FolderOpen,
  Settings,
  HelpCircle,
  Home,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  spaces?: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    documentCount: number;
  }>;
}

export function SidebarDrawer({ open, onClose, spaces: propSpaces = [] }: SidebarDrawerProps) {
  const { ready: dbReady } = useDatabaseContext();
  const [spaces, setSpaces] = useState<SpaceInfo[]>(propSpaces);

  useEffect(() => {
    if (dbReady) {
      fetchSpaces().then(s => setSpaces(s)).catch(() => {});
    }
  }, [dbReady, open]);

  // Merge prop spaces when they change
  useEffect(() => {
    if (propSpaces.length > 0) setSpaces(propSpaces);
  }, [propSpaces]);


  const [showSearch, setShowSearch] = useState(false);
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchAction(searchQuery);
        setSearchResults(data);
      } catch { setSearchResults(null); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const [recentItems, setRecentItems] = useState<Array<{ id: string; title: string; type: string; spaceId?: string }>>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Load real recent docs when History panel opens
  useEffect(() => {
    if (!showHistory) return;
    setRecentLoading(true);
    getRecentDocumentsAction(8)
      .then(docs => setRecentItems(docs))
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }, [showHistory]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 transition-opacity" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white dark:bg-dark-bg shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-1.5" onClick={onClose}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-base font-semibold">ReLearn</span>
          </Link>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add Content */}
        <div className="px-3 py-2">
          <Link
            href="/upload"
            onClick={onClose}
            className="flex w-full items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
          >
            <Plus className="h-4 w-4" />
            {t("home.upload")}
          </Link>
        </div>

        {/* Nav */}
        <div className="px-3 py-1">
          <Link href="/" onClick={onClose} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface">
            <Home className="h-4 w-4" />
            <span>{t("nav.home")}</span>
          </Link>

          {/* Search */}
          <button
            onClick={() => { setShowSearch(!showSearch); setShowHistory(false); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
          >
            <Search className="h-4 w-4" />
            <span>{t("nav.search")}</span>
          </button>

          {showSearch && (
            <div className="px-1 py-1 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-dark-text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("common.search")}
                  className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface py-2 pl-9 pr-3 text-xs text-gray-700 dark:text-dark-text-secondary outline-none focus:border-gray-300 dark:focus:border-dark-border"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-gray-400 dark:text-dark-text-muted" />}
              </div>
              {searchResults && (
                <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg">
                  {searchResults.spaces?.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-dark-text-muted">{t("nav.spaces")}</p>
                      {searchResults.spaces.map((s: any) => (
                        <Link
                          key={s.id}
                          href={`/space?id=${s.id}`}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
                        >
                          <span>{s.icon}</span>
                          <span className="truncate">{s.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.documents?.length > 0 && (
                    <div className="border-t border-gray-50 p-2">
                      <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-dark-text-muted">{t("space.documents")}</p>
                      {searchResults.documents.map((d: any) => (
                        <Link
                          key={d.id}
                          href={`/learn?id=${d.id}`}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
                        >
                          <FileText className="h-3 w-3 text-gray-400 dark:text-dark-text-muted" />
                          <span className="truncate">{d.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.spaces?.length === 0 && searchResults.documents?.length === 0 && searchQuery && (
                    <p className="p-3 text-center text-xs text-gray-400 dark:text-dark-text-muted">{t("common.no_results")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* History */}
          <button
            onClick={() => { setShowHistory(!showHistory); setShowSearch(false); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
          >
            <Clock className="h-4 w-4" />
            <span>{t("nav.history")}</span>
          </button>

          {showHistory && (
            <div className="px-1 py-1 animate-fade-in">
              <div className="rounded-lg border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg">
                {recentLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-300 dark:text-dark-text-muted" />
                  </div>
                ) : recentItems.length === 0 ? (
                  <p className="px-3 py-3 text-center text-xs text-gray-300 dark:text-dark-text-muted">{t("home.no_spaces")}</p>
                ) : recentItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/learn?id=${item.id}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface border-b border-gray-50 dark:border-dark-border last:border-b-0"
                  >
                    <FileText className="h-3 w-3 text-gray-400 dark:text-dark-text-muted shrink-0" />
                    <span className="truncate">{item.title}</span>
                    <span className="ml-auto text-[10px] text-gray-300 dark:text-dark-text-muted uppercase shrink-0">{item.type}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spaces */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-dark-text-muted">
            {t("nav.spaces")}
          </p>
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={`/space?id=${space.id}`}
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface"
            >
              <span className="text-base">{space.icon}</span>
              <span className="truncate flex-1">{space.name}</span>
              <span className="text-xs text-gray-300 dark:text-dark-text-muted">{space.documentCount}</span>
            </Link>
          ))}
          {spaces.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-300 dark:text-dark-text-muted">{t("home.no_spaces")}</p>
          )}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-100 dark:border-dark-border p-3">
          <Link href="/settings" onClick={onClose} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface">
            <Settings className="h-4 w-4" />
            <span>{t("nav.settings")}</span>
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface">
            <HelpCircle className="h-4 w-4" />
            <span>{t("nav.help")}</span>
          </button>
        </div>
      </div>
    </>
  );
}