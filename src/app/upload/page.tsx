"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { useDatabaseContext } from "@/components/providers/database-provider";
import { uploadFileAction } from "@/lib/data-layer";

type UploadStatus = "idle" | "uploading" | "done" | "error";

interface UploadedFile {
  file: File;
  status: UploadStatus;
  progress: number;
  id?: string;
}

function UploadPageInner() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready: dbReady, isDesktop } = useDatabaseContext();
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("spaceId");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      const newFiles: UploadedFile[] = acceptedFiles.map((f) => ({
        file: f,
        status: "uploading" as UploadStatus,
        progress: 0,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        if (spaceId) formData.append("space_id", spaceId);

        const interval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === file && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 200);

        try {
          let result: { id: string } | null = null;
          if (isDesktop) {
            result = await uploadFileAction(file, spaceId || undefined);
          } else {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            result = await res.json();
          }
          clearInterval(interval);
          if (!result) throw new Error("Upload failed");
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, status: "done", progress: 100, id: result!.id }
                : f
            )
          );
        } catch {
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, status: "error", progress: 0 } : f
            )
          );
        }
      }
    },
    [spaceId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxSize: 50 * 1024 * 1024,
    onDropRejected: () => setError(t("upload.unsupported_file")),
  });

  const removeFile = (file: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const completed = uploadedFiles.filter((f) => f.status === "done");

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-dark-bg dark:bg-dark-bg">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-dark-text">
            {t("upload.title")}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-dark-text-muted">
            {spaceId
              ? t("upload.adding_files_to_space")
              : t("upload.drop_files_to_start_learning")}
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div
            {...getRootProps()}
            className={cn(
              "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all",
              isDragActive
                ? "border-gray-400 bg-gray-50 dark:bg-dark-surface scale-[1.02]"
                : "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:border-gray-300 dark:border-dark-border"
            )}
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl",
                isDragActive
                  ? "bg-gray-200 dark:bg-dark-border"
                  : "bg-gray-50 dark:bg-dark-surface dark:bg-dark-surface"
              )}
            >
              <Upload
                className={cn(
                  "h-6 w-6",
                  isDragActive
                    ? "text-gray-600 dark:text-dark-text-secondary"
                    : "text-gray-400 dark:text-dark-text-muted"
                )}
              />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              {isDragActive ? t("upload.drop_here") : t("upload.drag_and_drop_files")}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-dark-text-muted">
              {t("upload.or_click_to_browse")} • {t("upload.supported_formats")}
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface p-3 animate-fade-in"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-dark-bg dark:bg-dark-bg">
                    {item.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-yl-green" />
                    ) : item.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-yl-pink" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400 dark:text-dark-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-dark-text">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                        {(item.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {item.status === "uploading" && (
                        <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {item.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 dark:text-dark-text-muted" />
                  ) : (
                    <button
                      onClick={() => removeFile(item.file)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-dark-hover dark:bg-dark-border"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400 dark:text-dark-text-muted" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <button
              onClick={() => {
                if (spaceId) {
                  router.push(`/space/${spaceId}`);
                } else {
                  router.push(`/learn?id=${completed[0].id}`);
                }
              }}
              className="mt-4 w-full btn-pill-primary py-3 text-sm"
            >
              {spaceId ? t("upload.back_to_space") : t("upload.start_learning")}
            </button>
          )}

          <p className="mt-6 text-center text-[11px] text-gray-300 dark:text-dark-text-muted">
            {t("upload.file_types")} • {t("upload.max_size")}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" />
        </div>
      }
    >
      <UploadPageInner />
    </Suspense>
  );
}
