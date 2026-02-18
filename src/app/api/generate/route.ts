import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getProviderFromHeaders, callGemini, callCopilot, type AIMessage } from "@/lib/gemini-adapter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { documentId, spaceId, type, model } = await request.json();
  const { provider, token, model: headerModel } = getProviderFromHeaders(request.headers);
  // Legacy support
  const copilotToken = request.headers.get("x-copilot-token");

  // Gather context
  let context = "";
  let docTitle = "Document";
  let sourceLabel = "Document";

  if (spaceId) {
    const space = store.getSpace(spaceId);
    if (space) {
      docTitle = space.name;
      sourceLabel = space.name;
      context = store.getSpaceContext(spaceId);
    }
  } else if (documentId) {
    const doc = store.getDocument(documentId);
    if (doc) {
      docTitle = doc.title;
      sourceLabel = doc.title;
      context = doc.text;
    }
  }

  // If no copilot token, return mock data (existing behavior)
  if (!provider && !copilotToken) {
    return generateMockResponse(type, docTitle);
  }

  // Trim context to fit token limits
  const maxContextChars = 10000;
  const trimmedContext = context.length > maxContextChars
    ? context.substring(0, maxContextChars) + "\n\n[Content truncated for processing]"
    : context;

  const systemPrompts: Record<string, string> = {
    flashcards: `You are an expert study material generator. Create flashcards from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation, no preamble.
- Each object: { "front": "...", "back": "..." }
- Generate exactly 10 flashcards.
- "front": A clear, specific question. End with "?"
- "back": A concise answer (1-3 sentences max). At the END of each answer, add a source reference in this exact format: [Source: <section or topic name from the material>]
- Cover the most important concepts, definitions, processes, and key facts.
- Vary question types: definitions, comparisons, processes, cause-effect, applications.
- Do NOT include numbering, markdown, or HTML in the values.

EXAMPLE OUTPUT:
[{"front":"What is the primary function of mitochondria?","back":"Mitochondria are the powerhouses of the cell, generating ATP through oxidative phosphorylation. They convert nutrients into usable energy for cellular processes. [Source: Cell Organelles — Energy Production]"},{"front":"How does osmosis differ from diffusion?","back":"Osmosis specifically refers to water movement across a semipermeable membrane from low to high solute concentration, while diffusion applies to any molecule moving down its concentration gradient. [Source: Membrane Transport Mechanisms]"}]`,

    quiz: `You are an expert exam question writer. Create multiple-choice quiz questions from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation, no preamble.
- Each object: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0-3, "explanation": "..." }
- Generate exactly 8 questions.
- "question": Clear, unambiguous. Test understanding, not memorization.
- "options": Exactly 4 choices. All plausible. Only ONE correct.
- "correctIndex": 0-based index of the correct option.
- "explanation": 2-3 sentences explaining WHY the correct answer is right and why a common wrong choice fails. End with: [Source: <section or topic from material>]
- Mix difficulty: 3 easy, 3 medium, 2 hard.
- Do NOT include "A)", "B)" prefixes in options — just the text.

EXAMPLE:
[{"question":"Which organelle is primarily responsible for ATP production?","options":["Golgi apparatus","Mitochondria","Endoplasmic reticulum","Lysosome"],"correctIndex":1,"explanation":"Mitochondria produce ATP through oxidative phosphorylation. The Golgi apparatus packages proteins, not energy production. [Source: Cellular Respiration]"}]`,

    summary: `You are an expert academic summarizer. Create a structured summary of the provided source material.

STRICT OUTPUT RULES:
- Return ONLY valid JSON. No markdown fences, no explanation.
- Format: { "keyPoints": [...], "sections": [...] }
- "keyPoints": Array of 4-6 strings. Each is one key takeaway sentence. Each MUST end with a source tag: [Source: <specific section/topic>]
- "sections": Array of 3-5 objects, each: { "heading": "...", "content": "..." }
  - "heading": Short section title (3-5 words)
  - "content": 2-4 sentence summary paragraph. Every factual claim MUST include an inline source tag like [Source: <section>]. Aim for at least 2 source tags per section content.
- Be specific and precise. Use exact terminology from the material.
- Do NOT use generic filler. Every sentence must convey concrete information from the source.

EXAMPLE:
{"keyPoints":["The genetic code uses 64 codons to specify 20 amino acids and stop signals [Source: Codon Table]","Translation occurs in three phases: initiation, elongation, and termination [Source: Translation Process]"],"sections":[{"heading":"The Genetic Code","content":"The genetic code maps nucleotide triplets (codons) to amino acids [Source: Code Structure]. It is nearly universal across all life forms, with minor variations in mitochondria [Source: Code Universality]."}]}`,

    notes: `You are an expert note-taker for students. Create organized study notes from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation.
- Each object: { "title": "...", "content": "...", "highlight": true/false }
- Generate exactly 5 note sections.
- "title": Short descriptive heading (3-6 words)
- "content": Bullet-point style using "- " prefix for each point. Use "\\n" for line breaks between bullets. Each bullet should be a concrete, study-worthy fact. End each bullet with [Source: <section>].
- "highlight": Set true for the 1-2 most critical sections.
- Cover: key definitions, processes/steps, important relationships, common exam topics.

EXAMPLE:
[{"title":"Core Definitions","content":"- Codon: A three-nucleotide sequence in mRNA that specifies an amino acid [Source: Genetic Code Basics]\\n- Anticodon: Complementary triplet on tRNA that pairs with the mRNA codon [Source: tRNA Structure]","highlight":true}]`,

    chapters: `You are an expert at analyzing document structure. Create a chapter/section outline from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation.
- Each object: { "title": "...", "startPage": N, "endPage": N }
- Generate 4-8 logical chapters/sections based on the topics covered.
- "title": Descriptive chapter title (4-8 words)
- Page numbers should be sequential and reasonable for the content length.
- Chapters should follow the natural flow of the material.`,
  };

  const prompt = systemPrompts[type];
  if (!prompt) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.githubcopilot.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${copilotToken}`,
        "Content-Type": "application/json",
        "Copilot-Integration-Id": "vscode-chat",
        "Editor-Version": "vscode/1.99.0",
        "Editor-Plugin-Version": "copilot-chat/0.26.0",
        "Openai-Intent": "conversation-panel",
        "User-Agent": "ReLearn/1.0",
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: `SOURCE MATERIAL TITLE: "${docTitle}"\n\nSOURCE CONTENT:\n${trimmedContext}\n\nGenerate the ${type} now. Return ONLY the JSON — no wrapping, no markdown fences.`,
          },
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      console.error("Copilot generate error:", res.status, await res.text());
      return generateMockResponse(type, docTitle);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response (handle potential markdown fences)
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return formatResponse(type, parsed, docTitle);
    } catch (parseErr) {
      console.error("JSON parse error from AI:", parseErr, "Raw:", raw.substring(0, 500));
      // Try to extract JSON from the response
      const jsonMatch = raw.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          return formatResponse(type, extracted, docTitle);
        } catch {}
      }
      return generateMockResponse(type, docTitle);
    }
  } catch (err) {
    console.error("Generate API error:", err);
    return generateMockResponse(type, docTitle);
  }
}

function formatResponse(type: string, parsed: any, docTitle: string) {
  switch (type) {
    case "flashcards":
      const cards = Array.isArray(parsed) ? parsed : [];
      return NextResponse.json({
        flashcards: cards.map((c: any, i: number) => ({
          id: String(i + 1),
          front: c.front || c.question || "",
          back: c.back || c.answer || "",
        })),
        docTitle,
        aiGenerated: true,
      });

    case "quiz":
      const questions = Array.isArray(parsed) ? parsed : [];
      return NextResponse.json({
        questions: questions.map((q: any, i: number) => ({
          id: String(i + 1),
          question: q.question || "",
          options: q.options || [],
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
          explanation: q.explanation || "",
        })),
        docTitle,
        aiGenerated: true,
      });

    case "summary":
      return NextResponse.json({
        summary: {
          title: docTitle,
          keyPoints: parsed.keyPoints || [],
          sections: (parsed.sections || []).map((s: any) => ({
            heading: s.heading || s.title || "",
            content: s.content || s.summary || "",
          })),
        },
        docTitle,
        aiGenerated: true,
      });

    case "notes":
      const notes = Array.isArray(parsed) ? parsed : [];
      return NextResponse.json({
        notes: notes.map((n: any, i: number) => ({
          id: `n${i + 1}`,
          title: n.title || "",
          content: n.content || "",
          highlight: !!n.highlight,
        })),
        docTitle,
        aiGenerated: true,
      });

    case "chapters":
      const chapters = Array.isArray(parsed) ? parsed : [];
      return NextResponse.json({
        chapters: chapters.map((ch: any, i: number) => ({
          id: `ch${i + 1}`,
          title: ch.title || "",
          startPage: ch.startPage || i * 3 + 1,
          endPage: ch.endPage || (i + 1) * 3,
        })),
        docTitle,
        aiGenerated: true,
      });

    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}

function generateMockResponse(type: string, docTitle: string) {
  // Fallback mock responses when no AI is available
  switch (type) {
    case "flashcards":
      return NextResponse.json({
        flashcards: [
          { id: "1", front: "What are the main concepts covered in this material?", back: "Connect your GitHub account in Settings to generate AI-powered flashcards from your actual document content. [Source: ReLearn Setup]" },
          { id: "2", front: "How can I get AI-generated study materials?", back: "Go to Settings → Connect GitHub → select a model. All generate tools will then use real AI. [Source: ReLearn Setup]" },
        ],
        docTitle,
        aiGenerated: false,
      });

    case "quiz":
      return NextResponse.json({
        questions: [
          { id: "1", question: "What do you need to generate AI-powered quizzes?", options: ["An API key", "A GitHub account connected via Settings", "A paid subscription", "Nothing — it works automatically"], correctIndex: 1, explanation: "ReLearn uses GitHub Copilot for AI features. Connect your GitHub account in Settings to unlock AI-powered quiz generation. [Source: ReLearn Setup]" },
        ],
        docTitle,
        aiGenerated: false,
      });

    case "summary":
      return NextResponse.json({
        summary: {
          title: docTitle,
          keyPoints: [
            "Connect your GitHub account in Settings to generate AI summaries from your documents [Source: ReLearn Setup]",
          ],
          sections: [
            { heading: "Getting Started", content: "This document is ready for AI-powered summarization. Go to Settings → Connect GitHub to enable real AI generation from your document content. [Source: ReLearn Setup]" },
          ],
        },
        docTitle,
        aiGenerated: false,
      });

    case "notes":
      return NextResponse.json({
        notes: [
          { id: "n1", title: "Getting Started with AI Notes", content: "- Connect GitHub in Settings to unlock AI note generation [Source: ReLearn Setup]\n- Once connected, notes will be generated from your actual document content [Source: ReLearn Setup]", highlight: true },
        ],
        docTitle,
        aiGenerated: false,
      });

    case "chapters":
      return NextResponse.json({
        chapters: [
          { id: "ch1", title: "Document Overview", startPage: 1, endPage: 5 },
          { id: "ch2", title: "Main Content", startPage: 6, endPage: 15 },
        ],
        docTitle,
        aiGenerated: false,
      });

    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}
