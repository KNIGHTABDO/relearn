# ReLearn 🎓

> AI-powered educational platform — a faithful recreation of the YouLearn interface.
> Transform your study materials into interactive learning experiences.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- 📄 **Multi-Modal Upload** — Drag-drop PDFs, paste YouTube links, or input raw text
- ✨ **Instant Summaries** — AI-generated structured overviews with key definitions
- 💬 **AI Tutor Chat (RAG)** — Ask questions with streaming responses and source citations
- 🧠 **Smart Flashcards** — Auto-generated flip cards with progress tracking
- 📝 **Interactive Quizzes** — Multiple-choice questions with explanations and scoring
- 🎧 **Podcast & Video** — Content generation cards (UI ready)
- 📖 **Notes & Chapters** — Organized learning materials

## Design

Exact YouLearn-style interface:
- **White-first design** with colorful pastel accent cards
- **Two-panel split**: Document viewer (left ~60%) + Learning tools (right ~40%)
- **Hamburger menu** sidebar drawer
- **Floating action bar** on text selection (Explain, Chat, Quiz, Flashcards, Add to notes, Read aloud)
- **"Learn anything"** chat input with Voice button
- **Generate cards**: Podcast, Video, Summary, Quiz, Flashcards, Notes, Chapters
- **Pill-shaped buttons** throughout
- **Inter font**, minimal borders, no dark mode

## Getting Started

```bash
# Clone
git clone https://github.com/KNIGHTABDO/relearn.git
cd relearn

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Start page — "What do you want to learn?" with Upload/Paste/Record cards |
| `/upload` | Drag-and-drop file upload with progress tracking |
| `/paste` | YouTube URL / website / raw text input |
| `/record` | Record lecture placeholder |
| `/learn?id=...` | Two-panel learning view (document + tools) |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/upload` | POST | Upload file, text, or YouTube URL → returns document ID |
| `/api/document/[id]` | GET | Get document metadata and extracted text |
| `/api/chat` | POST | Streaming AI chat with RAG context from document |
| `/api/generate` | POST | Generate flashcards or quiz questions from document |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Inter font, white bg)
│   ├── globals.css             # White-first, pill buttons, YouLearn palette
│   ├── page.tsx                # Start: "What do you want to learn?"
│   ├── learn/page.tsx          # Two-panel: doc viewer + learning tools
│   ├── upload/page.tsx         # Drag-drop upload with react-dropzone
│   ├── paste/page.tsx          # YouTube/URL/text paste
│   ├── record/page.tsx         # Record lecture
│   └── api/
│       ├── upload/route.ts     # File processing & text extraction
│       ├── document/[id]/route.ts  # Document retrieval
│       ├── chat/route.ts       # Streaming AI chat with RAG
│       └── generate/route.ts   # Flashcard & quiz generation
├── components/
│   ├── layout/
│   │   ├── header.tsx          # Minimal header (hamburger + logo + title)
│   │   └── sidebar-drawer.tsx  # Slide-out hamburger menu
│   └── learn/
│       ├── document-viewer.tsx     # PDF viewer (left panel)
│       ├── learning-panel.tsx      # Generate tools hub (right panel)
│       ├── floating-action-bar.tsx # Text selection actions
│       ├── chat-panel.tsx          # Streaming AI chat interface
│       ├── flashcard-viewer.tsx    # Flip cards with progress
│       └── quiz-viewer.tsx         # MCQ quiz with scoring
└── lib/
    └── utils.ts
```

## Development Roadmap

- [x] Step 1: Scaffolding & Design System (YouLearn-exact)
- [x] Step 2: Upload Dashboard (react-dropzone, progress tracking)
- [x] Step 3: Document Processing Logic (API routes, text extraction, chunking)
- [x] Step 4: AI Tutor Chat Interface (streaming responses, RAG context)
- [x] Step 5: Study Tools UI (flashcards with flip animation, quizzes with scoring)

## Production Notes

To make this production-ready, wire up:
- **OpenAI/Anthropic API** + Vercel AI SDK for real AI responses
- **pdf-parse** or **pdfjs-dist** for proper PDF text extraction
- **Supabase** for persistent document storage
- **YouTube Transcript API** for video content extraction
- **Vector embeddings** (OpenAI) + **pgvector** for proper RAG

---

Built with ❤️ using Next.js, Tailwind CSS, and AI.
