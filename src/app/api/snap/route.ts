import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    const copilotToken = req.headers.get("x-copilot-token");

    if (!copilotToken) {
      return NextResponse.json({
        detectedText: "Find the derivative of f(x) = 3x² + 2x - 5",
        subject: "Calculus",
        solution: {
          steps: [
            { step: 1, title: "Identify the function", content: "We have f(x) = 3x² + 2x - 5, a polynomial function." },
            { step: 2, title: "Apply the power rule", content: "For each term, bring down the exponent and reduce it by 1: d/dx(axⁿ) = n·axⁿ⁻¹" },
            { step: 3, title: "Differentiate term by term", content: "d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-5) = 0" },
            { step: 4, title: "Combine results", content: "f\'(x) = 6x + 2" },
          ],
          answer: "f\'(x) = 6x + 2",
        },
        similarProblems: [
          "Find the derivative of g(x) = x³ - 4x² + 7",
          "Find the derivative of h(x) = 5x⁴ + 3x² - x + 1",
          "Find f\'(2) where f(x) = 3x² + 2x - 5",
        ],
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
          { role: "system", content: `You are an educational problem solver. Analyze the image/text of a problem and provide a detailed step-by-step solution. Return ONLY valid JSON: { "detectedText": "...", "subject": "...", "solution": { "steps": [{ "step": 1, "title": "...", "content": "..." }], "answer": "..." }, "similarProblems": ["...", "...", "..."] }` },
          { role: "user", content: `Solve this problem: ${image ? "[Image provided]" : "No image"}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      return NextResponse.json({ ...result, isAiGenerated: true });
    } catch {
      return NextResponse.json({ error: "Failed to parse result" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
