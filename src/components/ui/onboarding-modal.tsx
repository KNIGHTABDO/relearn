"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Link2,
  Mic,
  MessageSquare,
  BookOpen,
  ClipboardList,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

const ONBOARDING_KEY = "relearn-onboarding-done";

interface OnboardingModalProps {
  hasSpaces: boolean;
}

export function OnboardingModal({ hasSpaces }: OnboardingModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    // Show onboarding only if never seen AND user has no spaces (truly first launch)
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done && !hasSpaces) {
        // Small delay so the home page can render first
        const timer = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn("[Onboarding] localStorage unavailable:", e);
    }
  }, [hasSpaces]);

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch (e) {
      console.warn("[Onboarding] Could not save state:", e);
    }
    setOpen(false);
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const steps = [
    {
      icon: Sparkles,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
      title: t("onboarding.step1_title"),
      subtitle: t("onboarding.step1_subtitle"),
      content: (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: Upload, label: t("onboarding.method_upload"), desc: t("onboarding.method_upload_desc"), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { icon: Link2, label: t("onboarding.method_paste"), desc: t("onboarding.method_paste_desc"), color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" },
            { icon: Mic, label: t("onboarding.method_record"), desc: t("onboarding.method_record_desc"), color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1.5">
              <div className={cn("rounded-xl p-3", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-dark-text">{label}</p>
              <p className="text-[10px] text-gray-400 dark:text-dark-text-muted leading-tight">{desc}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: BookOpen,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      title: t("onboarding.step2_title"),
      subtitle: t("onboarding.step2_subtitle"),
      content: (
        <div className="flex flex-col gap-3 mt-4">
          {[
            { icon: MessageSquare, label: t("onboarding.tool_chat"), desc: t("onboarding.tool_chat_desc"), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { icon: BookOpen, label: t("onboarding.tool_flashcards"), desc: t("onboarding.tool_flashcards_desc"), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { icon: ClipboardList, label: t("onboarding.tool_quiz"), desc: t("onboarding.tool_quiz_desc"), color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-dark-border">
              <div className={cn("rounded-lg p-2 shrink-0", bg)}>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-dark-text">{label}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Sparkles,
      iconColor: "text-green-500",
      iconBg: "bg-green-50 dark:bg-green-900/20",
      title: t("onboarding.step3_title"),
      subtitle: t("onboarding.step3_subtitle"),
      content: (
        <div className="mt-4 rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
          {[
            { key: t("onboarding.tip_shortcut"), value: "⌘K" },
            { key: t("onboarding.tip_spaces"), value: t("onboarding.tip_spaces_value") },
            { key: t("onboarding.tip_ai"), value: t("onboarding.tip_ai_value") },
          ].map(({ key, value }, i) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between px-4 py-3 text-sm",
                i > 0 && "border-t border-gray-50 dark:border-dark-border"
              )}
            >
              <span className="text-gray-600 dark:text-dark-text-muted">{key}</span>
              <span className="font-medium text-gray-900 dark:text-dark-text">{value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
        {/* Header */}
        <div className="relative flex flex-col items-center text-center px-6 pt-8 pb-4">
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className={cn("rounded-2xl p-4 mb-3", currentStep.iconBg)}>
            <StepIcon className={cn("h-7 w-7", currentStep.iconColor)} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
            {currentStep.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Step content */}
        <div className="px-6 pb-2">{currentStep.content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 mt-2">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all",
                  i === step
                    ? "w-4 h-2 bg-purple-500"
                    : "w-2 h-2 bg-gray-200 dark:bg-dark-border"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 && (
              <button
                onClick={dismiss}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors px-2 py-1.5"
              >
                {t("onboarding.skip")}
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              {step === steps.length - 1
                ? t("onboarding.get_started")
                : t("onboarding.next")}
              {step < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
