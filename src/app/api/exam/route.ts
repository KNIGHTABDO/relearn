import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { spaceId, questionCount = 10 } = await request.json();
  const copilotToken = request.headers.get("x-copilot-token");

  if (!spaceId) {
    return NextResponse.json({ error: "spaceId required" }, { status: 400 });
  }

  const space = store.getSpace(spaceId);
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const context = store.getSpaceContext(spaceId);

  // If copilot token, generate real exam questions
  if (copilotToken && context.length > 100) {
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
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert exam writer for the course "${space.name}". Create a rigorous practice exam.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no fences, no preamble.
- Generate exactly ${questionCount} multiple-choice questions.
- Each object: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0-3, "explanation": "..." }
- "question": Clear, exam-style. Test comprehension, analysis, and application — not just recall.
- "options": Exactly 4 choices. All plausible. Only ONE correct. No "A)" prefixes.
- "correctIndex": 0-based index.
- "explanation": 2-3 sentences. Explain the correct answer AND why common wrong choices fail. End with [Source: <topic from material>].
- Distribution: 30% easy (definitions/recall), 40% medium (understanding/application), 30% hard (analysis/synthesis).
- Cover ALL documents in the space evenly. Don't cluster on one topic.`
            },
            {
              role: "user",
              content: `COURSE: ${space.name}\n\nSOURCE MATERIAL FROM ALL DOCUMENTS:\n${context.substring(0, 12000)}\n\nGenerate the exam now. Return ONLY JSON.`
            },
          ],
          stream: false,
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

        try {
          const parsed = JSON.parse(cleaned);
          const questions = (Array.isArray(parsed) ? parsed : []).map((q: any, i: number) => ({
            id: String(i + 1),
            question: q.question || "",
            options: q.options || [],
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            explanation: q.explanation || "",
          }));

          return NextResponse.json({
            title: `${space.name} — Practice Exam`,
            questions,
            timeLimit: Math.max(10, questions.length * 2),
            aiGenerated: true,
          });
        } catch {
          // JSON parse failed, try extraction
          const jsonMatch = raw.match(/[\[{][\s\S]*[\]}]/);
          if (jsonMatch) {
            try {
              const extracted = JSON.parse(jsonMatch[0]);
              const questions = (Array.isArray(extracted) ? extracted : []).map((q: any, i: number) => ({
                id: String(i + 1),
                question: q.question || "",
                options: q.options || [],
                correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
                explanation: q.explanation || "",
              }));
              return NextResponse.json({
                title: `${space.name} — Practice Exam`,
                questions,
                timeLimit: Math.max(10, questions.length * 2),
                aiGenerated: true,
              });
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Exam AI error:", err);
    }
  }

  // Fallback mock exam
  const questions = [
    { id: "1", question: "What is the primary function of the material covered in this course?", options: ["Entertainment", "Education and deep understanding", "Data storage", "Social networking"], correctIndex: 1, explanation: "This course focuses on building deep understanding of the subject matter through multiple study tools. [Source: Course Overview]" },
    { id: "2", question: "Which study method is most effective for long-term retention?", options: ["Passive reading", "Active recall through flashcards and quizzes", "Highlighting text", "Copying notes verbatim"], correctIndex: 1, explanation: "Active recall, tested through flashcards and quizzes, is proven to be significantly more effective for long-term retention than passive methods. [Source: Study Methodology]" },
  ];

  return NextResponse.json({
    title: `${space.name} — Practice Exam`,
    questions,
    timeLimit: 20,
    aiGenerated: false,
  });
}
