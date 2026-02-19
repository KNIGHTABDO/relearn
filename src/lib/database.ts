// SQLite Database Layer for Tauri Desktop App
// Uses tauri-plugin-sql to persist all data locally

import type { Space, Document, ChatMessage, FlashcardSet, PracticeExam } from "./types";

let db: any = null;

/**
 * Initialize the SQLite database. Call once at app startup.
 * In browser mode (dev without Tauri), falls back to in-memory store.
 */
export async function initDatabase(): Promise<void> {
  // Only use SQLite inside Tauri
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    try {
      const SQL = await import("@tauri-apps/plugin-sql");
      db = await SQL.default.load("sqlite:relearn.db");
      await createTables();
      console.log("[DB] SQLite initialized");
    } catch (err) {
      console.error("[DB] Failed to init SQLite:", err);
      db = null;
    }
  } else {
    console.log("[DB] Running in browser mode — using API routes");
  }
}

export function isDesktopMode(): boolean {
  return db !== null;
}

async function createTables(): Promise<void> {
  if (!db) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#3B82F6',
      icon TEXT DEFAULT '📚',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT DEFAULT '[]'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      text TEXT DEFAULT '',
      chunks TEXT DEFAULT '[]',
      file_size INTEGER DEFAULT 0,
      page_count INTEGER DEFAULT 0,
      url TEXT,
      file_data TEXT,
      created_at TEXT NOT NULL,
      space_id TEXT,
      FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      space_id TEXT,
      document_id TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS flashcard_sets (
      id TEXT PRIMARY KEY,
      cards TEXT NOT NULL DEFAULT '[]',
      document_id TEXT,
      space_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS practice_exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      questions TEXT NOT NULL DEFAULT '[]',
      space_id TEXT NOT NULL,
      time_limit INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      provider TEXT PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      token_expiry INTEGER,
      email TEXT,
      name TEXT,
      picture TEXT,
      extra TEXT DEFAULT '{}'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS generated_media (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data BLOB NOT NULL,
      prompt TEXT,
      document_id TEXT,
      space_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS spaced_repetition (
      card_id TEXT PRIMARY KEY,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review TEXT NOT NULL,
      last_review TEXT
    )
  `);
}

// =========================
// SPACES
// =========================


// ─── Flashcard Sets ─────────────────────────────────
export async function getFlashcardSet(documentId?: string, spaceId?: string): Promise<import("./types").FlashcardSet | null> {
  try {
    let rows: any[];
    if (documentId) {
      rows = await db.select("SELECT * FROM flashcard_sets WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1", [documentId]);
    } else if (spaceId) {
      rows = await db.select("SELECT * FROM flashcard_sets WHERE space_id = $1 AND document_id IS NULL ORDER BY created_at DESC LIMIT 1", [spaceId]);
    } else {
      return null;
    }
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      cards: JSON.parse(row.cards || "[]"),
      documentId: row.document_id || undefined,
      spaceId: row.space_id || undefined,
    };
  } catch {
    return null;
  }
}

export async function saveFlashcardSet(set: import("./types").FlashcardSet): Promise<void> {
  await db.execute(
    `INSERT OR REPLACE INTO flashcard_sets (id, cards, document_id, space_id, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [set.id, JSON.stringify(set.cards), set.documentId || null, set.spaceId || null, new Date().toISOString()]
  );
}

export async function deleteFlashcardSet(id: string): Promise<void> {
  await db.execute("DELETE FROM flashcard_sets WHERE id = $1", [id]);
}

export async function getSpaces(): Promise<Space[]> {
  if (!db) return [];
  const rows: any[] = await db.select("SELECT * FROM spaces ORDER BY updated_at DESC");
  return rows.map(rowToSpace);
}

export async function getSpace(id: string): Promise<Space | null> {
  if (!db) return null;
  const rows: any[] = await db.select("SELECT * FROM spaces WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const space = rowToSpace(rows[0]);
  space.documents = await getDocumentsBySpace(id);
  return space;
}

export async function saveSpace(space: Space): Promise<void> {
  if (!db) return;
  await db.execute(
    `INSERT OR REPLACE INTO spaces (id, name, description, color, icon, created_at, updated_at, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [space.id, space.name, space.description || "", space.color, space.icon,
     space.createdAt.toISOString(), space.updatedAt.toISOString(), JSON.stringify(space.tags)]
  );
}

export async function deleteSpace(id: string): Promise<void> {
  if (!db) return;
  await db.execute("DELETE FROM spaces WHERE id = $1", [id]);
}

function rowToSpace(row: any): Space {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    documents: [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags: JSON.parse(row.tags || "[]"),
  };
}

// =========================
// DOCUMENTS
// =========================

export async function getDocuments(): Promise<Document[]> {
  if (!db) return [];
  const rows: any[] = await db.select("SELECT * FROM documents ORDER BY created_at DESC");
  return rows.map(rowToDocument);
}

export async function getDocument(id: string): Promise<Document | null> {
  if (!db) return null;
  const rows: any[] = await db.select("SELECT * FROM documents WHERE id = $1", [id]);
  return rows.length > 0 ? rowToDocument(rows[0]) : null;
}

export async function getDocumentsBySpace(spaceId: string): Promise<Document[]> {
  if (!db) return [];
  const rows: any[] = await db.select(
    "SELECT * FROM documents WHERE space_id = $1 ORDER BY created_at DESC", [spaceId]
  );
  return rows.map(rowToDocument);
}

export async function saveDocument(doc: Document): Promise<void> {
  if (!db) return;
  await db.execute(
    `INSERT OR REPLACE INTO documents (id, title, type, text, chunks, file_size, page_count, url, file_data, created_at, space_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [doc.id, doc.title, doc.type, doc.text, JSON.stringify(doc.chunks),
     doc.fileSize || 0, doc.pageCount || 0, doc.url || null, doc.fileData || null,
     doc.createdAt.toISOString(), doc.spaceId || null]
  );
}

export async function deleteDocument(id: string): Promise<void> {
  if (!db) return;
  await db.execute("DELETE FROM documents WHERE id = $1", [id]);
}

function rowToDocument(row: any): Document {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    text: row.text,
    chunks: JSON.parse(row.chunks || "[]"),
    fileSize: row.file_size,
    pageCount: row.page_count,
    url: row.url,
    fileData: row.file_data,
    createdAt: new Date(row.created_at),
    spaceId: row.space_id,
  };
}

// =========================
// AUTH TOKENS
// =========================

export async function getAuthToken(provider: "google" | "github"): Promise<any | null> {
  if (!db) return null;
  const rows: any[] = await db.select("SELECT * FROM auth_tokens WHERE provider = $1", [provider]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    extra: JSON.parse(row.extra || "{}"),
  };
}

export async function saveAuthToken(provider: "google" | "github", data: any): Promise<void> {
  if (!db) return;
  await db.execute(
    `INSERT OR REPLACE INTO auth_tokens (provider, access_token, refresh_token, token_expiry, email, name, picture, extra)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [provider, data.access_token || "", data.refresh_token || "", data.token_expiry || 0,
     data.email || "", data.name || "", data.picture || "", JSON.stringify(data.extra || {})]
  );
}

export async function clearAuthToken(provider: "google" | "github"): Promise<void> {
  if (!db) return;
  await db.execute("DELETE FROM auth_tokens WHERE provider = $1", [provider]);
}

// =========================
// SETTINGS
// =========================

export async function getSetting(key: string): Promise<string | null> {
  if (!db) return null;
  const rows: any[] = await db.select("SELECT value FROM settings WHERE key = $1", [key]);
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (!db) return;
  await db.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)",
    [key, value]
  );
}

// =========================
// CHAT MESSAGES
// =========================

export async function getChatMessages(spaceId?: string, documentId?: string): Promise<ChatMessage[]> {
  if (!db) return [];
  let query = "SELECT * FROM chat_messages WHERE 1=1";
  const params: any[] = [];
  if (spaceId) { query += " AND space_id = $" + (params.length + 1); params.push(spaceId); }
  if (documentId) { query += " AND document_id = $" + (params.length + 1); params.push(documentId); }
  query += " ORDER BY timestamp ASC";
  const rows: any[] = await db.select(query, params);
  return rows.map((r: any) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    timestamp: new Date(r.timestamp),
  }));
}

export async function saveChatMessage(msg: ChatMessage, spaceId?: string, documentId?: string): Promise<void> {
  if (!db) return;
  await db.execute(
    `INSERT INTO chat_messages (id, role, content, timestamp, space_id, document_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [msg.id, msg.role, msg.content, msg.timestamp.toISOString(), spaceId || null, documentId || null]
  );
}

// =========================
// GENERATED MEDIA (images, videos)
// =========================

export async function saveMedia(id: string, type: string, mimeType: string, data: string, prompt?: string, docId?: string, spaceId?: string): Promise<void> {
  if (!db) return;
  await db.execute(
    `INSERT OR REPLACE INTO generated_media (id, type, mime_type, data, prompt, document_id, space_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, type, mimeType, data, prompt || "", docId || null, spaceId || null, new Date().toISOString()]
  );
}

export async function getMedia(id: string): Promise<any | null> {
  if (!db) return null;
  const rows: any[] = await db.select("SELECT * FROM generated_media WHERE id = $1", [id]);
  return rows.length > 0 ? rows[0] : null;
}
