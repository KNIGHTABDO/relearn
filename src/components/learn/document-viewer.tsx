"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  MoreVertical,
  ChevronsUpDown,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  title?: string;
  totalPages?: number;
  className?: string;
}

export function DocumentViewer({
  title = "Document",
  totalPages = 19,
  className,
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      {/* Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-gray-100 px-4">
        {/* Listen */}
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Play className="h-3 w-3" />
          <span>Listen</span>
        </button>

        {/* Page controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
          </button>

          <div className="flex items-center gap-1 text-xs">
            <input
              type="text"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="h-7 w-8 rounded border border-gray-200 text-center text-xs font-medium outline-none focus:border-gray-400"
            />
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{totalPages}</span>
          </div>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50"
          >
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-200" />

          {/* Zoom / Page Fit */}
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50">
            <span>Page fit</span>
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        </div>

        {/* More */}
        <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50">
          <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>

      {/* Document Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm">
          {/* Sample document content - placeholder */}
          <div className="space-y-6">
            <div>
              <p className="text-7xl font-bold text-teal-600">11</p>
              <div className="mt-2 h-1 w-16 bg-orange-400 rounded-full" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">
              {title}
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-gray-700 font-serif">
              <p>
                The genetic code is the set of rules by which information
                encoded within genetic material (DNA or RNA sequences) is
                translated into proteins by living cells. Translation is
                accomplished by the ribosome, which links proteinogenic amino
                acids in an order specified by messenger RNA (mRNA).
              </p>
              <p>
                The genetic code is highly similar among all organisms and can
                be expressed in a simple table with 64 entries. The code defines
                how codons — sequences of three nucleotides — specify which
                amino acid will be added next during protein synthesis.
              </p>
              <p className="font-sans text-xs text-gray-400 border-t border-gray-100 pt-4 mt-6 flex justify-between">
                <span>Chapter 11</span>
                <span>The Genetic Code & Translation</span>
                <span>{currentPage}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
