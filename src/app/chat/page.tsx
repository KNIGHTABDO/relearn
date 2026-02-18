"use client";

import React from "react";
import { AppShell } from "@/components/layout";

export default function ChatPage() {
  return (
    <AppShell>
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">AI Tutor Chat</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Coming in Step 4
          </p>
        </div>
      </div>
    </AppShell>
  );
}
