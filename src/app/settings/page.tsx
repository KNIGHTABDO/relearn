"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import {
  User,
  Globe,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  ChevronRight,
  Moon,
  Monitor,
} from "lucide-react";

const settingsSections = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", description: "Name, email, avatar" },
      { icon: Globe, label: "Language", description: "English (US)" },
      { icon: Bell, label: "Notifications", description: "Email and push notifications" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Palette, label: "Appearance", description: "Light mode" },
      { icon: Monitor, label: "Display", description: "Font size, reading preferences" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "FAQs and guides" },
      { icon: Shield, label: "Privacy & Terms", description: "Privacy policy, terms of service" },
    ],
  },
];

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header title="Settings" onMenuClick={() => setSidebarOpen(true)} />
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-8">
          {/* Profile card */}
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
              A
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Student</h2>
              <p className="text-sm text-gray-500">Free Plan</p>
            </div>
          </div>

          {/* Settings sections */}
          {settingsSections.map((section) => (
            <div key={section.title} className="mt-8">
              <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                      <item.icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
