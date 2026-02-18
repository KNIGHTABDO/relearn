"use client";

import React from "react";
import { Menu, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
      {/* Left: Hamburger + Logo + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* YouLearn-style logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex items-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-base font-semibold text-gray-900 hidden sm:inline">
            ReLearn
          </span>
        </Link>

        {title && (
          <>
            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
            <span className="text-sm font-medium text-gray-600 truncate max-w-[200px] hidden sm:inline">
              {title}
            </span>
          </>
        )}
      </div>

      {/* Right: Language + Sign In */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
          <Globe className="h-3.5 w-3.5" />
          <span>EN</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        <button className="btn-pill-primary text-xs px-4 py-1.5">
          Sign In
        </button>
      </div>
    </header>
  );
}
