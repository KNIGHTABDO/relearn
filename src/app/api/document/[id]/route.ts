import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = (globalThis as any).__documentStore as Map<string, any>;
  if (!store) {
    return NextResponse.json({ error: "Store not initialized" }, { status: 500 });
  }

  const doc = store.get(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    text: doc.text,
    chunkCount: doc.chunks.length,
    textLength: doc.text.length,
    createdAt: doc.createdAt,
  });
}
