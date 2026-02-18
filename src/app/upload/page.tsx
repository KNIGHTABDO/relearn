"use client";

import React, { useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function UploadPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  }, []);

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
            Drop a PDF, audio, or video file to start learning
          </p>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
              isDragging
                ? "border-gray-400 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700">
              Drag and drop your file here
            </p>
            <p className="mt-1 text-xs text-gray-400">
              or click to browse
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setUploadedFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Uploaded file preview */}
          {uploadedFile && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-200"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Start learning button */}
          {uploadedFile && (
            <button className="mt-4 w-full btn-pill-primary py-3 text-sm">
              Start Learning
            </button>
          )}

          {/* Supported formats */}
          <p className="mt-6 text-center text-[11px] text-gray-300">
            Supports PDF, DOCX, TXT, MP3, MP4, WAV
          </p>
        </div>
      </main>
    </div>
  );
}
