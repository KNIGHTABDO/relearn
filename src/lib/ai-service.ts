// Client-side AI service for Tauri desktop mode
// Replaces all /api/ routes that don't exist in static export

import { callAIDirect, streamAIDirect } from "./gemini-client";
import { isTauri } from "./tauri-auth";
import * as db from "./database";

// ============================================================
// SYSTEM PROMPTS (extracted from server-side API routes)
// ============================================================

const PROMPTS = {
  chat: (title: string, context: string, extraContext?: string) => {
    const hasCtx = context || extraContext;
    const fullCtx = [context?.substring(0, 10000), extraContext?.substring(0, 4000)].filter(Boolean).join("\n\n---\n\n");
    return hasCtx
      ? `You are ReLearn — an expert AI study tutor helping a student master material from "${title}".

CONTEXT FROM THEIR MATERIAL:
${fullCtx}

YOUR ROLE:
- Answer questions based on the material above; cite specific parts as [Page X] or [Section: Name] when referencing them
- Explain concepts clearly with analogies and examples
- Break down complex ideas into digestible steps
- If asked about something not in the material, say so and answer from general knowledge
- Be encouraging and Socratic — guide the student to think, not just memorize
- Use **bold** for key terms, bullet points for lists, and keep responses concise but complete
- When quoting or referencing a specific part, use [Page X] citation format`
      : `You are ReLearn — an expert AI study tutor. Help the student understand any topic they are studying. Be clear, encouraging, and use examples. Break down complex ideas step by step. Use **bold** for key terms and bullet points for lists.`;
  },

  flashcards: `You are an expert study material generator. Create flashcards from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation, no preamble.
- Each object: { "front": "...", "back": "..." }
- Generate exactly 10 flashcards.
- "front": A clear, specific question. End with "?"
- "back": A concise answer (1-3 sentences max). At the END of each answer, add a source reference in this exact format: [Source: <section or topic name from the material>]
- Cover the most important concepts, definitions, processes, and key facts.
- Vary question types: definitions, comparisons, processes, cause-effect, applications.
- Do NOT include numbering, markdown, or HTML in the values.`,

  quiz: `You are an expert exam question writer. Create multiple-choice quiz questions from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation, no preamble.
- Each object: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0-3, "explanation": "..." }
- Generate exactly 8 questions.
- "question": Clear, unambiguous. Test understanding, not memorization.
- "options": Exactly 4 choices. All plausible. Only ONE correct.
- "correctIndex": 0-based index of the correct option.
- "explanation": 2-3 sentences explaining WHY the correct answer is right. End with: [Source: <section or topic from material>]
- Mix difficulty: 3 easy, 3 medium, 2 hard.
- Do NOT include "A)", "B)" prefixes in options.`,

  summary: `You are an expert academic summarizer. Create a structured summary of the provided source material.

STRICT OUTPUT RULES:
- Return ONLY valid JSON. No markdown fences, no explanation.
- Format: { "keyPoints": [...], "sections": [...] }
- "keyPoints": Array of 4-6 strings. Each is one key takeaway sentence. Each MUST end with a source tag: [Source: <specific section/topic>]
- "sections": Array of 3-5 objects, each: { "heading": "...", "content": "..." }
  - "heading": Short section title (3-5 words)
  - "content": 2-4 sentence summary paragraph. Include inline [Source: <section>] tags.
- Be specific and precise. Use exact terminology from the material.`,

  notes: `You are an expert note-taker for students. Create organized study notes from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation.
- Each object: { "title": "...", "content": "...", "highlight": true/false }
- Generate exactly 5 note sections.
- "title": Short descriptive heading (3-6 words)
- "content": Bullet-point style using "- " prefix for each point. Use "\n" for line breaks between bullets. End each bullet with [Source: <section>].
- "highlight": Set true for the 1-2 most critical sections.`,

  chapters: `You are an expert at analyzing document structure. Create a chapter/section outline from the provided source material.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown fences, no explanation.
- Each object: { "title": "...", "startPage": N, "endPage": N }
- Generate 4-8 logical chapters/sections.
- "title": Descriptive chapter title (4-8 words)
- Page numbers should be sequential and reasonable.`,

  podcast: (lang: string) => `You are a podcast script generator for an educational platform. Generate a natural, engaging podcast conversation between two hosts discussing study material.

HOST PERSONALITIES:
- Alex (the explainer): Knowledgeable, uses vivid analogies, breaks down complex concepts.
- Sam (the curious learner): Asks insightful questions, relates to real-world examples.

RULES:
1. The conversation must feel NATURAL — like two friends discussing over coffee.
2. Use analogies, metaphors, and real-world examples extensively.
3. Highlight the most important concepts and common exam pitfalls.
4. Keep each segment to 1-3 sentences. Generate 18-25 segments total.
5. The podcast should be in ${lang}.
6. Each segment needs an emotion tag for voice synthesis.

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences:
{
  "title": "Episode title",
  "segments": [
    { "host": "Alex", "text": "...", "emotion": "excited" | "thoughtful" | "curious" | "emphatic" }
  ]
}`,

  exam: (spaceName: string, questionCount: number) => `You are an expert exam writer for the course "${spaceName}". Create a rigorous practice exam.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no fences, no preamble.
- Generate exactly ${questionCount} multiple-choice questions.
- Each object: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0-3, "explanation": "..." }
- Distribution: 30% easy, 40% medium, 30% hard.
- Cover ALL documents evenly.`,

  snap: `You are an educational problem solver. Analyze the image/text of a problem and provide a detailed step-by-step solution. Return ONLY valid JSON: { "detectedText": "...", "subject": "...", "solution": { "steps": [{ "step": 1, "title": "...", "content": "..." }], "answer": "..." }, "similarProblems": ["...", "...", "..."] }`,

  imageOcr: `You are an AI that extracts and describes content from educational images. When given an image, provide: (1) A complete transcription of ALL text visible (equations, labels, headings), (2) Description of any diagrams/charts/graphs, (3) A concise summary of what this covers. Format as clean readable plain text. Use standard text for math (x^2, sqrt(x), etc.)`,
  studyPlan: `You are an AI study planner. Create a personalized weekly study plan based on the provided material. Return ONLY valid JSON with EXACTLY this structure:
{
  "weekly": [{ "day": "Mon", "blocks": [{ "id": "b1", "topicId": "t1", "title": "Study session title", "duration": 45 }], "tasks": [{ "id": "task1", "title": "Task description", "completed": false }] }],
  "topics": [{ "id": "t1", "name": "Topic name", "strength": "weak", "color": "bg-purple-200", "estimatedHours": 3 }],
  "stats": { "totalHours": 12, "mastered": 2, "totalTopics": 8, "streak": 0, "improvement": 15 }
}
RULES: Cover all 7 days (Mon-Sun). Generate 2-4 blocks per day. Generate 4-8 topics. Use "strength": "weak"|"medium"|"strong". Colors: bg-purple-200, bg-blue-200, bg-sky-200, bg-pink-200, bg-orange-200. Return ONLY valid JSON, no markdown fences.`,
};


