import { NextRequest, NextResponse } from "next/server";

// In-memory document store (replace with Supabase in production)
const documentStore = new Map<
  string,
  { id: string; title: string; text: string; chunks: string[]; createdAt: Date }
>();

// Make store accessible globally for other routes
(globalThis as any).__documentStore = documentStore;

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const youtubeUrl = formData.get("youtube_url") as string | null;

    let extractedText = "";
    let title = "Untitled Document";

    if (file) {
      title = file.name.replace(/\.[^.]+$/, "");
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith(".txt")) {
        extractedText = buffer.toString("utf-8");
      } else if (file.name.endsWith(".pdf")) {
        // Basic PDF text extraction
        // In production, use pdf-parse or similar library
        const content = buffer.toString("utf-8");
        // Try to extract readable text from PDF
        const textMatches = content.match(
          /\(([^)]+)\)|BT[\s\S]*?ET/g
        );
        if (textMatches) {
          extractedText = textMatches
            .map((m) => m.replace(/[()]/g, "").replace(/BT|ET/g, ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        }
        // If extraction fails, use placeholder with file info
        if (!extractedText || extractedText.length < 50) {
          extractedText = \`[PDF Document: \${title}]\n\nThis PDF document has been uploaded successfully. In production, a proper PDF parser (like pdf-parse or pdfjs-dist) would extract the full text content.\n\nFor demonstration purposes, you can ask questions about this document and the AI tutor will respond based on the available context.\n\nDocument: \${title}\nSize: \${(file.size / 1024).toFixed(1)} KB\nType: \${file.type}\`;
        }
      } else {
        // DOC/DOCX - basic handling
        extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        if (!extractedText || extractedText.length < 50) {
          extractedText = \`[Document: \${title}]\n\nThis document has been uploaded for processing. Full text extraction will be available with proper document parsing libraries.\`;
        }
      }
    } else if (text) {
      extractedText = text;
      title = text.substring(0, 50).trim() + (text.length > 50 ? "..." : "");
    } else if (youtubeUrl) {
      title = "YouTube Video";
      extractedText = \`[YouTube Video]\n\nURL: \${youtubeUrl}\n\nIn production, the YouTube transcript would be fetched using the YouTube API or a transcript extraction service. The AI tutor would then be able to answer questions about the video content.\`;
    } else {
      return NextResponse.json(
        { error: "No file, text, or YouTube URL provided" },
        { status: 400 }
      );
    }

    const id = generateId();
    const chunks = chunkText(extractedText);

    documentStore.set(id, {
      id,
      title,
      text: extractedText,
      chunks,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id,
      title,
      textLength: extractedText.length,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
