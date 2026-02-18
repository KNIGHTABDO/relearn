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
      className={`inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-lg ${className}`}
    >
      {actions.map((action, i) => (
        <React.Fragment key={action.label}>
          <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <action.icon className="h-3.5 w-3.5" />
            <span>{action.label}</span>
          </button>
          {i < actions.length - 1 && (
            <div className="h-4 w-px bg-gray-100" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
