import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/gemini/image
 * Generate images using Gemini's native image generation (Imagen 3)
 * Available to Google AI Pro subscribers via OAuth
 * 
 * Body: { prompt: string, aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" }
 */
export async function POST(req: NextRequest) {
  try {
    const googleToken = req.headers.get("x-google-token");
    if (!googleToken) {
      return NextResponse.json(
        { error: "Google authentication required. Connect your Google account in Settings." },
        { status: 401 }
      );
    }

    const { prompt, aspectRatio = "1:1", numberOfImages = 1 } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Use Gemini 2.0 Flash with image generation capability
    // This model supports native image output when responseModalities includes "IMAGE"
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            responseMimeType: "text/plain",
          },
        }),
      }
    );

    if (!res.ok) {
      // Fallback: try Imagen 3 via the dedicated image generation endpoint
      const imagenRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: numberOfImages,
              aspectRatio,
              safetyFilterLevel: "block_only_high",
              personGeneration: "allow_adult",
            },
          }),
        }
      );

      if (!imagenRes.ok) {
        const errText = await imagenRes.text();
        console.error("Imagen error:", errText);
        return NextResponse.json(
          { error: "Image generation failed. Your account may not have access to Imagen." },
          { status: 400 }
        );
      }

      const imagenData = await imagenRes.json();
      const images = (imagenData.predictions || []).map((p: any) => ({
        base64: p.bytesBase64Encoded,
        mimeType: p.mimeType || "image/png",
      }));

      return NextResponse.json({ images, model: "imagen-3.0-generate-002" });
    }

    // Parse Gemini response for inline image
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const images = parts
      .filter((p: any) => p.inlineData)
      .map((p: any) => ({
        base64: p.inlineData.data,
        mimeType: p.inlineData.mimeType,
      }));
    const text = parts
      .filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join("\n");

    return NextResponse.json({ images, text, model: "gemini-2.0-flash-exp" });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
