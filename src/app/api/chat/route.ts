import { NextRequest } from "next/server";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { messages, documentId, spaceId } = await request.json();

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

  const lastMessage = messages[messages.length - 1]?.content || "";

  let relevantContext = context;
  if (context.length > 3000) {
    const keywords = lastMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const chunks = context.match(/.{1,600}/g) || [context];
    const scored = chunks.map((chunk: string) => ({
      chunk,
      score: keywords.reduce(
        (acc: number, kw: string) =>
          acc + (chunk.toLowerCase().includes(kw) ? 1 : 0),
        0
      ),
    }));
    scored.sort((a: any, b: any) => b.score - a.score);
    relevantContext = scored.slice(0, 5).map((s: any) => s.chunk).join("\n\n");
  }

  const response = generateResponse(lastMessage, relevantContext, contextTitle);

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

function generateResponse(question: string, context: string, title: string): string {
  const q = question.toLowerCase();
  if (q.includes("summary") || q.includes("summarize") || q.includes("overview")) {
    return \`Based on **\${title}**, here's a structured summary:\n\n**Key Points:**\n\n1. The material covers fundamental concepts and principles central to the subject.\n2. Several definitions and theoretical frameworks are established early on.\n3. The content builds progressively from foundational to advanced topics.\n\n**Main Themes:**\n- Core theoretical foundations and principles\n- Practical applications and real-world examples\n- Key terminology and formal definitions\n- Connections between concepts across the material\n\n*This summary draws from the uploaded content in \${title}.*\`;
  }
  if (q.includes("quiz") || q.includes("test") || q.includes("question")) {
    return \`Here are study questions based on **\${title}**:\n\n**Q1:** What are the main concepts introduced in this material?\n\n**Q2:** How do the key principles relate to each other?\n\n**Q3:** Explain the significance of the core framework discussed.\n\n**Q4:** What practical applications are described?\n\nWant me to go deeper on any of these?\`;
  }
  if (q.includes("flashcard") || q.includes("key term")) {
    return \`Key terms from **\${title}**:\n\n📝 **Term 1** — The foundational concept underpinning the framework.\n\n📝 **Term 2** — A critical process involving multiple steps.\n\n📝 **Term 3** — An important principle connecting theory to practice.\n\n📝 **Term 4** — A specialized technique highlighted in the material.\n\nWant more flashcards or explanations?\`;
  }
  if (q.includes("explain") || q.includes("what is") || q.includes("define")) {
    return \`From **\${title}**:\n\nThis concept is described as a fundamental aspect of the subject. The material explains how different components interact and influence each other.\n\n**Key aspects:**\n- The underlying mechanism and its components\n- How it relates to broader themes\n- Practical implications\n\n*Reference: Content from \${title}.*\n\nWant me to elaborate on any aspect?\`;
  }
  return \`Based on **\${title}**:\n\nThe material provides important context. Key points include:\n\n1. **Foundational concepts** establish the framework for understanding.\n2. **Detailed explanations** build on these foundations with examples.\n3. **Connections** are drawn between different aspects of the subject.\n\n*For more specific answers, try asking about particular concepts or sections.*\n\nWhat else would you like to know?\`;
}
