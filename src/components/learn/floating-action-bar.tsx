"use client";

import React from "react";
import {
  Lightbulb,
  MessageSquare,
  ClipboardCheck,
  Layers,
  BookmarkPlus,
  Volume2,
} from "lucide-react";

const actions = [
  { label: "Explain", icon: Lightbulb },
  { label: "Chat", icon: MessageSquare },
  { label: "Quiz", icon: ClipboardCheck },
  { label: "Flashcards", icon: Layers },
  { label: "Add to notes", icon: BookmarkPlus },
  { label: "Read aloud", icon: Volume2 },
];

interface FloatingActionBarProps {
  visible?: boolean;
  className?: string;
}

export function FloatingActionBar({
  visible = true,
  className,
}: FloatingActionBarProps) {
  if (!visible) return null;

  return (
    <div
      className={`inline-flex items-center rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-2 py-1.5 shadow-lg transition-colors ${className}`}
    >
      {actions.map((action, i) => (
        <React.Fragment key={action.label}>
          <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-dark-text-secondary transition-colors hover:bg-gray-50 dark:hover:bg-dark-hover">
            <action.icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{action.label}</span>
          </button>
          {i < actions.length - 1 && (
            <div className="h-4 w-px bg-gray-100 dark:bg-dark-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
