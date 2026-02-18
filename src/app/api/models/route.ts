import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const copilotToken = request.headers.get("x-copilot-token");

  if (!copilotToken) {
    return NextResponse.json({ error: "Missing copilot token" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.githubcopilot.com/models", {
      headers: {
        "Authorization": `Bearer ${copilotToken}`,
        "Accept": "application/json",
        "Copilot-Integration-Id": "vscode-chat",
        "Editor-Version": "vscode/1.99.0",
        "Editor-Plugin-Version": "copilot-chat/0.26.0",
        "Openai-Intent": "models-list",
        "User-Agent": "ReLearn/1.0",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch models", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Models fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
