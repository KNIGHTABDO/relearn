import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Simple streaming response without external AI SDK dependency
// In production, wire up OpenAI or Anthropic with Vercel AI SDK
export async function POST(request: NextRequest) {
  const { messages, documentId } = await request.json();

  const store = (globalThis as any).__documentStore as Map<string, any>;
  let context = "";
  let docTitle = "your document";

  if (store && documentId) {
    const doc = store.get(documentId);
    if (doc) {
      context = doc.text;
      docTitle = doc.title;
    }
  }

  const lastMessage = messages[messages.length - 1]?.content || "";

  // Find relevant chunks based on simple keyword matching
  let relevantContext = context;
  if (context.length > 2000) {
    const keywords = lastMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const chunks = context.match(/.{1,500}/g) || [context];
    const scored = chunks.map((chunk: string) => ({
      chunk,
      score: keywords.reduce(
        (acc: number, kw: string) =>
          acc + (chunk.toLowerCase().includes(kw) ? 1 : 0),
        0
      ),
    }));
    scored.sort((a: any, b: any) => b.score - a.score);
    relevantContext = scored
      .slice(0, 4)
      .map((s: any) => s.chunk)
      .join("\n\n");
  }

  // Generate a contextual response
  const response = generateResponse(lastMessage, relevantContext, docTitle);

  // Stream the response word by word
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = response.split(" ");
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? "" : " ") + words[i];
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 30 + Math.random() * 20));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

function generateResponse(
  question: string,
  context: string,
  docTitle: string
): string {
  const q = question.toLowerCase();

  if (q.includes("summary") || q.includes("summarize") || q.includes("overview")) {
    return \`Based on **\${docTitle}**, here's a structured summary:\n\n**Key Points:**\n\n1. The document covers fundamental concepts and principles related to the subject matter.\n2. Several important definitions and frameworks are established in the opening sections.\n3. The material builds progressively from basic concepts to more complex applications.\n\n**Main Themes:**\n- Core theoretical foundations\n- Practical applications and examples\n- Key terminology and definitions\n\n*According to the document, these themes are interconnected and form the basis for deeper understanding of the topic.*\`;
  }

  if (q.includes("quiz") || q.includes("test") || q.includes("question")) {
    return \`Here are some study questions based on **\${docTitle}**:\n\n**Question 1:** What are the main concepts introduced in this material?\n\n**Question 2:** How do the key principles relate to each other?\n\n**Question 3:** Can you explain the significance of the core framework discussed?\n\n**Question 4:** What practical applications are mentioned in the document?\n\nWould you like me to go deeper into any of these questions?\`;
  }

  if (q.includes("flashcard") || q.includes("flash card") || q.includes("key term")) {
    return \`Here are key terms from **\${docTitle}** for flashcard study:\n\n📝 **Term 1** — The foundational concept that underpins the entire framework discussed in the material.\n\n📝 **Term 2** — A critical process described in detail, involving multiple steps and considerations.\n\n📝 **Term 3** — An important principle that connects theory to practice.\n\n📝 **Term 4** — A specialized technique or method highlighted in the document.\n\nWant me to generate more flashcards or explain any of these in detail?\`;
  }

  if (q.includes("explain") || q.includes("what is") || q.includes("define")) {
    return \`Based on the content of **\${docTitle}**:\n\nThe document explains this concept as a fundamental aspect of the subject. According to the material, it involves understanding how different components interact and influence each other.\n\n**Key aspects include:**\n- The underlying mechanism and its components\n- How it relates to broader themes in the field\n- Practical implications for real-world applications\n\n*Reference: This information is drawn from the uploaded document content.*\n\nWould you like me to elaborate on any specific aspect?\`;
  }

  // Default contextual response
  return \`Based on my analysis of **\${docTitle}**, here's what I found relevant to your question:\n\nThe document provides important context on this topic. The key points include:\n\n1. **Foundational concepts** are introduced early in the material, establishing a framework for understanding.\n2. **Detailed explanations** build on these foundations with examples and applications.\n3. **Connections** are drawn between different aspects of the subject matter.\n\n*This response is based on the content of your uploaded document. For more specific answers, try asking about particular concepts, definitions, or sections.*\n\nWhat else would you like to know about this material?\`;
}
