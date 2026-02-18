import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const doc = store.getDocument(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    text: doc.text,
    fileSize: doc.fileSize,
    pageCount: doc.pageCount,
    chunkCount: doc.chunks.length,
    spaceId: doc.spaceId,
    url: doc.url,
    createdAt: doc.createdAt,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = store.removeDocument(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
