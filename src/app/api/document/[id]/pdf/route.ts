import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const doc = store.getDocument(params.id);
  if (!doc || !doc.fileData) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const buffer = Buffer.from(doc.fileData, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.title}.pdf"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
