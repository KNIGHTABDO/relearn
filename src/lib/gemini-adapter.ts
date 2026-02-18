// AI Provider Adapter — Routes calls to GitHub Copilot OR Google Gemini
// based on which provider the user is connected to.

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AICompletionOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface AICompletionResult {
  content: string;
  model: string;
  provider: "github" | "google" | "mock";
}

/**
 * Get the provider and token from request headers.
 * API routes should pass both tokens; this picks the active one.
 */
export function getProviderFromHeaders(headers: Headers): {
  provider: "github" | "google" | null;
  token: string | null;
  model: string | null;
} {
  // Check Google first (student-friendly default)
  const googleToken = headers.get("x-google-token");
  if (googleToken) {
    return {
      provider: "google",
      token: googleToken,
      model: headers.get("x-gemini-model") || "gemini-2.5-pro",
    };
  }

  // Then GitHub Copilot
  const copilotToken = headers.get("x-copilot-token");
  if (copilotToken) {
    return {
      provider: "github",
      token: copilotToken,
      model: headers.get("x-model") || "gpt-4o",
    };
  }

  return { provider: null, token: null, model: null };
}

/**
 * Convert OpenAI-style messages to Gemini API format.
 * Gemini uses "contents" with "parts" and handles system differently.
 */
function toGeminiMessages(messages: AIMessage[]): {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
} {
  const system = messages.filter((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");

  const systemInstruction = system.length > 0
    ? { parts: [{ text: system.map((m) => m.content).join("\n\n") }] }
    : undefined;

  const contents = nonSystem.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Gemini requires at least one user message
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  return { systemInstruction, contents };
}

/**
 * Call Google Gemini API (non-streaming).
 */
export async function callGemini(
  token: string,
  model: string,
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<AICompletionResult> {
  const { systemInstruction, contents } = toGeminiMessages(messages);

  const body: any = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.substring(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return { content: text, model, provider: "google" };
}

/**
 * Call Google Gemini API (streaming) — returns a ReadableStream of text chunks.
 */
export async function callGeminiStream(
  token: string,
  model: string,
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<ReadableStream<Uint8Array>> {
  const { systemInstruction, contents } = toGeminiMessages(messages);

  const body: any = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`Gemini error (${res.status}): ${errText.substring(0, 200)}`));
        controller.close();
      },
    });
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      if (!reader) { controller.close(); return; }
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Gemini stream error:", err);
      }
      controller.close();
    },
  });
}

/**
 * Call GitHub Copilot API (non-streaming).
 */
export async function callCopilot(
  token: string,
  model: string,
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<AICompletionResult> {
  const res = await fetch("https://api.githubcopilot.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Copilot-Integration-Id": "vscode-chat",
      "Editor-Version": "vscode/1.99.0",
      "Editor-Plugin-Version": "copilot-chat/0.26.0",
      "Openai-Intent": "conversation-panel",
      "User-Agent": "ReLearn/1.0",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Copilot API error (${res.status}): ${errText.substring(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  return { content, model, provider: "github" };
}

/**
 * Call GitHub Copilot API (streaming).
 */
export async function callCopilotStream(
  token: string,
  model: string,
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<ReadableStream<Uint8Array>> {
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
      "User-Agent": "ReLearn/1.0",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`Copilot error (${res.status}): ${errText.substring(0, 200)}`));
        controller.close();
      },
    });
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      if (!reader) { controller.close(); return; }
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Copilot stream error:", err);
      }
      controller.close();
    },
  });
}

/**
 * Universal AI call — automatically routes to the right provider.
 * Non-streaming version.
 */
export async function callAI(
  headers: Headers,
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<AICompletionResult | null> {
  const { provider, token, model } = getProviderFromHeaders(headers);

  if (!provider || !token) return null;

  if (provider === "google") {
    return callGemini(token, model || "gemini-2.5-pro", messages, options);
  } else {
    return callCopilot(token, model || "gpt-4o", messages, options);
  }
}

/**
 * Universal AI streaming call — automatically routes to the right provider.
 */
export async function callAIStream(
  headers: Headers,
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<ReadableStream<Uint8Array> | null> {
  const { provider, token, model } = getProviderFromHeaders(headers);

  if (!provider || !token) return null;

  if (provider === "google") {
    return callGeminiStream(token, model || "gemini-2.5-pro", messages, options);
  } else {
    return callCopilotStream(token, model || "gpt-4o", messages, options);
  }
}

export type { AIMessage, AICompletionResult };
