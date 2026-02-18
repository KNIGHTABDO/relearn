import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { github_token } = await request.json();

    if (!github_token) {
      return NextResponse.json({ error: "Missing github_token" }, { status: 400 });
    }

    const res = await fetch("https://api.github.com/copilot_internal/v2/token", {
      headers: {
        "Authorization": `Bearer ${github_token}`,
        "Accept": "application/json",
        "User-Agent": "ReLearn/1.0",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Failed to get copilot token", details: errorText, status: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Copilot token error:", error);
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}
