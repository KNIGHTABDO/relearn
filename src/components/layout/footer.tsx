"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">ReLearn</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <Link href="/settings" className="hover:text-gray-600 transition-colors">Settings</Link>
            <a href="https://discord.gg" target="_blank" rel="noopener" className="hover:text-gray-600 transition-colors">Discord Community</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Blog</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact Us</a>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-gray-300">
          © Copyright 2026 ReLearn. All rights reserved. Completely free for everyone.
        </p>
      </div>
    </footer>
  );
}
