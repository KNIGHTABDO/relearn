"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  FileText,
  Upload,
  Link2,
  MoreVertical,
  MessageSquare,
  ClipboardCheck,
  Trash2,
  Plus,
  ArrowLeft,
  Layers,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SpaceData {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  tags: string[];
  documents: Array<{
    id: string;
    title: string;
    type: string;
    fileSize: number;
    pageCount: number;
    createdAt: string;
  }>;
}

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [space, setSpace] = useState<SpaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/spaces/\${spaceId}\`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          router.push("/");
        } else {
          setSpace(d);
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [spaceId, router]);

  const handleUploadToSpace = () => {
    router.push(\`/upload?spaceId=\${spaceId}\`);
  };

  const handlePasteToSpace = () => {
    router.push(\`/paste?spaceId=\${spaceId}\`);
  };

  const deleteDocument = async (docId: string) => {
    await fetch(\`/api/document/\${docId}\`, { method: "DELETE" });
    setSpace((prev) =>
      prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) } : null
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!space) return null;

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header title={space.name} onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Library
          </button>

          {/* Space header */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shrink-0"
              style={{ backgroundColor: space.color + "20" }}
            >
              {space.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{space.name}</h1>
              {space.description && (
                <p className="mt-0.5 text-sm text-gray-500">{space.description}</p>
              )}
              {space.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {space.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Space actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={\`/learn?spaceId=\${spaceId}\`}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-yl-sky" />
              Chat with Space
            </Link>
            <Link
              href={\`/exam?spaceId=\${spaceId}\`}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ClipboardCheck className="h-4 w-4 text-yl-pink" />
              Practice Exam
            </Link>
            <button
              onClick={handleUploadToSpace}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4 text-gray-500" />
              Upload File
            </button>
            <button
              onClick={handlePasteToSpace}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Link2 className="h-4 w-4 text-gray-500" />
              Paste Link
            </button>
          </div>

          {/* Documents list */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Documents ({space.documents.length})
              </h2>
            </div>

            {space.documents.length > 0 ? (
              <div className="space-y-2">
                {space.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <Link
                      href={\`/learn?id=\${doc.id}\`}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate hover:text-yl-blue transition-colors">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{doc.type.toUpperCase()}</span>
                        {doc.pageCount > 0 && <span>{doc.pageCount} pages</span>}
                        {doc.fileSize > 0 && (
                          <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12">
                <Layers className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No documents yet</p>
                <button
                  onClick={handleUploadToSpace}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <Plus className="h-3 w-3" />
                  Add your first file
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
