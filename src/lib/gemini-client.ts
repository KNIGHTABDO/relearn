// Direct Gemini/Copilot API client for Tauri desktop mode
// Routes through Antigravity (Cloud Code) internal API for AI Pro benefits
// Same approach as OpenClaw and opencode-antigravity-auth plugin

import { isTauri } from "./tauri-auth";
import { ensureGoogleToken, getSelectedGeminiModel, getGeminiApiKey, getProjectId, getAntigravityEndpoints } from "./google-auth";
import { ensureCopilotToken, getSelectedModel } from "./github-auth";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Antigravity headers — mimic the Cloud Code IDE
function getAntigravityHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
    "User-Agent": "antigravity/1.15.8 darwin/arm64",
    "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
    "Client-Metadata": JSON.stringify({
      ideType: "ANTIGRAVITY",
      platform: "MACOS",
      pluginType: "GEMINI",
    }),
  };
}

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

/**
 * Call AI directly from the client (Tauri desktop mode).
 * Tries Google (Antigravity) first, then API key, then Copilot.
 */
export async function callAIDirect(
  messages: Message[],
  options: { temperature?: number; maxTokens?: number; stream?: false }
): Promise<string | null> {
  if (!isTauri()) return null;

  // Try Antigravity OAuth first (AI Pro benefits)
  const googleToken = await ensureGoogleToken();
  if (googleToken) {
    return callAntigravityDirect(googleToken, getSelectedGeminiModel(), messages, options);
  }
  // Fall back to standard API key
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    return callGeminiApiKeyDirect(apiKey, getSelectedGeminiModel(), messages, options);
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
 */
export async function streamAIDirect(
  messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<string> | null> {
  if (!isTauri()) return null;

  const googleToken = await ensureGoogleToken();
  if (googleToken) {
    return streamAntigravityDirect(googleToken, getSelectedGeminiModel(), messages, options);
  }
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    return streamGeminiApiKeyDirect(apiKey, getSelectedGeminiModel(), messages, options);
  }

  const copilotToken = await ensureCopilotToken();
  if (copilotToken) {
    return streamCopilotDirect(copilotToken, getSelectedModel(), messages, options);
  }

  console.error("[ReLearn] No AI provider available. Connect Google or GitHub in Settings.");
  return null;
}

// =========================
// Antigravity Direct (Cloud Code internal API)
// =========================

function buildGeminiBody(messages: Message[], options: { temperature?: number; maxTokens?: number }): any {
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
  return body;
}

async function callAntigravityDirect(
  token: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const body = buildGeminiBody(messages, options);
  body.model = "models/" + model;

  const endpoints = getAntigravityEndpoints();
  let lastError = "";

  for (const endpoint of endpoints) {
    try {
      const url = endpoint + "/v1internal:generateContent";
      const res = await fetch(url, {
        method: "POST",
        headers: getAntigravityHeaders(token),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        lastError = "Antigravity " + endpoint.split("//")[1].split(".")[0] + ": " + res.status;
        console.warn("[ReLearn] " + lastError);
        continue;
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      lastError = "Antigravity " + endpoint.split("//")[1].split(".")[0] + " failed";
      continue;
    }
  }
  throw new Error("All Antigravity endpoints failed. Last: " + lastError);
}

async function streamAntigravityDirect(
  token: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<string>> {
  const body = buildGeminiBody(messages, options);
  body.model = "models/" + model;

  const endpoints = getAntigravityEndpoints();
  let lastError = "";
  let res: Response | null = null;

  for (const endpoint of endpoints) {
    try {
      const url = endpoint + "/v1internal:streamGenerateContent?alt=sse";
      const attempt = await fetch(url, {
        method: "POST",
        headers: getAntigravityHeaders(token),
        body: JSON.stringify(body),
      });

      if (!attempt.ok) {
        lastError = "Antigravity stream " + res + ": " + attempt.status;
        continue;
      }
      res = attempt;
      break;
    } catch (e) {
      console.warn("[gemini-client] stream attempt failed, retrying:", e);
      continue;
    }
  }

  if (!res) throw new Error("All Antigravity stream endpoints failed. Last: " + lastError);

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
          } catch {/* ignore malformed stream chunk */}
        }
      }
    },
  });
}

// =========================
// Gemini API Key Direct (fallback to standard API)
// =========================

async function callGeminiApiKeyDirect(
  apiKey: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const body = buildGeminiBody(messages, options);
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Gemini API key error: " + res.status);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function streamGeminiApiKeyDirect(
  apiKey: string, model: string, messages: Message[],
  options: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream<string>> {
  const body = buildGeminiBody(messages, options);
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Gemini stream error: " + res.status);

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
          } catch {/* ignore malformed stream chunk */}
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
      Authorization: "Bearer " + token,
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

  if (!res.ok) throw new Error("Copilot error: " + res.status);
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
      Authorization: "Bearer " + token,
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

  if (!res.ok) throw new Error("Copilot stream error: " + res.status);

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
          } catch {/* ignore malformed stream chunk */}
        }
      }
    },
  });
}

export type { Message };
