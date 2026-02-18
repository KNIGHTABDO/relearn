# ReLearn 🎓

> AI-powered educational platform that transforms study materials into interactive learning experiences.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- 📄 **Multi-Modal Upload** — Drop PDFs, paste text, or add YouTube links
- ✨ **Instant Summaries** — AI-generated structured overviews with key definitions
- 💬 **AI Tutor Chat (RAG)** — Ask questions about your documents with source citations
- 🧠 **Smart Flashcards & Quizzes** — Auto-generated study tools for active recall

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI + Radix UI
- **Icons**: Lucide React
- **Database**: Supabase
- **AI**: OpenAI API + Vercel AI SDK
- **Design**: Vercel-inspired minimalist aesthetic

## Getting Started

```bash
# Clone the repository
git clone https://github.com/KNIGHTABDO/relearn.git
cd relearn

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with theme
│   ├── page.tsx            # Dashboard
│   ├── upload/             # Upload workspace
│   ├── chat/               # AI tutor chat
│   └── study/              # Flashcards & quizzes
├── components/
│   ├── layout/             # Sidebar, Header, AppShell
│   └── ui/                 # Shadcn UI components
└── lib/                    # Utilities
```

## Development Roadmap

- [x] Step 1: Scaffolding & Design System
- [ ] Step 2: Upload Dashboard
- [ ] Step 3: Document Processing Logic
- [ ] Step 4: AI Tutor Chat Interface
- [ ] Step 5: Study Tools UI

---

Built with ❤️ using Next.js, Tailwind CSS, and AI.
