import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";
  if (!q) return NextResponse.json({ spaces: [], documents: [] });

  const spaces = store.getSpaces().filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
  );

  const documents = store.getAllDocuments().filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.text.toLowerCase().includes(q)
  );

  return NextResponse.json({
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      color: s.color,
      documentCount: s.documents.length,
    })),
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      spaceId: d.spaceId,
      preview: d.text.substring(0, 120) + "...",
    })),
  });
}
