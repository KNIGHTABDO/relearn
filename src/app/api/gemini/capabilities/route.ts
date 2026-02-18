import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/gemini/capabilities
 * Check what Gemini capabilities are available for the user's subscription level.
 * Tests each endpoint and returns availability status.
 */
export async function GET(req: NextRequest) {
  const googleToken = req.headers.get("x-google-token");
  if (!googleToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Test available models
  const capabilities: Record<string, boolean | string> = {};

  try {
    const modelsRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: { Authorization: `Bearer ${googleToken}` },
      }
    );

    if (modelsRes.ok) {
      const data = await modelsRes.json();
      const modelNames = (data.models || []).map((m: any) => m.name);

      capabilities.chat = modelNames.some((n: string) => n.includes("gemini"));
      capabilities.imageGeneration = modelNames.some((n: string) => 
        n.includes("imagen") || n.includes("gemini-2.0-flash")
      );
      capabilities.videoGeneration = modelNames.some((n: string) => n.includes("veo"));
      capabilities.codeExecution = true; // Available on all Gemini models
      capabilities.models = modelNames.filter((n: string) => 
        n.includes("gemini") || n.includes("imagen") || n.includes("veo")
      );
    } else {
      capabilities.error = "Could not fetch models list";
    }
  } catch (err) {
    capabilities.error = "Network error checking capabilities";
  }

  return NextResponse.json(capabilities);
}
