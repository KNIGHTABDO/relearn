// Unified data access layer — works in Desktop (SQLite) and Web (API) modes
import * as db from './database';

export { isDesktopMode } from './database';

export interface SpaceInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  updatedAt: string;
  tags: string[];
}

export async function fetchSpaces(): Promise<SpaceInfo[]> {
  if (db.isDesktopMode()) {
    const spaces = await db.getSpaces();
    const results: SpaceInfo[] = [];
    for (const s of spaces) {
      const docs = await db.getDocuments(s.id);
      results.push({
        id: s.id,
        name: s.name,
        description: s.description || '',
        color: (s as any).color || '#3B82F6',
        icon: (s as any).icon || '\u{1f4da}',
        documentCount: docs.length,
        updatedAt: (s as any).updated_at || (s as any).created_at || new Date().toISOString(),
        tags: [],
      });
    }
    return results;
  }
  try {
    const res = await fetch('/api/spaces');
    if (!res.ok) return [];
    const data = await res.json();
    return data.spaces || [];
  } catch {
    return [];
  }
}

export async function createSpaceAction(name: string): Promise<SpaceInfo | null> {
  const colors = ['#10B981', '#3B82F6', '#A855F7', '#F43F5E', '#F97316', '#EAB308'];
  const icons = ['\u{1f4da}', '\u{1f9ec}', '\u{1f4bb}', '\u{1f9e0}', '\u{1f4d0}', '\u{1f3a8}', '\u26a1', '\u{1f30d}'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  if (db.isDesktopMode()) {
    await db.saveSpace({
      id,
      name,
      description: '',
      color,
      icon,
      created_at: now,
      updated_at: now,
      tags: '[]',
    } as any);
    return { id, name, description: '', color, icon, documentCount: 0, updatedAt: now, tags: [] };
  }
  try {
    const res = await fetch('/api/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, icon }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function uploadTextAction(text: string): Promise<string | null> {
  if (db.isDesktopMode()) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.saveDocument({
      id,
      title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      type: 'text',
      text,
      chunks: [],
      file_size: text.length,
      page_count: 1,
      created_at: now,
    } as any);
    return id;
  }
  try {
    const formData = new FormData();
    formData.append('text', text);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch {
    return null;
  }
}
