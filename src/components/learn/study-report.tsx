"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Printer,
  RefreshCw,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";


type ReportSection = {
  id: string;
  title: string;
  keyConcepts: { term: string; definition: string; source?: string }[];
  formulas: { content: string; source?: string }[];
  tips: { tip: string; source?: string }[];
  practice: {
    question: string;
    answer: string;
    source?: string;
  }[];
  summary: string;
  sources?: string[];
};

type ReportData = {
  title: string;
  date: string;
  docCount: number;
  sections: ReportSection[];
};

type GenerationState = "idle" | "loading" | "generated";

export default function StudyReport() {
  const [state, setState] = useState<GenerationState>("idle");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  const loadingSteps = [
    "Analyzing materials...",
    "Structuring content...",
    "Generating report...",
  ];

  // -------------------------------------------------------------------------
  // Mock data (used when no auth token is present)
  // -------------------------------------------------------------------------
  const getMockReport = (): ReportData => ({
    title: "Comprehensive Study Guide",
    date: new Date().toLocaleDateString(),
    docCount: 3,
    sections: [
      {
        id: "section-1",
        title: "Fundamentals of Physics",
        keyConcepts: [
          {
            term: "Force",
            definition:
              "An interaction that, when unopposed, will change the motion of an object.",
            source: "Physics Textbook",
          },
          {
            term: "Energy",
            definition:
              "The capacity to do work. It exists in many forms such as kinetic, potential, thermal, etc.",
            source: "Physics Textbook",
          },
        ],
        formulas: [
          {
            content: "F = m × a",
            source: "Physics Textbook",
          },
          {
            content: "E = m c²",
            source: "Relativity Lecture",
          },
        ],
        tips: [
          {
            tip: "Always keep track of units when solving problems.",
            source: "Instructor Notes",
          },
          {
            tip: "Draw free‑body diagrams to visualize forces.",
            source: "Instructor Notes",
          },
        ],
        practice: [
          {
            question: "What is the net force on a 5 kg object accelerating at 2 m/s²?",
            answer: "F = m × a = 5 kg × 2 m/s² = 10 N.",
            source: "Homework Set 1",
          },
          {
            question: "Explain why energy is conserved in an isolated system.",
            answer:
              "In an isolated system no external work is done, so the total energy remains constant according to the first law of thermodynamics.",
            source: "Lecture Slides",
          },
        ],
        summary:
          "This section covered the core concepts of force and energy, providing essential formulas and practical tips for problem solving. Mastery of these fundamentals is crucial for tackling more advanced topics in mechanics.",
      },
      {
        id: "section-2",
        title: "Chemistry Basics",
        keyConcepts: [
          {
            term: "Mole",
            definition:
              "The amount of substance containing as many elementary entities as atoms in 12 g of carbon‑12.",
            source: "Chemistry Textbook",
          },
        ],
        formulas: [
          {
            content: "n = m / M",
            source: "Chemistry Textbook",
          },
        ],
        tips: [
          {
            tip: "Use dimensional analysis to avoid calculation errors.",
            source: "Study Guide",
          },
        ],
        practice: [
          {
            question: "Calculate the number of moles in 18 g of water (H₂O).",
            answer:
              "Molar mass of H₂O = 18 g/mol, so n = 18 g / 18 g/mol = 1 mol.",
            source: "Lab Manual",
          },
        ],
        summary:
          "Understanding the mole concept and related calculations lays the groundwork for stoichiometry and chemical reactions.",
      },
    ],
  });

  // -------------------------------------------------------------------------
  // API call (fallback to mock when token missing)
  // -------------------------------------------------------------------------
  const fetchReport = async () => {
    setState("loading");
    setLoadingStep(0);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "report" }),
      });

      if (!res.ok) throw new Error("Network error");
      const data: ReportData = await res.json();
      setReport(data);
      setState("generated");
    } catch {
      // use mock data
      const mock = getMockReport();
      setReport(mock);
      setState("generated");
    }
  };

  // -------------------------------------------------------------------------
  // Loading animation progress
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (state !== "loading") return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [state]);

  // -------------------------------------------------------------------------
  // Toolbar actions
  // -------------------------------------------------------------------------
  const copyAll = async () => {
    if (!report) return;
    const text = JSON.stringify(report, null, 2);
    await navigator.clipboard.writeText(text);
  };

  const printReport = () => {
    window.print();
  };

  const regenerate = () => {
    setReport(null);
    setState("idle");
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const wordCount = useCallback(() => {
    if (!report) return 0;
    const text = report.sections
      .map((s) => [
        s.title,
        s.keyConcepts.map((c) => `${c.term} ${c.definition}`).join(" "),
        s.formulas.map((f) => f.content).join(" "),
        s.tips.map((t) => t.tip).join(" "),
        s.practice.map((p) => `${p.question} ${p.answer}`).join(" "),
        s.summary,
      ].join(" "))
      .join(" ");
    return text.split(/\s+/).filter(Boolean).length;
  }, [report]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const renderSkeleton = () => (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-3/4 dark:bg-gray-700" />
      <div className="h-6 bg-gray-300 rounded w-1/2 dark:bg-gray-700" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-300 rounded w-full dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );

  const renderReport = () => {
    if (!report) return null;
    return (
      <div className="prose dark:prose-invert max-w-none mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold">{report.title}</h1>
          </div>
          <div className="text-sm text-gray-500">
            {report.date} • {report.docCount} document
            {report.docCount > 1 ? "s" : ""}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={copyAll}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200",
              "dark:bg-gray-800 dark:hover:bg-gray-700"
            )}
          >
            <Copy className="w-4 h-4" />
            Copy All
          </button>
          <button
            onClick={printReport}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200",
              "dark:bg-gray-800 dark:hover:bg-gray-700"
            )}
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={regenerate}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200",
              "dark:bg-gray-800 dark:hover:bg-gray-700"
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            Word count: {wordCount()}
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Table of Contents
          </h2>
          <ul className="list-disc list-inside space-y-1">
            {report.sections.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        {report.sections.map((sec) => (
          <section
            key={sec.id}
            id={sec.id}
            className="mb-12 last:mb-0 border-b pb-8 last:border-0"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <ChevronDown className="w-5 h-5 mr-2" />
              {sec.title}
            </h2>

            {/* Key Concepts */}
            {sec.keyConcepts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border-l-4 border-purple-600">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  Key Concepts
                </h3>
                <ol className="list-decimal list-inside space-y-2">
                  {sec.keyConcepts.map((c, i) => (
                    <li key={i}>
                      <span className="font-bold">{c.term}:</span> {c.definition}{" "}
                      {c.source && renderWithSources([c.source])}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Formulas / Facts */}
            {sec.formulas.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  Important Formulas / Facts
                </h3>
                {sec.formulas.map((f, i) => (
                  <div
                    key={i}
                    className="bg-amber-50 dark:bg-amber-900 border-l-4 border-amber-400 rounded-r-xl p-3"
                  >
                    <p className="font-mono">{f.content}</p>
                    {f.source && renderWithSources([f.source])}
                  </div>
                ))}
              </div>
            )}

            {/* Study Tips */}
            {sec.tips.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <Lightbulb className="w-4 h-4 mr-1" />
                  Study Tips
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {sec.tips.map((t, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-600 flex-shrink-0" />
                      <span>
                        {t.tip} {t.source && renderWithSources([t.source])}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practice Questions */}
            {sec.practice.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Practice Questions
                </h3>
                <ol className="list-decimal list-inside space-y-3">
                  {sec.practice.map((p, i) => {
                    const qId = `${sec.id}-q-${i}`;
                    const isOpen = expandedQuestions.has(qId);
                    return (
                      <li key={i}>
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleQuestion(qId)}>
                          <span className="font-medium">{p.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                        {isOpen && (
                          <div className="mt-2 pl-4 border-l border-gray-300 dark:border-gray-600">
                            <p className="text-gray-800 dark:text-gray-200">{p.answer}</p>
                            {p.source && renderWithSources([p.source])}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Summary */}
            {sec.summary && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  Summary
                </h3>
                <p>{sec.summary}</p>
              </div>
            )}
          </section>
        ))}
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {state === "idle" && (
          <div className="text-center py-12">
            <button
              onClick={fetchReport}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700",
                "dark:bg-indigo-500 dark:hover:bg-indigo-600"
              )}
            >
              <FileText className="w-5 h-5" />
              <Sparkles className="w-5 h-5" />
              Generate Study Report
            </button>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Create a comprehensive study guide from your materials
            </p>
          </div>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {loadingSteps[loadingStep]}
            </p>
            <div className="mt-6 w-full max-w-md">{renderSkeleton()}</div>
          </div>
        )}

        {state === "generated" && renderReport()}
      </div>
    </div>
  );
}