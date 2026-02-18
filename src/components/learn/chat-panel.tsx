"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, AudioLines, Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
    setMessages((p) => [...p, userMsg, aiMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          documentId,
          spaceId,
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setMessages((p) => p.map((m) => m.id === aiMsg.id ? { ...m, content: text } : m));
        }
      }
    } catch {
      setMessages((p) => p.map((m) => m.id === aiMsg.id ? { ...m, content: "Sorry, something went wrong." } : m));
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Sparkles className="h-6 w-6 text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">
              {spaceId ? "Ask about all documents in this space" : "Ask anything about your document"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try: "Summarize this", "Create flashcards", or "Explain the main ideas"
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
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Sparkles className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {msg.content ? (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{msg.content}</div>
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
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100"
                            >
                              {copied === msg.id ? <Check className="h-3 w-3 text-yl-green" /> : <Copy className="h-3 w-3 text-gray-400" />}
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
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 focus-within:border-gray-300 focus-within:shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={spaceId ? "Ask about this space..." : "Ask about your document..."}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
          />
          {input.trim() ? (
            <button onClick={sendMessage} disabled={isStreaming} className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white hover:bg-gray-800">
              <AudioLines className="h-3 w-3" />
              <span>Voice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
