"use client";

import React, { useState, useEffect } from "react";
import { Menu, ChevronDown, Check, Zap, Sun, Moon, Monitor } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useI18n, Language } from "@/components/providers/i18n-provider";
import { isAuthenticated, getSelectedModel, getStoredAuth } from "@/lib/github-auth";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇲🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

export function Header({ title, onMenuClick }: HeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { lang, setLang, t } = useI18n();
  const selectedLang = languages.find(l => l.code === lang) || languages[0];
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [model, setModel] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setAuthed(isAuthenticated());
      setModel(getSelectedModel());
      const auth = getStoredAuth();
      setAvatar(auth?.avatarUrl || null);
    };
    update();
    window.addEventListener("github-auth-changed", update);
    window.addEventListener("model-changed", update);
    return () => {
      window.removeEventListener("github-auth-changed", update);
      window.removeEventListener("model-changed", update);
    };
  }, []);

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 dark:border-dark-border px-4 bg-white dark:bg-dark-bg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-dark-text-secondary" />
        </button>

        {title ? (
          <span className="truncate text-sm font-medium text-gray-900 dark:text-dark-text">{title}</span>
        ) : (
          <Link href="/" className="flex items-center gap-1.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-900 dark:text-dark-text" />
              <path d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-900 dark:text-dark-text" />
            </svg>
            <span className="text-base font-bold text-gray-900 dark:text-dark-text">ReLearn</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* AI Model badge */}
        {authed && model && (
          <Link
            href="/settings"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-yl-green-bg dark:bg-yl-green-bg-dark px-2.5 py-1 text-[11px] font-medium text-yl-green transition-colors hover:opacity-80"
          >
            <Zap className="h-3 w-3" />
            {model.split("/").pop()?.replace("gpt-", "GPT-").replace("claude-", "Claude ") || model}
          </Link>
        )}

        {/* Theme toggle */}
        <div className="relative">
          <button
            onClick={() => { setShowThemeDropdown(!showThemeDropdown); setShowLangDropdown(false); }}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4 text-gray-600 dark:text-dark-text-secondary" />
            ) : (
              <Sun className="h-4 w-4 text-gray-600" />
            )}
          </button>
          {showThemeDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowThemeDropdown(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-36 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card py-1 shadow-lg animate-fade-in">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); setShowThemeDropdown(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                      theme === opt.value
                        ? "bg-gray-50 dark:bg-dark-hover text-gray-900 dark:text-dark-text font-medium"
                        : "text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover"
                    )}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                    {theme === opt.value && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => { setShowLangDropdown(!showLangDropdown); setShowThemeDropdown(false); }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
          >
            <span className="text-base leading-none">{selectedLang.flag}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showLangDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowLangDropdown(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card py-1 shadow-lg max-h-64 overflow-y-auto animate-fade-in">
                {languages.map((langOpt) => (
                  <button
                    key={langOpt.code}
                    onClick={() => { console.log("[ReLearn] Changing language to:", langOpt.code); setLang(langOpt.code as Language); setShowLangDropdown(false); setShowLangDropdown(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                      selectedLang.code === langOpt.code
                        ? "bg-gray-50 dark:bg-dark-hover text-gray-900 dark:text-dark-text font-medium"
                        : "text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover"
                    )}
                  >
                    <span className="text-base leading-none">{langOpt.flag}</span>
                    <span>{langOpt.label}</span>
                    {selectedLang.code === langOpt.code && <Check className="h-3 w-3 ml-auto text-yl-green" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Settings / Avatar */}
        <Link
          href="/settings"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-hover transition-colors overflow-hidden"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary">U</span>
          )}
        </Link>
      </div>
    </header>
  );
}
