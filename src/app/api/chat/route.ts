import { NextRequest } from "next/server";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { messages, documentId, spaceId, model } = await request.json();
  const copilotToken = request.headers.get("x-copilot-token");

  let context = "";
  let contextTitle = "your document";

  if (spaceId) {
    const space = store.getSpace(spaceId);
    if (space) {
      contextTitle = space.name + " (all documents)";
      context = store.getSpaceContext(spaceId);
    }
  } else if (documentId) {
    const doc = store.getDocument(documentId);
    if (doc) {
      contextTitle = doc.title;
      context = doc.text;
    }
  }

  // If we have a copilot token, use the real Copilot API
  if (copilotToken) {
    const systemMessage = context
      ? `You are an AI study tutor helping the user learn from "${contextTitle}". Use the following context to answer questions:\n\n${context.substring(0, 12000)}\n\nBe specific, cite concepts from the material, and help the user understand deeply.`
      : "You are an AI study tutor. Help the user learn and understand concepts.";

    const apiMessages = [
      { role: "system", content: systemMessage },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch("https://api.githubcopilot.com/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${copilotToken}`,
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "Copilot-Integration-Id": "vscode-chat",
          "Editor-Version": "vscode/1.99.0",
          "Editor-Plugin-Version": "copilot-chat/0.26.0",
          "Openai-Intent": "conversation-panel",
          "User-Agent": "ReLearn/1.0",
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages: apiMessages,
          stream: true,
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        const encoder = new TextEncoder();
        const fallbackStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`Error from Copilot API (${res.status}): ${errText.substring(0, 200)}`));
            controller.close();
          },
        });
        return new Response(fallbackStream, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      // Stream SSE response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
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
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
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
            console.error("Stream error:", err);
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (error) {
      console.error("Copilot API error:", error);
      // Fall through to mock response
    }
  }

  // Fallback: mock response when no copilot token
  const lastMessage = messages[messages.length - 1]?.content || "";
  const response = generateFallbackResponse(lastMessage, context, contextTitle);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = response.split(" ");
      for (let i = 0; i < words.length; i++) {
        controller.enqueue(encoder.encode((i === 0 ? "" : " ") + words[i]));
        await new Promise((r) => setTimeout(r, 25 + Math.random() * 15));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function generateFallbackResponse(question: string, context: string, title: string): string {
  const q = question.toLowerCase();
  if (q.includes("summary") || q.includes("summarize") || q.includes("overview")) {
    return `Based on **${title}**, here's a structured summary:\n\n**Key Points:**\n\n1. The material covers fundamental concepts and principles central to the subject.\n2. Several definitions and theoretical frameworks are established early on.\n3. The content builds progressively from foundational to advanced topics.\n\n**Main Themes:**\n- Core theoretical foundations and principles\n- Practical applications and real-world examples\n- Key terminology and formal definitions\n\n*Connect your GitHub account in Settings to unlock AI-powered responses with real models like GPT-4o and Claude.*`;
  }
  if (q.includes("explain") || q.includes("what is") || q.includes("define")) {
    return `From **${title}**:\n\nThis concept is described as a fundamental aspect of the subject. The material explains how different components interact and influence each other.\n\n**Key aspects:**\n- The underlying mechanism and its components\n- How it relates to broader themes\n- Practical implications\n\n*Connect your GitHub account in Settings to get AI-powered explanations with real models.*`;
  }
  return `Based on **${title}**:\n\nThe material provides important context. Key points include:\n\n1. **Foundational concepts** establish the framework for understanding.\n2. **Detailed explanations** build on these foundations with examples.\n3. **Connections** are drawn between different aspects of the subject.\n\n*Connect your GitHub account in Settings to chat with real AI models like GPT-4o, Claude, and more.*`;
}
