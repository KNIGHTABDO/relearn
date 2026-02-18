"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  Upload,
  Link2,
  Mic,
  Sparkles,
  ArrowRight,
  Plus,
  FolderOpen,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SpaceCard {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  updatedAt: string;
  tags: string[];
}

const inputCards = [
  { title: "Upload", description: "File, audio, video", icon: Upload, href: "/upload" },
  { title: "Paste", description: "YouTube, website, text", icon: Link2, href: "/paste" },
  { title: "Record", description: "Record class, video call", icon: Mic, href: "/record" },
];

export default function HomePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spaces, setSpaces] = useState<SpaceCard[]>([]);
  const [learnInput, setLearnInput] = useState("");
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((d) => setSpaces(d.spaces || []))
      .catch(() => {});
  }, []);

  const handleLearn = async () => {
    if (!learnInput.trim()) return;
    const formData = new FormData();
    formData.append("text", learnInput.trim());
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.id) router.push(\`/learn?id=\${data.id}\`);
    } catch (e) {}
  };

  const createSpace = async () => {
    if (!newSpaceName.trim()) return;
    const colors = ["#10B981", "#3B82F6", "#A855F7", "#F43F5E", "#F97316", "#EAB308"];
    const icons = ["📚", "🧬", "💻", "🧠", "📐", "🎨", "⚡", "🌍"];
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName.trim(),
          color: colors[Math.floor(Math.random() * colors.length)],
          icon: icons[Math.floor(Math.random() * icons.length)],
        }),
      });
      const space = await res.json();
      setSpaces((prev) => [{ ...space, documentCount: 0 }, ...prev]);
      setNewSpaceName("");
      setShowCreateSpace(false);
    } catch (e) {}
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        spaces={spaces}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Header section */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              What do you want to learn?
            </h1>

            {/* Input cards */}
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
              {inputCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-5 transition-all hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                    <card.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{card.title}</span>
                  <span className="text-[11px] text-gray-400">{card.description}</span>
                </Link>
              ))}
            </div>

            {/* Learn anything input */}
            <div className="mx-auto mt-6 max-w-lg">
              <div className="flex items-center rounded-full border border-gray-200 bg-white px-5 py-3 shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md">
                <Sparkles className="mr-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLearn()}
                  placeholder="Learn anything..."
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={handleLearn}
                  className="ml-2 flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                >
                  <span>Learn</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Spaces section */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Spaces</h2>
              <button
                onClick={() => setShowCreateSpace(true)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                New Space
              </button>
            </div>

            {/* Create space inline form */}
            {showCreateSpace && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 animate-fade-in">
                <FolderOpen className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createSpace()}
                  placeholder="Space name (e.g., Biology 101)"
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button
                  onClick={createSpace}
                  className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateSpace(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Space cards grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  href={\`/space/\${space.id}\`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: space.color + "20" }}
                    >
                      {space.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {space.name}
                      </h3>
                      {space.description && (
                        <p className="text-xs text-gray-400 truncate">{space.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {space.documentCount} {space.documentCount === 1 ? "file" : "files"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(space.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {space.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {space.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}

              {/* Empty state */}
              {spaces.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12">
                  <FolderOpen className="h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-400">No spaces yet</p>
                  <button
                    onClick={() => setShowCreateSpace(true)}
                    className="mt-3 text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    Create your first space
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
