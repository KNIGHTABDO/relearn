import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { spaceId } = await req.json();

    let context = "";
    let topics: string[] = [];

    if (spaceId) {
      const space = store.getSpace(spaceId);
      if (space) {
        topics = space.documents.map(d => d.title);
        context = space.documents.map(d => d.title + ": " + d.text.slice(0, 500)).join("\n");
      }
    }

    const copilotToken = req.headers.get("x-copilot-token");

    if (!copilotToken) {
      return NextResponse.json({
        weeklyPlan: [
          { day: "Monday", blocks: [{ topic: "Cell Biology", duration: 45, type: "review", color: "#10B981" }, { topic: "Genetics Quiz", duration: 30, type: "quiz", color: "#A855F7" }] },
          { day: "Tuesday", blocks: [{ topic: "Algorithms", duration: 60, type: "deep-study", color: "#3B82F6" }] },
          { day: "Wednesday", blocks: [{ topic: "Cell Division", duration: 45, type: "flashcards", color: "#10B981" }, { topic: "Memory Systems", duration: 30, type: "review", color: "#F43F5E" }] },
          { day: "Thursday", blocks: [{ topic: "Data Structures", duration: 60, type: "deep-study", color: "#3B82F6" }] },
          { day: "Friday", blocks: [{ topic: "Biology Practice Exam", duration: 45, type: "exam", color: "#10B981" }, { topic: "CS50 Review", duration: 30, type: "review", color: "#3B82F6" }] },
          { day: "Saturday", blocks: [{ topic: "Weak Areas Review", duration: 60, type: "review", color: "#F97316" }] },
          { day: "Sunday", blocks: [{ topic: "Light Review & Rest", duration: 30, type: "review", color: "#0EA5E9" }] },
        ],
        focusAreas: [
          { topic: "Meiosis vs Mitosis", reason: "Commonly confused — needs more practice", strength: 35 },
          { topic: "Big O Notation", reason: "Key exam topic — review time complexity", strength: 50 },
          { topic: "Working Memory Model", reason: "Recent material — needs initial review", strength: 20 },
        ],
        stats: { totalHours: 12.5, topicsMastered: 3, totalTopics: 8, streak: 7, improvement: 12 },
        isAiGenerated: false,
      });
    }

    const response = await fetch("https://api.githubcopilot.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${copilotToken}`,
        "Content-Type": "application/json",
        "Copilot-Integration-Id": "vscode-chat",
      },
      body: JSON.stringify({
        model: req.headers.get("x-model") || "gpt-4o",
        messages: [
          { role: "system", content: `You are an AI study planner. Create a personalized weekly study plan. Return ONLY valid JSON with this structure: { "weeklyPlan": [{ "day": "Monday", "blocks": [{ "topic": "...", "duration": 45, "type": "review"|"quiz"|"deep-study"|"flashcards"|"exam", "color": "#hex" }] }], "focusAreas": [{ "topic": "...", "reason": "...", "strength": 0-100 }], "stats": { "totalHours": number, "topicsMastered": number, "totalTopics": number, "streak": 0, "improvement": 0 } }` },
          { role: "user", content: `Create a study plan for these topics:\n${context || topics.join(", ")}` },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "AI generation failed" }, { status: 500 });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      return NextResponse.json({ ...plan, isAiGenerated: true });
    } catch {
      return NextResponse.json({ error: "Failed to parse plan" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
