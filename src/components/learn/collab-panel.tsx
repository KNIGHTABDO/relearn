"use client";

import React, { useState } from "react";
import {
  Users,
  Share2,
  Copy,
  Mail,
  Crown,
  Pencil,
  Eye,
  X,
  Trash2,
  MessageSquare,
  Send,
  Clock,
  CheckCheck,
  Globe,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "Owner" | "Editor" | "Viewer";

interface Collaborator {
  id: string;
  name: string;
  role: Role;
}

interface ActivityItem {
  id: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  replies?: Comment[];
}

/**
 * Mock data generators
 */
const mockCollaborators: Collaborator[] = [
  { id: "1", name: "Alice Johnson", role: "Owner" },
  { id: "2", name: "Bob Smith", role: "Editor" },
  { id: "3", name: "Carol Lee", role: "Viewer" },
];

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    avatar: "https://i.pravatar.cc/40?img=1",
    text: "Alex added 3 flashcards",
    timestamp: "2m ago",
  },
  {
    id: "2",
    avatar: "https://i.pravatar.cc/40?img=2",
    text: "Sarah completed Quiz 3 — 87%",
    timestamp: "15m ago",
  },
  {
    id: "3",
    avatar: "https://i.pravatar.cc/40?img=3",
    text: "You uploaded lecture-notes.pdf",
    timestamp: "1h ago",
  },
];

const mockComments: Comment[] = [
  {
    id: "c1",
    author: "David",
    avatar: "https://i.pravatar.cc/40?img=4",
    text: "Great explanation!",
    timestamp: "5m ago",
    replies: [
      {
        id: "c1r1",
        author: "You",
        avatar: "https://i.pravatar.cc/40?img=5",
        text: "Thanks, David!",
        timestamp: "2m ago",
      },
    ],
  },
  {
    id: "c2",
    author: "Emma",
    avatar: "https://i.pravatar.cc/40?img=6",
    text: "Can we add more examples?",
    timestamp: "12m ago",
  },
];

export default function CollabPanel() {
  const [shareOpen, setShareOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(
    mockCollaborators
  );
  const [email, setEmail] = useState("");
  const [activity] = useState<ActivityItem[]>(mockActivity);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");

  /** Share panel helpers */
  const copyLink = () => {
    navigator.clipboard.writeText("https://example.com/space/12345");
  };

  const addCollaborator = () => {
    if (!email) return;
    const newCollab: Collaborator = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      role: "Viewer",
    };
    setCollaborators((prev) => [...prev, newCollab]);
    setEmail("");
  };

  const removeCollaborator = (id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  };

  /** Comment helpers */
  const postComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      author: "You",
      avatar: "https://i.pravatar.cc/40?img=7",
      text: newComment.trim(),
      timestamp: "just now",
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const roleBadge = (role: Role) => {
    const base = "text-xs font-medium px-2 py-0.5 rounded";
    const colors: Record<Role, string> = {
      Owner: "bg-purple-100 text-purple-600",
      Editor: "bg-blue-100 text-blue-600",
      Viewer: "bg-gray-100 text-gray-600",
    };
    const icons: Record<Role, JSX.Element> = {
      Owner: <Crown size={12} className="inline-block mr-1" />,
      Editor: <Pencil size={12} className="inline-block mr-1" />,
      Viewer: <Eye size={12} className="inline-block mr-1" />,
    };
    return (
      <span className={cn(base, colors[role])}>
        {icons[role]}
        {role}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-6 text-gray-900 dark:text-gray-100">
      {/* Share button */}
      <button
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        )}
        onClick={() => setShareOpen(true)}
      >
        <Users size={20} />
        Share Space
      </button>

      {/* Share panel (slide‑in) */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShareOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300",
          shareOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Share panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Share Space</h2>
          <button onClick={() => setShareOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Share link */}
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <input
              readOnly
              value="https://example.com/space/12345"
              className="flex-1 px-2 py-1 border rounded bg-gray-50 dark:bg-gray-900 focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <Copy size={18} />
            </button>
          </div>

          {/* Invite by email */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-2 py-1 border rounded bg-gray-50 dark:bg-gray-900 focus:outline-none"
            />
            <button
              onClick={addCollaborator}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Mail size={16} />
              Invite
            </button>
          </div>

          {/* Collaborators list */}
          <div>
            <h3 className="font-medium mb-2">Collaborators</h3>
            <ul className="space-y-2">
              {collaborators.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-medium",
                      c.role === "Owner"
                        ? "bg-purple-500"
                        : c.role === "Editor"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                    )}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1">{c.name}</span>
                  {roleBadge(c.role)}
                  <button
                    onClick={() => removeCollaborator(c.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Live Indicators */}
      <section className="flex items-center gap-4">
        {/* Online badge */}
        <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          3 online
        </div>

        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {["1", "2", "3"].map((i) => (
            <img
              key={i}
              src={`https://i.pravatar.cc/32?img=${i}`}
              alt="avatar"
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
            />
          ))}
          <span className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-600 text-sm rounded-full border-2 border-white dark:border-gray-800">
            +2
          </span>
        </div>

        {/* Typing indicator */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <span className="mr-1">Sarah is editing</span>
          <span className="animate-pulse">.</span>
          <span className="animate-pulse animation-delay-200">.</span>
          <span className="animate-pulse animation-delay-400">.</span>
        </div>
      </section>

      {/* Activity Feed */}
      <section className="border-l border-gray-300 dark:border-gray-600 pl-4 space-y-4">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
        <ul className="space-y-3">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <img
                  src={item.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm">{item.text}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.timestamp}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Comments / Notes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id}>
              <div className="flex items-start gap-3">
                <img
                  src={c.avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {c.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{c.text}</p>
                </div>
              </div>

              {/* Replies (indented) */}
              {c.replies && c.replies.length > 0 && (
                <ul className="ml-12 mt-2 space-y-3">
                  {c.replies.map((r) => (
                    <li key={r.id} className="flex items-start gap-3">
                      <img
                        src={r.avatar}
                        alt="avatar"
                        className="w-7 h-7 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.author}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {r.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{r.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* New comment input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 focus:outline-none"
          />
          <button
            onClick={postComment}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Send size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}