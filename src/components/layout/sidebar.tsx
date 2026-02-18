"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Upload,
  MessageSquare,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  FileText,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainNav = [
  {
    title: "Dashboard",
    icon: BookOpen,
    href: "/",
  },
  {
    title: "Upload",
    icon: Upload,
    href: "/upload",
  },
  {
    title: "AI Tutor",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    title: "Study Tools",
    icon: BrainCircuit,
    href: "/study",
  },
];

const recentDocs = [
  { title: "Anatomy Chapter 12", icon: FileText },
  { title: "Physiology Notes", icon: FileText },
  { title: "Cell Biology PDF", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <span className="text-lg font-semibold tracking-tight">
                ReLearn
              </span>
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                AI
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* New Upload Button */}
        <div className="px-3 py-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="w-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Upload</TooltipContent>
            </Tooltip>
          ) : (
            <Button className="w-full justify-start gap-2" size="sm">
              <Plus className="h-4 w-4" />
              New Upload
            </Button>
          )}
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              const navItem = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              }

              return navItem;
            })}
          </div>

          {/* Recent Documents */}
          {!collapsed && (
            <div className="mt-6 animate-fade-in">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              <div className="space-y-1">
                {recentDocs.map((doc) => (
                  <button
                    key={doc.title}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <doc.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{doc.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Bottom Section */}
        <div className="p-3">
          {/* Upgrade Card - YouLearn style */}
          {!collapsed && (
            <div className="mb-3 rounded-lg border border-border/50 bg-gradient-to-br from-muted/50 to-muted p-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium">Upgrade to Pro</p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Unlimited uploads & advanced AI features
              </p>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent">
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}
