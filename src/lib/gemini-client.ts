// Direct Gemini/Copilot API client for Tauri desktop mode
// In Tauri, there are no API routes — we call the AI APIs directly from the browser

import { isTauri } from "./tauri-auth";
import { ensureGoogleToken, getSelectedGeminiModel, getGeminiApiKey } from "./google-auth";
import { ensureCopilotToken, getSelectedModel } from "./github-auth";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call AI directly from the client (Tauri desktop mode).
 * Tries Google first, then Copilot.
 * Returns null if not in Tauri mode — caller should use API routes instead.
 */

// Get AI language instruction based on user's selected language
function getLanguageInstruction(): string {
  if (typeof window === "undefined") return "";
  const lang = localStorage.getItem("relearn-language") || "en";
  if (lang === "en") return "";
  const names: Record<string, string> = {
    es: "Spanish", fr: "French", ar: "Arabic", de: "German",
    zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese", hi: "Hindi",
  };
  const name = names[lang];
  if (!name) return "";
  return "\nIMPORTANT: Respond entirely in " + name + ". All explanations, quiz questions, flashcards, summaries, and chat responses must be in " + name + ".";
}

export async function callAIDirect(
  messages: Message[],
  options: { temperature?: number; maxTokens?: number; stream?: false }
): Promise<string | null> {
  if (!isTauri()) return null;

  // Try Google first — prefer API key, fall back to OAuth token
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    return callGeminiDirect(apiKey, getSelectedGeminiModel(), messages, options, true);
  }
  const googleToken = await ensureGoogleToken();
  if (googleToken) {
    return callGeminiDirect(googleToken, getSelectedGeminiModel(), messages, options, false);
  }

  // Then Copilot
  const copilotToken = await ensureCopilotToken();
  if (copilotToken) {
    return callCopilotDirect(copilotToken, getSelectedModel(), messages, options);
  }

  console.error("[ReLearn] No AI provider available. Connect Google or GitHub in Settings.");
  return null;
}

/**
 * Stream AI response directly (Tauri desktop mode).
 * Returns a ReadableStream of text chunks, or null if not in Tauri.
 */
export async function streamAIDirect(
  messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<string> | null> {
  if (!isTauri()) return null;

  const apiKey = getGeminiApiKey();
  if (apiKey) {
    return streamGeminiDirect(apiKey, getSelectedGeminiModel(), messages, options, true);
  }
  const googleToken = await ensureGoogleToken();
  if (googleToken) {
    return streamGeminiDirect(googleToken, getSelectedGeminiModel(), messages, options, false);
  }

  const copilotToken = await ensureCopilotToken();
  if (copilotToken) {
    return streamCopilotDirect(copilotToken, getSelectedModel(), messages, options);
  }

  console.error("[ReLearn] No AI provider available. Connect Google or GitHub in Settings.");
  return null;
}

// =========================
// Gemini Direct
// =========================

async function callGeminiDirect(
  token: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number },
  isApiKey: boolean = false
): Promise<string> {
  const system = messages.filter(m => m.role === "system");
  const nonSystem = messages.filter(m => m.role !== "system");

  const body: any = {
    contents: nonSystem.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  };
  if (system.length > 0) {
    body.systemInstruction = { parts: [{ text: (system.map(m => m.content).join("\n\n") + getLanguageInstruction()) }] };
  }
  if (body.contents.length === 0) {
    body.contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  const url = isApiKey
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isApiKey) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function streamGeminiDirect(
  token: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number },
  isApiKey: boolean = false
): Promise<ReadableStream<string>> {
  const system = messages.filter(m => m.role === "system");
  const nonSystem = messages.filter(m => m.role !== "system");

  const body: any = {
    contents: nonSystem.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  };
  if (system.length > 0) {
    body.systemInstruction = { parts: [{ text: (system.map(m => m.content).join("\n\n") + getLanguageInstruction()) }] };
  }
  if (body.contents.length === 0) {
    body.contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
  const url = isApiKey ? `${baseUrl}&key=${token}` : baseUrl;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isApiKey) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini stream error: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") { controller.close(); return; }
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) controller.enqueue(text);
          } catch {}
        }
      }
    },
  });
}

// =========================
// Copilot Direct
// =========================

async function callCopilotDirect(
  token: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch("https://api.githubcopilot.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Copilot-Integration-Id": "vscode-chat",
      "Editor-Version": "vscode/1.99.0",
      "Editor-Plugin-Version": "copilot-chat/0.26.0",
      "Openai-Intent": "conversation-panel",
    },
    body: JSON.stringify({
      model, stream: false,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) throw new Error(`Copilot error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function streamCopilotDirect(
  token: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<string>> {
  const res = await fetch("https://api.githubcopilot.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "Copilot-Integration-Id": "vscode-chat",
      "Editor-Version": "vscode/1.99.0",
      "Editor-Plugin-Version": "copilot-chat/0.26.0",
      "Openai-Intent": "conversation-panel",
    },
    body: JSON.stringify({
      model, stream: true,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) throw new Error(`Copilot stream error: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") { controller.close(); return; }
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) controller.enqueue(text);
          } catch {}
        }
      }
    },
  });
}

export type { Message };
