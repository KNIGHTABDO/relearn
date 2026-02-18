import { NextRequest } from "next/server";
import { store } from "@/lib/store";
import { getProviderFromHeaders, callCopilotStream, callGeminiStream, type AIMessage } from "@/lib/gemini-adapter";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { messages, documentId, spaceId, model } = await request.json();

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

  // Determine provider from headers
  const { provider, token, model: headerModel } = getProviderFromHeaders(request.headers);
  const selectedModel = model || headerModel;

  if (provider && token) {
    const systemMessage = context
      ? `You are an AI study tutor helping the user learn from "${contextTitle}". Use the following context to answer questions:\n\n${context.substring(0, 12000)}\n\nBe specific, cite concepts from the material, and help the user understand deeply.`
      : "You are an AI study tutor. Help the user learn and understand concepts.";

    const aiMessages: AIMessage[] = [
      { role: "system", content: systemMessage },
      ...messages.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    try {
      let stream: ReadableStream<Uint8Array>;

      if (provider === "google") {
        stream = await callGeminiStream(token, selectedModel || "gemini-2.5-pro", aiMessages, { temperature: 0.4 });
      } else {
        stream = await callCopilotStream(token, selectedModel || "gpt-4o", aiMessages, { temperature: 0.4 });
      }

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (error) {
      console.error(`${provider} API error:`, error);
      // Fall through to mock
    }
  }

  // Fallback: mock response when no AI provider connected
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
    return `Based on **${title}**, here's a structured summary:\n\n**Key Points:**\n\n1. The material covers fundamental concepts and principles central to the subject.\n2. Several definitions and theoretical frameworks are established early on.\n3. The content builds progressively from foundational to advanced topics.\n\n**Main Themes:**\n- Core theoretical foundations and principles\n- Practical applications and real-world examples\n- Key terminology and formal definitions\n\n*Connect your Google or GitHub account in Settings to unlock AI-powered responses.*`;
  }
  if (q.includes("explain") || q.includes("what is") || q.includes("define")) {
    return `From **${title}**:\n\nThis concept is described as a fundamental aspect of the subject. The material explains how different components interact and influence each other.\n\n**Key aspects:**\n- The underlying mechanism and its components\n- How it relates to broader themes\n- Practical implications\n\n*Connect your Google or GitHub account in Settings to get AI-powered explanations.*`;
  }
  return `Based on **${title}**:\n\nThe material provides important context. Key points include:\n\n1. **Foundational concepts** establish the framework for understanding.\n2. **Detailed explanations** build on these foundations with examples.\n3. **Connections** are drawn between different aspects of the subject.\n\n*Connect your Google or GitHub account in Settings to chat with real AI models like Gemini Pro, GPT-4o, and more.*`;
}
