"use client";

import React from "react";
import { AppShell } from "@/components/layout";
import {
  Upload,
  FileText,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Clock,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    label: "Documents",
    value: "0",
    icon: FileText,
    description: "Uploaded materials",
  },
  {
    label: "AI Sessions",
    value: "0",
    icon: MessageSquare,
    description: "Tutor conversations",
  },
  {
    label: "Flashcards",
    value: "0",
    icon: BrainCircuit,
    description: "Cards generated",
  },
  {
    label: "Study Hours",
    value: "0",
    icon: Clock,
    description: "Time learning",
  },
];

const quickActions = [
  {
    title: "Upload Material",
    description: "Drop a PDF, paste text, or add a YouTube link",
    icon: Upload,
    href: "/upload",
    primary: true,
  },
  {
    title: "AI Tutor Chat",
    description: "Ask questions about your documents",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    title: "Study Flashcards",
    description: "Review auto-generated flashcards",
    icon: BrainCircuit,
    href: "/study",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your study materials and let AI transform them into
            interactive learning tools.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-lg border border-border/50 bg-card p-4 transition-colors hover:border-border"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {stat.value}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`group relative flex flex-col rounded-lg border p-5 transition-all hover:shadow-sm ${
                  action.primary
                    ? "border-primary/20 bg-primary/5 hover:border-primary/40"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <action.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{action.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Empty State - Get Started */}
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            Get started with ReLearn
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Upload your first study material to unlock AI-powered summaries,
            an interactive tutor, and smart flashcards.
          </p>
          <Button className="mt-6 gap-2" asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              Upload Your First Document
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
