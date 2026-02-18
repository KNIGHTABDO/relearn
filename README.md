# ReLearn 🎓

> AI-powered educational platform — a faithful YouLearn clone.
> Organize courses into Spaces, upload materials, chat with AI, generate study tools.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

### 📂 Spaces System
- Create Spaces to organize content by course, subject, or project
- Add multiple files (PDFs, text, YouTube links) to each space
- Chat with ALL documents in a space at once (cross-document RAG)
- Generate practice exams covering the entire space
- Tag and search across spaces

### 📄 Multi-Format Upload
- Drag-and-drop file upload with progress tracking
- Paste YouTube URLs, website text, or raw content
- Upload directly into a specific space
- Supports PDF, DOC, DOCX, TXT (up to 50MB)

### ✨ AI Study Tools (Right Panel)
- **📝 Summary** — AI-generated structured notes with key points and sections
- **🎧 Podcast** — Audio podcast generation UI with player
- **🎬 Video** — AI video generation (Beta badge)
- **❓ Quiz** — Multiple-choice questions with explanations and scoring
- **🧰 Flashcards** — Flip cards with progress tracking, shuffle, got-it/still-learning
- **📝 Notes** — Organized concept outlines with highlights
- **📖 Chapters** — Document broken into navigable chapters

### 🧠 AI Tutor Chat
- Streaming word-by-word responses
- Document-level chat (single file context)
- Space-level chat (all files in space as context)
- Voice button UI
- Copy responses

### 📋 Practice Exams
- Full exam simulation with timer
- Questions pulled from ALL documents in a space
- Pre-exam screen showing documents covered
- Answer explanations with source attribution
- Score tracking and retake option

### 🏠 Library Dashboard
- Home page with Upload/Paste/Record cards
- "Learn anything..." search input
- Spaces grid with document counts, tags, and timestamps
- Create new spaces inline
- Sidebar with Home, Search, History, and all Spaces listed

## Design

Exact YouLearn-style interface:
- **White-first design** with colorful pastel accent cards
- **Two-panel split**: Document viewer (left ~60%) + Learning tools (right ~40%)
- **Hamburger menu** sidebar drawer with Spaces list
- **Floating action bar** on text selection
- **Pill-shaped buttons** throughout
- **Inter font**, minimal borders, no dark mode

## Getting Started

```bash
git clone https://github.com/KNIGHTABDO/relearn.git
cd relearn
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home/Library — Spaces grid + Upload/Paste/Record cards |
| `/space/[id]` | Space detail — documents list + space actions |
| `/learn?id=...` | Document learning view (two-panel) |
| `/learn?spaceId=...` | Space-level chat (all docs as context) |
| `/exam?spaceId=...` | Practice exam from entire space |
| `/upload` | File upload (optional `?spaceId=...`) |
| `/paste` | YouTube/URL/text paste |
| `/record` | Record lecture |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/spaces` | GET/POST | List all spaces / Create new space |
| `/api/spaces/[id]` | GET/PATCH/DELETE | Space CRUD with documents |
| `/api/upload` | POST | Upload file with optional `space_id` |
| `/api/document/[id]` | GET/DELETE | Document operations |
| `/api/chat` | POST | Streaming AI chat (doc-level or space-level) |
| `/api/generate` | POST | Generate summary/flashcards/quiz/notes/chapters |
| `/api/exam` | POST | Generate practice exam from entire space |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Home/Library dashboard
│   ├── space/[id]/page.tsx      # Space detail with docs
│   ├── learn/page.tsx           # Two-panel learning view
│   ├── exam/page.tsx            # Practice exam with timer
│   ├── upload/page.tsx          # File upload (space-aware)
│   ├── paste/page.tsx           # URL/text paste
│   ├── record/page.tsx          # Record lecture
│   └── api/
│       ├── spaces/             # Spaces CRUD
│       ├── upload/             # File processing
│       ├── document/[id]/      # Document ops
│       ├── chat/               # Streaming AI chat
│       ├── generate/           # Study tools generation
│       └── exam/               # Practice exam generation
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   └── sidebar-drawer.tsx  # With Spaces list
│   └── learn/
│       ├── document-viewer.tsx
│       ├── learning-panel.tsx  # All study tool views
│       ├── chat-panel.tsx      # Space-aware chat
│       ├── flashcard-viewer.tsx
│       ├── quiz-viewer.tsx
│       └── floating-action-bar.tsx
└── lib/
    ├── types.ts               # Shared TypeScript types
    ├── store.ts               # In-memory data store
    └── utils.ts
```

## Production Notes

To make this production-ready:
- **OpenAI/Anthropic** + Vercel AI SDK for real AI responses
- **pdf-parse** / **pdfjs-dist** for proper PDF extraction
- **Supabase** for persistent storage (already structured)
- **YouTube Transcript API** for video content
- **Vector embeddings** + **pgvector** for real RAG
- **Web Speech API** for voice mode
- **TTS API** for podcast/read-aloud generation

---

Built with ❤️ inspired by [YouLearn.ai](https://youlearn.ai)
