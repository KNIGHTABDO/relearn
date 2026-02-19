"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, AudioLines, Sparkles, Copy, Check, Plus, FileText, X, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureCopilotToken, isAuthenticated, getSelectedModel } from "@/lib/github-auth";
import { ensureGoogleToken, isGoogleAuthenticated, getSelectedGeminiModel, hasGeminiApiKey } from "@/lib/google-auth";
import { useI18n } from "@/components/providers/i18n-provider";
import { chatStream } from "@/lib/ai-service";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  documentId?: string;
  spaceId?: string;
  className?: string;
}

export function ChatPanel({ documentId, spaceId, className }: ChatPanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAddContext, setShowAddContext] = useState(false);
  const [addedContexts, setAddedContexts] = useState<string[]>([]);
  const [usingAI, setUsingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableDocs = [
    { id: "doc-genetics", title: "The Genetic Code & Translation" },
    { id: "doc-cell", title: "Cell Division & Mitosis" },
    { id: "doc-algo", title: "Algorithms & Data Structures" },
    { id: "doc-memory", title: "Human Memory Systems" },
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setUsingAI((isGoogleAuthenticated() || isAuthenticated()));
    const handler = () => setUsingAI((isGoogleAuthenticated() || isAuthenticated()));
    window.addEventListener("github-auth-changed", handler);
    return () => window.removeEventListener("github-auth-changed", handler);
  }, []);

  
  // Listen for PDF text selection actions
  useEffect(() => {
    const handleSelectionAction = (e: Event) => {
      const { action, text } = (e as CustomEvent).detail;
      const truncated = text.length > 500 ? text.slice(0, 500) + "..." : text;

      const prompts: Record<string, string> = {
        explain: "Explain this passage in simple terms:\n\n\"" + truncated + "\"",
        chat: truncated,
        quiz: "Generate 3 quiz questions based on this text:\n\n\"" + truncated + "\"",
        flashcards: "Create flashcards from this text:\n\n\"" + truncated + "\"",
        summarize: "Summarize this passage concisely:\n\n\"" + truncated + "\"",
      };

      const prompt = prompts[action];
      if (prompt) {
        setInput(prompt);
        // Auto-focus the input
        setTimeout(() => inputRef.current?.focus(), 100);
        // For explain and summarize, auto-send
        if (action === "explain" || action === "summarize") {
          setTimeout(() => {
            setInput(prompt);
            // Trigger send by dispatching enter key event... 
            // Actually, just call sendMessage directly after setting input
          }, 150);
        }
      }

      // Handle read aloud separately
      if (action === "read_aloud" && typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }

      // Handle add to notes - dispatch another event
      if (action === "add_notes") {
        window.dispatchEvent(new CustomEvent("add-to-notes", { detail: { text } }));
      }
    };

    window.addEventListener("pdf-selection-action", handleSelectionAction);
    return () => window.removeEventListener("pdf-selection-action", handleSelectionAction);
  }, []);

