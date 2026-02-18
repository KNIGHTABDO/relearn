"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  AudioLines,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  documentId?: string;
  className?: string;
}

export function ChatPanel({ documentId, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          documentId,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: fullText } : m
            )
          );
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: "Sorry, I encountered an error. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Sparkles className="h-6 w-6 text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">
              Ask anything about your document
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try: "Summarize this", "Explain the main concepts", or "Create flashcards"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-black px-4 py-2.5 text-sm text-white">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Sparkles className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-sm max-w-none text-gray-700 [&_strong]:text-gray-900 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                          {msg.content ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {msg.content}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" />
                              <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.1s]" />
                              <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]" />
                            </div>
                          )}
                        </div>
                        {msg.content && !isStreaming && (
                          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => copyMessage(msg.id, msg.content)}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100"
                            >
                              {copied === msg.id ? (
                                <Check className="h-3 w-3 text-yl-green" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-400" />
                              )}
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

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 transition-all focus-within:border-gray-300 focus-within:shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about your document..."
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
          />
          {input.trim() ? (
            <button
              onClick={sendMessage}
              disabled={isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-800">
              <AudioLines className="h-3 w-3" />
              <span>Voice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