// ============================================================
// Helper: extract JSON from AI response (handles markdown fences)
// ============================================================
function extractJSON(text: string): any {
  // Try direct parse first
  try { return JSON.parse(text); } catch {}
  // Try to find JSON array
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) try { return JSON.parse(arrMatch[0]); } catch {}
  // Try to find JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) try { return JSON.parse(objMatch[0]); } catch {}
  return null;
}

// ============================================================
// Get document context for AI calls
// ============================================================
async function getDocContext(documentId?: string, spaceId?: string): Promise<{ text: string; title: string }> {
  if (documentId) {
    const doc = await db.getDocument(documentId);
    if (doc) return { text: doc.text || "", title: doc.title || "Document" };
  }
  if (spaceId) {
    const docs = await db.getDocumentsBySpace(spaceId);
    const combined = docs.map(d => `--- ${d.title} ---\n${d.text || ""}`).join("\n\n");
    const space = await db.getSpace(spaceId);
    return { text: combined, title: space?.name || "Space" };
  }
  return { text: "", title: "Document" };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Stream a chat response. Returns an async generator of text chunks.
 * Falls back to /api/chat in web mode.
 */
export async function chatStream(
  messages: { role: string; content: string }[],
  documentId?: string,
  spaceId?: string,
  onChunk?: (text: string) => void,
  extraDocIds?: string[]
): Promise<string> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const { text, title } = await getDocContext(documentId, spaceId);

  // Fetch extra context documents if provided
  let extraContext: string | undefined;
  if (extraDocIds && extraDocIds.length > 0) {
    try {
      const extraTexts: string[] = [];
      for (const docId of extraDocIds) {
        const doc = await db.getDocument(docId);
        if (doc?.text) extraTexts.push(`--- ${doc.title} ---\n${doc.text.substring(0, 2000)}`);
      }
      if (extraTexts.length > 0) extraContext = extraTexts.join("\n\n");
    } catch { /* ignore extra context errors */ }
  }

  const systemPrompt = PROMPTS.chat(title, text, extraContext);

  const aiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const stream = await streamAIDirect(aiMessages, { temperature: 0.7 });
  if (!stream) throw new Error("NO_AI_PROVIDER");

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = typeof value === "string" ? value : decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk?.(fullText);
  }
  return fullText;
}

