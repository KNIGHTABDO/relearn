import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const space = store.getSpace(params.id);
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...space,
    documents: space.documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      fileSize: d.fileSize,
      pageCount: d.pageCount,
      createdAt: d.createdAt,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = await request.json();
  const space = store.updateSpace(params.id, updates);
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }
  return NextResponse.json(space);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = store.deleteSpace(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
