"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  File,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

interface UploadedFile {
  file: File;
  status: UploadStatus;
  progress: number;
  id?: string;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

export default function UploadPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      status: "uploading" as UploadStatus,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Process each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file === file && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 200);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, status: "done", progress: 100, id: data.id }
              : f
          )
        );
      } catch (err) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, status: "error", progress: 0 } : f
          )
        );
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDropRejected: () => {
      setError("File type not supported. Please upload PDF, TXT, DOC, or DOCX files.");
    },
  });

  const removeFile = (file: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const completedFiles = uploadedFiles.filter((f) => f.status === "done");

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Upload your material
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Drop a PDF, document, or text file to start learning
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={cn(
              "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all",
              isDragActive
                ? "border-gray-400 bg-gray-50 scale-[1.02]"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            )}
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                isDragActive ? "bg-gray-200" : "bg-gray-50"
              )}
            >
              <Upload
                className={cn(
                  "h-6 w-6 transition-colors",
                  isDragActive ? "text-gray-600" : "text-gray-400"
                )}
              />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700">
              {isDragActive
                ? "Drop your files here"
                : "Drag and drop your files here"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              or click to browse • PDF, DOC, DOCX, TXT up to 50MB
            </p>
          </div>

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 animate-fade-in"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                    {item.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-yl-green" />
                    ) : item.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-yl-pink" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">
                        {(item.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {item.status === "uploading" && (
                        <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === "error" && (
                        <span className="text-xs text-yl-pink">Failed</span>
                      )}
                    </div>
                  </div>
                  {item.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <button
                      onClick={() => removeFile(item.file)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-200"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Start learning button */}
          {completedFiles.length > 0 && (
            <button
              onClick={() => router.push(`/learn?id=${completedFiles[0].id}`)}
              className="mt-4 w-full btn-pill-primary py-3 text-sm"
            >
              Start Learning
            </button>
          )}

          {/* Supported formats */}
          <p className="mt-6 text-center text-[11px] text-gray-300">
            Supports PDF, DOCX, DOC, TXT • Max 50MB per file
          </p>
        </div>
      </main>
    </div>
  );
}
