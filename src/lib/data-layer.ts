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
    return spaces.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      color: s.color || '#3B82F6',
      icon: s.icon || '\u{1f4da}',
      documentCount: s.documents?.length || 0,
      updatedAt: s.updatedAt?.toISOString?.() || new Date().toISOString(),
      tags: s.tags || [],
    }));
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
    const nowDate = new Date(now);
    await db.saveSpace({
      id,
      name,
      description: '',
      color,
      icon,
      documents: [],
      createdAt: nowDate,
      updatedAt: nowDate,
      tags: [],
    });
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

export async function getSpaceById(id: string): Promise<SpaceInfo | null> {
  if (db.isDesktopMode()) {
    const space = await db.getSpace(id);
    if (!space) return null;
    return {
      id: space.id,
      name: space.name,
      description: space.description || '',
      color: space.color || '#3B82F6',
      icon: space.icon || '📚',
      documentCount: space.documents?.length || 0,
      updatedAt: space.updatedAt?.toISOString?.() || new Date().toISOString(),
      tags: space.tags || [],
    };
  }
  try {
    const res = await fetch(`/api/spaces/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface DocumentInfo {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  spaceId?: string;
}

export async function getDocumentsBySpace(spaceId: string): Promise<DocumentInfo[]> {
  if (db.isDesktopMode()) {
    const docs = await db.getDocumentsBySpace(spaceId);
    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      spaceId: d.spaceId,
    }));
  }
  try {
    const res = await fetch(`/api/spaces/${spaceId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch {
    return [];
  }
}

export async function deleteSpaceAction(id: string): Promise<boolean> {
  if (db.isDesktopMode()) {
    await db.deleteSpace(id);
    return true;
  }
  try {
    const res = await fetch(`/api/spaces/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteDocumentAction(id: string): Promise<boolean> {
  if (db.isDesktopMode()) {
    await db.deleteDocument(id);
    return true;
  }
  try {
    const res = await fetch(`/api/document/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface FullDocument {
  id: string;
  title: string;
  type: string;
  text: string;
  chunks: string[];
  fileSize: number;
  pageCount: number;
  url?: string;
  fileData?: string;
  createdAt: string;
  spaceId?: string;
}

export async function getDocumentById(id: string): Promise<FullDocument | null> {
  if (db.isDesktopMode()) {
    const doc = await db.getDocument(id);
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      text: doc.text,
      chunks: doc.chunks || [],
      fileSize: doc.fileSize || 0,
      pageCount: doc.pageCount || 0,
      url: doc.url,
      fileData: doc.fileData,
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      spaceId: doc.spaceId,
    };
  }
  try {
    const res = await fetch(`/api/document/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDocumentPdfData(id: string): Promise<string | null> {
  if (db.isDesktopMode()) {
    const doc = await db.getDocument(id);
    return doc?.fileData || null;
  }
  try {
    const res = await fetch(`/api/document/${id}/pdf`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || null);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function uploadFileAction(
  file: File,
  spaceId?: string
): Promise<{ id: string; title: string; type: string } | null> {
  if (db.isDesktopMode()) {
    const id = crypto.randomUUID();
    const now = new Date();
    const title = file.name.replace(/\.[^.]+$/, '');
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let base64Data = '';
    // Convert to base64 in chunks to avoid call stack issues
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const slice = uint8.subarray(i, i + chunkSize);
      base64Data += String.fromCharCode(...slice);
    }
    base64Data = btoa(base64Data);

    let extractedText = '';
    let pageCount = 1;
    let docType: 'pdf' | 'text' = 'text';
    let fileData: string | undefined;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      docType = 'pdf';
      fileData = base64Data;
      try {
        // Use pdfjs-dist for client-side PDF text extraction
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdf.numPages;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          pages.push(pageText);
        }
        extractedText = pages.join('\n\n').replace(/\s{2,}/g, ' ').trim();
        if (!extractedText || extractedText.length < 20) {
          extractedText = `[PDF Document: ${title}]\n\nImage-based PDF — no extractable text.\nPages: ${pageCount}\nSize: ${(file.size / 1024).toFixed(1)} KB`;
        }
      } catch (pdfErr) {
        console.error('[Upload] PDF parse error:', pdfErr);
        pageCount = Math.max(1, Math.floor(file.size / 3000));
        extractedText = `[PDF Document: ${title}]\n\nPDF parsing error.\nPages: ~${pageCount}\nSize: ${(file.size / 1024).toFixed(1)} KB`;
      }
    } else {
      // Text file
      extractedText = await file.text();
    }

    const chunks = chunkText(extractedText, 800, 100);

    await db.saveDocument({
      id,
      title,
      type: docType,
      text: extractedText,
      chunks,
      fileSize: file.size,
      pageCount,
      url: undefined,
      fileData,
      createdAt: now,
      spaceId: spaceId || undefined,
    } as any);

    return { id, title, type: docType };
  }

  // Web mode: use the API route
  const formData = new FormData();
  formData.append('file', file);
  if (spaceId) formData.append('space_id', spaceId);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function uploadYouTubeAction(youtubeUrl: string, spaceId?: string): Promise<string | null> {
  const id = crypto.randomUUID();
  const now = new Date();

  // Extract video ID for title
  const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';
  const title = `YouTube Video (${videoId})`;

  if (db.isDesktopMode()) {
    await db.saveDocument({
      id,
      title,
      type: 'youtube',
      text: `YouTube URL: ${youtubeUrl}`,
      chunks: [],
      fileSize: 0,
      pageCount: 0,
      url: youtubeUrl,
      createdAt: now,
      spaceId: spaceId || undefined,
    } as any);
    return id;
  }

  // Web mode: use API route
  const formData = new FormData();
  formData.append('youtube_url', youtubeUrl);
  if (spaceId) formData.append('space_id', spaceId);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch {
    return null;
  }
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  if (!text || text.length <= chunkSize) return text ? [text] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize * 0.5) end = breakPoint + 1;
    }
    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
  }
  return chunks.filter((c) => c.length > 20);
}