const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
    setMessages((p) => [...p, userMsg, aiMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      // Try direct AI call first (Tauri desktop mode)
      try {
        const allMsgs = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        await chatStream(allMsgs, documentId, spaceId, (text) => {
          setMessages((p) => p.map((m) => m.id === aiMsg.id ? { ...m, content: text } : m));
        });
      } catch (aiErr: any) {
        if (aiErr?.message === "NO_AI_PROVIDER") {
          setMessages((p) => p.map((m) => m.id === aiMsg.id ? { ...m, content: "Please connect an AI provider (Google or GitHub) in Settings to use chat." } : m));
        } else if (aiErr?.message !== "NOT_TAURI") {
          throw aiErr;
        }
      }
    } catch {
      setMessages((p) => p.map((m) => m.id === aiMsg.id ? { ...m, content: "Sorry, something went wrong. Check your connection." } : m));
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const toggleContext = (docId: string) => {
    setAddedContexts((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* AI status indicator */}
      {usingAI && (
        <div className="flex items-center gap-1.5 border-b border-gray-50 px-4 py-1.5 bg-gray-50/50">
          <Zap className="h-3 w-3 text-yl-gold" />
          <span className="text-[10px] text-gray-500 dark:text-dark-text-muted">
            {t("common.ai_label")} <span className="font-medium text-gray-700 dark:text-dark-text-secondary">{isGoogleAuthenticated() || hasGeminiApiKey() ? getSelectedGeminiModel() : getSelectedModel()}</span>
          </span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-dark-surface dark:bg-dark-surface">
              <Sparkles className="h-6 w-6 text-gray-300 dark:text-dark-text-muted" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-dark-text-muted">
              {spaceId ? t("chat.empty_all_documents") : t("chat.empty_anything_document")}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-dark-text-muted">
              {usingAI
                ? t("chat.powered_by_copilot")
                : t("chat.connect_github_settings")
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-black px-4 py-2.5 text-sm text-white">{msg.content}</div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border">
                        <Sparkles className="h-3 w-3 text-gray-500 dark:text-dark-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {msg.content ? (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-dark-text-secondary">{msg.content}</div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" />
                            <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.1s]" />
                            <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]" />
                          </div>
                        )}
                        {msg.content && !isStreaming && (
                          <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(msg.id); setTimeout(() => setCopied(null), 2000); }}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-dark-hover dark:bg-dark-card"
                            >
                              {copied === msg.id ? <Check className="h-3 w-3 text-yl-green" /> : <Copy className="h-3 w-3 text-gray-400 dark:text-dark-text-muted" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Added contexts indicator */}
      {addedContexts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-50 px-4 py-2">
          <span className="text-[10px] text-gray-400 dark:text-dark-text-muted uppercase tracking-wider">{t("common.context")}</span>
          {addedContexts.map((id) => {
            const doc = availableDocs.find((d) => d.id === id);
            return (
              <span key={id} className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-dark-card px-2 py-0.5 text-[10px] text-gray-600 dark:text-dark-text-secondary">
                {doc?.title.substring(0, 20)}...
                <button onClick={() => toggleContext(id)}>
                  <X className="h-2.5 w-2.5 text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary dark:text-dark-text-secondary" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Add Context panel */}
      {showAddContext && (
        <div className="border-t border-gray-100 dark:border-dark-border px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">{t("common.add_files_to_context")}</span>
            <button onClick={() => setShowAddContext(false)} className="text-xs text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary dark:text-dark-text-secondary">{t("common.done")}</button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {availableDocs.filter((d) => d.id !== documentId).map((doc) => (
              <button
                key={doc.id}
                onClick={() => toggleContext(doc.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-left transition-colors",
                  addedContexts.includes(doc.id) ? "bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-dark-text" : "text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
                )}
              >
                <FileText className="h-3.5 w-3.5 text-gray-400 dark:text-dark-text-muted shrink-0" />
                <span className="truncate flex-1">{doc.title}</span>
                {addedContexts.includes(doc.id) && <Check className="h-3 w-3 text-yl-green" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-dark-border p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddContext(!showAddContext)}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
              showAddContext ? "border-gray-300 dark:border-dark-border bg-gray-100 dark:bg-dark-border" : "border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover dark:bg-dark-surface dark:bg-dark-surface"
            )}
            title={t("common.add_context")}
          >
            <Plus className="h-3.5 w-3.5 text-gray-500 dark:text-dark-text-muted" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-2.5 focus-within:border-gray-300 dark:focus-within:border-dark-border dark:border-dark-border focus-within:shadow-sm dark:focus-within:shadow-none">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={spaceId ? t("chat.placeholder_space") : t("chat.placeholder_document")}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted dark:text-dark-text-muted outline-none disabled:opacity-50"
            />
            {input.trim() ? (
              <button onClick={sendMessage} disabled={isStreaming} className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white hover:bg-gray-800">
                <AudioLines className="h-3 w-3" />
                <span>{t("common.voice")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
