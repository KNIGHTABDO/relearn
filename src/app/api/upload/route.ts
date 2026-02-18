import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Document } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const youtubeUrl = formData.get("youtube_url") as string | null;
    const spaceId = formData.get("space_id") as string | null;

    let extractedText = "";
    let title = "Untitled Document";
    let docType: Document["type"] = "text";
    let fileSize = 0;
    let pageCount = 0;

    if (file) {
      title = file.name.replace(/\.[^.]+$/, "");
      fileSize = file.size;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith(".pdf")) {
        docType = "pdf";
        pageCount = Math.max(1, Math.floor(file.size / 3000));
        const content = buffer.toString("utf-8");
        const textMatches = content.match(/\(([^)]+)\)|BT[\s\S]*?ET/g);
        if (textMatches) {
          extractedText = textMatches
            .map((m) => m.replace(/[()]/g, "").replace(/BT|ET/g, ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        }
        if (!extractedText || extractedText.length < 50) {
          extractedText = \`[PDF Document: \${title}]\n\nThis PDF has been uploaded and is ready for study. The AI tutor can answer questions about this document's content. In production, full text extraction would use pdf-parse or pdfjs-dist.\n\nDocument: \${title}\nPages: ~\${pageCount}\nSize: \${(file.size / 1024).toFixed(1)} KB\`;
        }
      } else if (file.name.endsWith(".txt")) {
        docType = "text";
        extractedText = buffer.toString("utf-8");
      } else {
        docType = "text";
        extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        if (!extractedText || extractedText.length < 50) {
          extractedText = \`[Document: \${title}] Uploaded for processing.\`;
        }
      }
    } else if (text) {
      extractedText = text;
      title = text.substring(0, 50).trim() + (text.length > 50 ? "..." : "");
      docType = "text";
    } else if (youtubeUrl) {
      title = "YouTube Video";
      docType = "youtube";
      extractedText = \`[YouTube Video]\nURL: \${youtubeUrl}\n\nIn production, the YouTube transcript would be fetched via the YouTube API. The AI tutor can answer questions about this video.\`;
    } else {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const id = "doc-" + store.generateId();
    const doc = store.addDocument({
      id,
      title,
      type: docType,
      text: extractedText,
      fileSize,
      pageCount,
      createdAt: new Date(),
      spaceId: spaceId || undefined,
    });

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      textLength: doc.text.length,
      chunkCount: doc.chunks.length,
      spaceId: spaceId || null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
