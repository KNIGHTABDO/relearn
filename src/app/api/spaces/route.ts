import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const spaces = store.getSpaces();
  return NextResponse.json({
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      color: s.color,
      icon: s.icon,
      documentCount: s.documents.length,
      tags: s.tags,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { name, description, color, icon, tags } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const space = store.createSpace(name, description, color, icon, tags);
  return NextResponse.json(space);
}