/**
 * Generate content (flashcards, quiz, summary, notes, chapters).
 * Returns parsed JSON.
 */
export async function generateContent(
  type: "flashcards" | "quiz" | "summary" | "notes" | "chapters",
  documentId?: string,
  spaceId?: string
): Promise<any> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const { text, title } = await getDocContext(documentId, spaceId);
  const prompt = PROMPTS[type];
  const trimmed = text.substring(0, 15000);

  const result = await callAIDirect(
    [
      { role: "system", content: prompt },
      { role: "user", content: `SOURCE MATERIAL TITLE: "${title}"\n\nSOURCE CONTENT:\n${trimmed}\n\nGenerate the ${type} now. Return ONLY the JSON.` },
    ],
    { temperature: 0.3 }
  );

  if (!result) throw new Error("NO_AI_PROVIDER");
  const parsed = extractJSON(result);
  if (!parsed) throw new Error("PARSE_ERROR");
  return parsed;
}

/**
 * Generate a practice exam from a space's documents.
 */
export async function generateExam(
  spaceId: string,
  questionCount = 15
): Promise<any[]> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const docs = await db.getDocumentsBySpace(spaceId);
  const context = docs.map(d => `--- ${d.title} ---\n${d.text || ""}`).join("\n\n");
  const space = await db.getSpace(spaceId);
  const spaceName = space?.name || "Course";

  const result = await callAIDirect(
    [
      { role: "system", content: PROMPTS.exam(spaceName, questionCount) },
      { role: "user", content: `COURSE: ${spaceName}\n\nSOURCE MATERIAL:\n${context.substring(0, 12000)}\n\nGenerate the exam now. Return ONLY JSON.` },
    ],
    { temperature: 0.3 }
  );

  if (!result) throw new Error("NO_AI_PROVIDER");
  const parsed = extractJSON(result);
  if (!parsed) throw new Error("PARSE_ERROR");
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Generate a podcast script from document content.
 */
export async function generatePodcast(
  documentId?: string,
  spaceId?: string
): Promise<any> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const lang = (typeof window !== "undefined" ? localStorage.getItem("relearn-language") : null) || "en";
  const langNames: Record<string, string> = { en: "English", es: "Spanish", fr: "French", ar: "Arabic", de: "German", zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese", hi: "Hindi" };
  const { text, title } = await getDocContext(documentId, spaceId);

  const result = await callAIDirect(
    [
      { role: "system", content: PROMPTS.podcast(langNames[lang] || "English") },
      { role: "user", content: `Create a podcast episode about: "${title}"\n\nSOURCE:\n${text.substring(0, 12000)}` },
    ],
    { temperature: 0.7 }
  );

  if (!result) throw new Error("NO_AI_PROVIDER");
  const parsed = extractJSON(result);
  if (!parsed) throw new Error("PARSE_ERROR");
  return parsed;
}

/**
 * Snap a problem — analyze an image/text and provide a solution.
 */
export async function snapProblem(problemText: string): Promise<any> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const result = await callAIDirect(
    [
      { role: "system", content: PROMPTS.snap },
      { role: "user", content: `Solve this problem:\n${problemText}` },
    ],
    { temperature: 0.3 }
  );

  if (!result) throw new Error("NO_AI_PROVIDER");
  const parsed = extractJSON(result);
  if (!parsed) throw new Error("PARSE_ERROR");
  return { ...parsed, isAiGenerated: true };
}

/**
 * Generate a study plan from context/topics.
 */
export async function generateStudyPlan(context: string): Promise<any> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const result = await callAIDirect(
    [
      { role: "system", content: PROMPTS.studyPlan },
      { role: "user", content: `Create a study plan for these topics:\n${context}` },
    ],
    { temperature: 0.5 }
  );

  if (!result) throw new Error("NO_AI_PROVIDER");
  const parsed = extractJSON(result);
  if (!parsed) throw new Error("PARSE_ERROR");
  return { ...parsed, isAiGenerated: true };
}

/**
 * Describe / OCR an image file for use in chat context.
 * Returns extracted text + description so chat can reference image content.
 */
export async function describeImageContent(base64Data: string, mimeType: string): Promise<string> {
  if (!isTauri()) throw new Error("NOT_TAURI");

  const provider = await getActiveProvider();
  if (!provider) throw new Error("NO_AI_PROVIDER");

  // Build an inline image part for Gemini
  try {
    const { geminiClient } = await import("@/lib/gemini-client");
    const result = await geminiClient.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPTS.imageOcr },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
    });
    return result?.response?.text() || "[Image: unable to extract content]";
  } catch (err) {
    console.error("[AI] describeImageContent error:", err);
    return "[Image: unable to extract content at this time]";
  }
}
