import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { documentId, spaceId, language } = await req.json();

    let context = "";
    let title = "Study Material";

    if (documentId) {
      const doc = store.getDocument(documentId);
      if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      context = doc.text.slice(0, 6000);
      title = doc.title;
    } else if (spaceId) {
      const space = store.getSpace(spaceId);
      if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
      title = space.name;
      context = space.documents.map(d => `## ${d.title}\n${d.text}`).join("\n\n").slice(0, 8000);
    }

    const copilotToken = req.headers.get("x-copilot-token");

    if (!copilotToken) {
      // Return mock podcast
      return NextResponse.json({
        title: `${title} - AI Podcast`,
        segments: [
          { host: "Alex", text: "Welcome back to ReLearn Radio! Today we\'re diving into something really fascinating.", emotion: "excited" },
          { host: "Sam", text: "I\'ve been looking forward to this one. What are we covering?", emotion: "curious" },
          { host: "Alex", text: `We\'re exploring ${title}. It\'s one of those topics that seems complex on the surface, but once you break it down, it\'s incredibly elegant.`, emotion: "thoughtful" },
          { host: "Sam", text: "Okay, I\'m intrigued. Where do we even start with something like this?", emotion: "curious" },
          { host: "Alex", text: "Let\'s start with the fundamentals. Think of it like building blocks — every complex concept is built from simpler pieces.", emotion: "emphatic" },
          { host: "Sam", text: "That\'s a great way to think about it. So what\'s the first building block?", emotion: "thoughtful" },
          { host: "Alex", text: "The key insight is understanding how the different components interact with each other. It\'s like a symphony — each instrument plays its part.", emotion: "excited" },
          { host: "Sam", text: "I love that analogy! So if I\'m a student studying this for an exam, what should I focus on first?", emotion: "excited" },
          { host: "Alex", text: "Great question. I\'d say focus on the core relationships first, then work outward to the applications.", emotion: "thoughtful" },
          { host: "Sam", text: "That makes a lot of sense. Any common mistakes students make?", emotion: "curious" },
          { host: "Alex", text: "The biggest one is trying to memorize without understanding. Once you get the \'why\', the \'what\' becomes much easier to remember.", emotion: "emphatic" },
          { host: "Sam", text: "So true. Understanding beats memorization every time.", emotion: "thoughtful" },
          { host: "Alex", text: "Exactly! And that\'s what makes this topic so rewarding — once it clicks, you start seeing connections everywhere.", emotion: "excited" },
          { host: "Sam", text: "Alright, I feel like I have a much better framework now. Thanks for breaking it down!", emotion: "excited" },
          { host: "Alex", text: "Any time! Remember — learn it, don\'t just memorize it. That\'s the ReLearn way.", emotion: "emphatic" },
        ],
        isAiGenerated: false,
      });
    }

    const lang = language || "English";

    const systemPrompt = `You are a podcast script generator for an educational platform. Generate a natural, engaging podcast conversation between two hosts discussing study material.

HOST PERSONALITIES:
- Alex (the explainer): Knowledgeable, uses vivid analogies, breaks down complex concepts into simple parts. Warm and encouraging.
- Sam (the curious learner): Asks insightful questions students would ask, relates concepts to real-world examples, occasionally makes humorous observations.

RULES:
1. The conversation must feel NATURAL — like two friends discussing over coffee, not a lecture.
2. Use analogies, metaphors, and real-world examples extensively.
3. Highlight the most important concepts and common exam pitfalls.
4. Include "aha moment" exchanges where Sam suddenly understands something.
5. Keep each segment to 1-3 sentences.
6. Generate 18-25 segments total.
7. The podcast should be in ${lang}.
8. Each segment needs an emotion tag for voice synthesis.

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences:
{
  "title": "Episode title",
  "segments": [
    { "host": "Alex", "text": "...", "emotion": "excited" | "thoughtful" | "curious" | "emphatic" }
  ]
}`;

    const response = await fetch("https://api.githubcopilot.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${copilotToken}\`,
        "Content-Type": "application/json",
        "Copilot-Integration-Id": "vscode-chat",
      },
      body: JSON.stringify({
        model: req.headers.get("x-model") || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: \`Generate a podcast script about the following study material:\n\n\${context}\` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let podcast;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      podcast = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "Failed to parse podcast script" }, { status: 500 });
    }

    return NextResponse.json({ ...podcast, isAiGenerated: true });
  } catch (error) {
    console.error("Podcast generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
