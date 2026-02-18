"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
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
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { useDatabaseContext } from "@/components/providers/database-provider";
import { getSpaceById, getDocumentsBySpace, deleteDocumentAction } from "@/lib/data-layer";

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

function SpacePageInner() {
  const { t } = useI18n();
  const { ready: dbReady } = useDatabaseContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const spaceId = searchParams.get("id") || "";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [space, setSpace] = useState<SpaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbReady || !spaceId) return;
    getSpaceById(spaceId).then((s) => {
      if (!s) {
        router.push("/");
      } else {
        getDocumentsBySpace(spaceId).then((docs) => {
          setSpace({ ...s, documents: docs });
        }).catch(() => {});
      }
    }).catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [spaceId, router, dbReady]);

  const handleUploadToSpace = () => {
    router.push(`/upload?spaceId=${spaceId}`);
  };

  const handlePasteToSpace = () => {
    router.push(`/paste?spaceId=${spaceId}`);
  };

  const deleteDocument = async (docId: string) => {
    await deleteDocumentAction(docId);
    setSpace((prev) =>
      prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) } : null
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 dark:border-dark-border border-t-gray-900" />
      </div>
    );
  }

  if (!space) return null;

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
      <Header title={space.name} onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text dark:text-dark-text-secondary transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("common.back_to_library")}
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">{space.name}</h1>
              {space.description && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-text-muted">{space.description}</p>
              )}
              {space.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {space.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 dark:bg-dark-card px-2 py-0.5 text-xs text-gray-500 dark:text-dark-text-muted"
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
              href={`/learn?spaceId=${spaceId}`}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-yl-sky" />
              {t("space.chat")}
            </Link>
            <Link
              href={`/exam?spaceId=${spaceId}`}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
            >
              <ClipboardCheck className="h-4 w-4 text-yl-pink" />
              {t("space.exam")}
            </Link>
            <button
              onClick={handleUploadToSpace}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
            >
              <Upload className="h-4 w-4 text-gray-500 dark:text-dark-text-muted" />
              {t("space.upload_doc")}
            </button>
            <button
              onClick={handlePasteToSpace}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface transition-colors"
            >
              <Link2 className="h-4 w-4 text-gray-500 dark:text-dark-text-muted" />
              {t("space.paste_url")}
            </button>
          </div>

          {/* Documents list */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                {t("space.documents_count", { count: space.documents.length })}
              </h2>
            </div>

            {space.documents.length > 0 ? (
              <div className="space-y-2">
                {space.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg p-3 transition-all hover:border-gray-300 dark:border-dark-border hover:shadow-sm dark:shadow-none"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-dark-surface dark:bg-dark-surface">
                      <FileText className="h-5 w-5 text-gray-400 dark:text-dark-text-muted" />
                    </div>
                    <Link href={`/learn?id=${doc.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate hover:text-yl-blue transition-colors">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-dark-text-muted">
                        <span>{doc.type.toUpperCase()}</span>
                        {doc.pageCount > 0 && (
                          <span>
                            {doc.pageCount} {t("doc.pages")}
                          </span>
                        )}
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 dark:text-dark-text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-border py-12">
                <Image
                  src="/images/empty-docs.png"
                  alt={t("space.no_docs")}
                  width={160}
                  height={160}
                  className="rounded-xl opacity-80"
                />
                <p className="mt-2 text-sm text-gray-400 dark:text-dark-text-muted">
                  {t("space.no_docs_desc")}
                </p>
                <button
                  onClick={handleUploadToSpace}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text dark:text-dark-text"
                >
                  <Plus className="h-3 w-3" />
                  {t("space.add_doc")}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SpacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" />
        </div>
      }
    >
      <SpacePageInner />
    </Suspense>
  );
}