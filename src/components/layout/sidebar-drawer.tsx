"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Plus,
  Search,
  Clock,
  FileText,
  Youtube,
  BookOpen,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

const recentItems = [
  { title: "Anatomy Chapter 12", icon: FileText, type: "pdf" },
  { title: "Physiology Lecture", icon: Youtube, type: "video" },
  { title: "Cell Biology Notes", icon: FileText, type: "pdf" },
];

export function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-1.5">
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
            <span className="text-base font-semibold">ReLearn</span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add Content Button */}
        <div className="px-3 py-2">
          <Link
            href="/"
            className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add content
          </Link>
        </div>

        {/* Nav Items */}
        <div className="px-3 py-1">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Clock className="h-4 w-4" />
            <span>History</span>
          </button>
        </div>

        {/* Recents */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Recents
          </p>
          {recentItems.map((item) => (
            <button
              key={item.title}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <item.icon className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
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
