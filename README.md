# ReLearn 🎓

> AI-powered educational platform — a faithful recreation of the YouLearn interface.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- 📄 **Multi-Modal Upload** — Drop PDFs, paste YouTube links, or record lectures
- ✨ **Instant Summaries** — AI-generated structured overviews
- 💬 **AI Tutor Chat** — Ask questions about your documents with RAG
- 🧠 **Smart Flashcards & Quizzes** — Auto-generated study tools
- 🎧 **Podcast & Video Generation** — Transform content into audio/video
- 📝 **Notes & Chapters** — Organized learning materials

## Design

Exact YouLearn-style interface:
- White-first design with colorful pastel accent cards
- Two-panel split: Document viewer (left 60%) + Learning tools (right 40%)
- Hamburger menu sidebar drawer
- Floating action bar on text selection
- "Learn anything" chat input
- Generate cards: Podcast, Video, Summary, Quiz, Flashcards, Notes, Chapters

## Getting Started

```bash
git clone https://github.com/KNIGHTABDO/relearn.git
cd relearn
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Start page
Visit [http://localhost:3000/learn](http://localhost:3000/learn) — Document view

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Inter font, white)
│   ├── page.tsx            # Start page: "What do you want to learn?"
│   ├── learn/page.tsx      # Two-panel document + tools view
│   ├── upload/page.tsx     # File upload drag-drop
│   ├── paste/page.tsx      # YouTube/URL/text paste
│   └── record/page.tsx     # Record lecture
├── components/
│   ├── layout/
│   │   ├── header.tsx      # Minimal header (hamburger + logo + title)
│   │   └── sidebar-drawer.tsx  # Slide-out sidebar
│   └── learn/
│       ├── document-viewer.tsx     # PDF viewer (left panel)
│       ├── learning-panel.tsx      # Generate tools (right panel)
│       └── floating-action-bar.tsx # Text selection actions
└── lib/
    └── utils.ts
```

## Development Roadmap

- [x] Step 1: Scaffolding & Design System (YouLearn-exact)
- [ ] Step 2: Upload Dashboard (functional react-dropzone)
- [ ] Step 3: Document Processing Logic
- [ ] Step 4: AI Tutor Chat Interface
- [ ] Step 5: Study Tools UI
