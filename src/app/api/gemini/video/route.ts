import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/gemini/video
 * Generate short videos using Veo 2 via Gemini API
 * Available to Google AI Pro subscribers via OAuth
 * 
 * Body: { prompt: string, durationSeconds?: 5 | 10 }
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

    const { prompt, durationSeconds = 5, imageBase64, imageMimeType } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Veo 2 via Gemini API generateContent with VIDEO modality
    const contents: any[] = [];
    const userParts: any[] = [];

    // If an image is provided, use it as a reference for image-to-video
    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: imageMimeType || "image/png",
          data: imageBase64,
        },
      });
    }

    userParts.push({ text: prompt });
    contents.push({ role: "user", parts: userParts });

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:generateContent",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseModalities: ["VIDEO"],
            videoDuration: `${durationSeconds}s`,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Veo error:", errText);

      // Check if this is a long-running operation
      if (res.status === 200 || res.status === 202) {
        const opData = await res.json().catch(() => null);
        if (opData?.name) {
          // Long-running operation — return the operation name for polling
          return NextResponse.json({
            status: "processing",
            operationName: opData.name,
            message: "Video is being generated. Poll the status endpoint.",
          });
        }
      }

      return NextResponse.json(
        { error: `Video generation failed (${res.status}). Veo 2 may not be available on your plan.` },
        { status: 400 }
      );
    }

    const data = await res.json();

    // Check if it's a long-running operation
    if (data.name && !data.candidates) {
      return NextResponse.json({
        status: "processing",
        operationName: data.name,
        message: "Video is being generated. This may take 1-2 minutes.",
      });
    }

    // Direct result
    const parts = data.candidates?.[0]?.content?.parts || [];
    const videos = parts
      .filter((p: any) => p.inlineData?.mimeType?.startsWith("video/"))
      .map((p: any) => ({
        base64: p.inlineData.data,
        mimeType: p.inlineData.mimeType,
      }));

    if (videos.length === 0) {
      return NextResponse.json({ 
        error: "No video was generated. Try a different prompt.",
        rawParts: parts.map((p: any) => Object.keys(p))
      }, { status: 400 });
    }

    return NextResponse.json({ videos, model: "veo-2.0-generate-001" });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
