"use client";

import React, { useState, useEffect } from "react";
import { Menu, ChevronDown, Check, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isAuthenticated, getSelectedModel, getStoredAuth } from "@/lib/github-auth";

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
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
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

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <Link href="/" className="flex shrink-0 items-center gap-1.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-base font-semibold text-gray-900">ReLearn</span>
        </Link>
        {title && (
          <>
            <div className="h-4 w-px bg-gray-200 shrink-0" />
            <span className="truncate text-sm text-gray-600">{title}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Active model indicator */}
        {authed && model && (
          <Link
            href="/settings"
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Zap className="h-3 w-3 text-yl-gold" />
            <span className="font-medium text-gray-700">{model}</span>
          </Link>
        )}

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm">{selectedLang.flag}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showLangDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowLangDropdown(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-44 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLang(lang); setShowLangDropdown(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                      selectedLang.code === lang.code ? "bg-gray-50 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="flex-1">{lang.label}</span>
                    {selectedLang.code === lang.code && <Check className="h-3 w-3 text-gray-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Profile button */}
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-gray-900 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            "A"
          )}
        </Link>
      </div>
    </header>
  );
}
