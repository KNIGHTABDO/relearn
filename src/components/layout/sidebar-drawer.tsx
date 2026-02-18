"use client";

import React from "react";
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

export function SidebarDrawer({ open, onClose, spaces = [] }: SidebarDrawerProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 transition-opacity" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-1.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 6C7 6 9 6 10 10C11 14 9 20 9 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M14 6C14 6 16 6 17 10C18 14 16 20 16 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-base font-semibold">ReLearn</span>
          </Link>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add Content */}
        <div className="px-3 py-2">
          <Link
            href="/upload"
            className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add content
          </Link>
        </div>

        {/* Nav */}
        <div className="px-3 py-1">
          <Link href="/" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            <Clock className="h-4 w-4" />
            <span>History</span>
          </button>
        </div>

        {/* Spaces */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Spaces
          </p>
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={\`/space/\${space.id}\`}
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <span className="text-base">{space.icon}</span>
              <span className="truncate flex-1">{space.name}</span>
              <span className="text-xs text-gray-300">{space.documentCount}</span>
            </Link>
          ))}
          {spaces.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-300">No spaces yet</p>
          )}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-100 p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </button>
        </div>
      </div>
    </>
  );
}
