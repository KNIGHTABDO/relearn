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
        try {
          // Use pdf-parse for real text extraction
          const pdfParse = (await import("pdf-parse")).default;
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || "";
          pageCount = pdfData.numpages || 1;

          // Clean up extracted text
          extractedText = extractedText
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\s{2,}/g, " ")
            .trim();

          if (!extractedText || extractedText.length < 20) {
            extractedText = `[PDF Document: ${title}]\n\nThis PDF appears to be image-based or has no extractable text. OCR processing would be needed for text extraction.\n\nPages: ${pageCount}\nSize: ${(file.size / 1024).toFixed(1)} KB`;
          }
        } catch (pdfErr) {
          console.error("PDF parse error:", pdfErr);
          // Fallback: try raw text extraction
          const rawText = buffer.toString("utf-8");
          const textMatches = rawText.match(/\(([^)]+)\)/g);
          if (textMatches && textMatches.length > 5) {
            extractedText = textMatches
              .map((m) => m.replace(/[()]/g, ""))
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
          }
          if (!extractedText || extractedText.length < 50) {
            pageCount = Math.max(1, Math.floor(file.size / 3000));
            extractedText = `[PDF Document: ${title}]\n\nPDF text extraction encountered an error. The document has been uploaded and is available for viewing.\n\nPages: ~${pageCount}\nSize: ${(file.size / 1024).toFixed(1)} KB`;
          }
        }
      } else if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        docType = "text";
        extractedText = buffer.toString("utf-8");
      } else if (file.name.endsWith(".csv")) {
        docType = "text";
        extractedText = buffer.toString("utf-8");
        title = file.name;
      } else {
        // Generic: try to read as text
        docType = "text";
        extractedText = buffer.toString("utf-8")
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!extractedText || extractedText.length < 50) {
          extractedText = `[Document: ${title}]\n\nUploaded file (${(file.size / 1024).toFixed(1)} KB). Content type may not be supported for text extraction.`;
        }
      }
    } else if (text) {
      extractedText = text;
      title = text.substring(0, 50).trim() + (text.length > 50 ? "..." : "");
      docType = "text";
    } else if (youtubeUrl) {
      title = "YouTube Video";
      docType = "youtube";

      // Try to fetch YouTube transcript via oEmbed for title
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
        );
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          if (oembed.title) title = oembed.title;
        }
      } catch {}

      extractedText = `[YouTube Video: ${title}]\nURL: ${youtubeUrl}\n\nVideo uploaded for study. AI features will analyze available information about this video. For full transcript analysis, production would use YouTube Data API v3 transcript endpoint.`;
    } else {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    // Text chunking for RAG
    const chunks = chunkText(extractedText, 800, 100);

    const id = "doc-" + store.generateId();
    const doc = store.addDocument({
      id,
      title,
      type: docType,
      text: extractedText,
      chunks,
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
      pageCount: doc.pageCount,
      spaceId: spaceId || null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  if (!text || text.length <= chunkSize) return text ? [text] : [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 20);
}
