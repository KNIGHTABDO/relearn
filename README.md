# ReLearn — AI-Powered Desktop Study Platform

> Turn any study material into an interactive learning experience. Upload a PDF, paste a YouTube link, or record a lecture — ReLearn's AI builds flashcards, quizzes, study plans, mind maps, and podcasts from it. Everything runs locally on your machine.

![ReLearn Hero](public/images/hero.jpg)

[![GitHub Release](https://img.shields.io/github/v/release/KNIGHTABDO/relearn?style=flat-square&color=7c3aed)](https://github.com/KNIGHTABDO/relearn/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](https://github.com/KNIGHTABDO/relearn/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Website](https://img.shields.io/badge/website-relearn--website--kappa.vercel.app-purple?style=flat-square)](https://relearn-website-kappa.vercel.app)

---

## 📥 Download

| Platform | File | Notes |
|----------|------|-------|
| Windows | `.msi` installer | Recommended — includes WebView2 bootstrap |
| macOS (Apple Silicon) | `.dmg` (aarch64) | For M1/M2/M3 Macs |
| macOS (Intel) | `.dmg` (x86_64) | For Intel Macs |
| Linux | `.AppImage` / `.deb` / `.rpm` | No install needed for AppImage |

👉 **[Download latest release →](https://github.com/KNIGHTABDO/relearn/releases/latest)**

---

## ✨ What's Inside

### 📚 Spaces System
Organize your courses into Spaces — each Space holds multiple documents and has its own AI chat, flashcard sets, practice exams, and study plans. All data is stored locally in SQLite.

### 📄 File Support
Upload almost anything:
- **PDF** — real page rendering with react-pdf (selectable text, zoom, scroll)
- **DOCX / DOC** — text extraction via mammoth.js
- **PPTX / PPT** — slide extraction via JSZip + DrawingML parsing
- **Images** (PNG, JPG, WebP) — AI vision OCR via Gemini
- **YouTube URLs** — embedded player + automatic transcript extraction (Innertube API, no API key)
- **Plain text / web paste** — paste any article, notes, or web content
- **Audio recording** — record lectures directly in the app with waveform visualization

### 💬 AI Chat
RAG-powered chat grounded in your documents:
- Full markdown rendering (bold, lists, code, headings)
- `[Page X]` and `[00:34]` references rendered as clickable buttons that jump to the exact position in the document
- **Add Context** — attach multiple documents to a single chat session
- Streaming responses with live spinner
- AI always cites page numbers

### 🃏 Flashcards
- AI-generated from any document
- Fully editable — Add, Edit, Delete individual cards
- SQLite cache — instant reload on revisit (no re-generation needed)
- Keyboard shortcuts: `Space` to flip, `←` / `→` to navigate
- Copy All to clipboard (Q:/A: format for Anki export)
- **Spaced Repetition (SM-2)** — cards adapt to your memory; reviews scheduled automatically

### ❓ Practice Quiz
AI-generated multiple-choice questions with explanations. Full practice exam mode from an entire Space (timed, scored, with per-question explanations).

### 🎙️ AI Podcast
Upload any document → get a two-host audio podcast. Alex (the explainer) and Sam (the curious student) discuss your material in a natural conversation. Auto-scrolling timestamped transcript. Speed control.

### 🗣️ Voice Tutor
Speak to your AI tutor. Press mic → ask question → hear the AI respond with voice synthesis. Continuous mode keeps the dialogue flowing without pressing mic repeatedly.

### 📅 AI Study Planner
Analyzes your weak topics and generates a personalized weekly study schedule. Color-coded daily blocks, estimated time to mastery, focus areas.

### 📊 Analytics Dashboard
Track your progress:
- Quiz score history (animated bar chart)
- Topic strength radar chart
- GitHub-style activity heatmap
- Study streak, total cards reviewed, mastery percentage

### 🗺️ Mind Map / Infographic
Turns your notes into an interactive visual mind map. CSS-animated nodes with SVG bezier connections.

### 📝 Study Report
Generates a comprehensive study guide: key concepts, formulas, summaries, practice questions, and source citations — ready to print or export.

### 🧠 Snap a Problem
Take a photo or upload an image of any math/science problem → AI extracts the problem and delivers a step-by-step solution with similar practice questions.

### 🔍 Full-Text Search
Search across all your Spaces and documents from the sidebar — wired to SQLite LIKE queries across titles, content, and space names.

### ⌨️ Command Palette
Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) from anywhere in the app to search commands and spaces instantly.

### 🆕 Onboarding Wizard
First-launch 3-step wizard shows you how to add material, what the AI tools can do, and productivity tips (including Cmd+K).

### 🌙 Dark Mode
Full Light / Dark / System theme. Zero flash — applied before React hydrates via inline `<script>` in `<head>`.

### 🌐 10 Languages
English, Spanish, French, Arabic, German, Chinese, Japanese, Korean, Portuguese, Hindi. The entire UI is fully translated. AI also responds in your selected language.

### 🔒 100% Local
All documents and AI-generated content are stored in SQLite on your machine. Nothing is uploaded to any server.

---

## 🤖 AI Setup

ReLearn supports two AI providers. You only need one.

### Option 1 — Google AI Pro (Recommended for Students)
If you have a [Google AI Pro](https://one.google.com/about/plans) subscription (many universities offer this free):
1. Open Settings → AI Providers → Connect Google
2. Sign in with your Google account in the browser that opens
3. AI Pro benefits (Gemini 2.0 Flash, 2.5 Pro access) flow automatically

> Uses the same authentication method as Gemini CLI and Google Cloud Code — your subscription benefits carry over with zero GCP setup.

### Option 2 — Gemini API Key (Free tier available)
1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Open Settings → AI Providers → paste your key

### Option 3 — GitHub Copilot
If you have a GitHub Copilot subscription (included free with [GitHub Student Developer Pack](https://education.github.com/pack)):
1. Open Settings → AI Providers → Connect GitHub
2. A device code appears — enter it at [github.com/login/device](https://github.com/login/device)
3. All Copilot models (GPT-4o, o1, Claude, etc.) become available

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | [Tauri v2](https://tauri.app) (Rust + WebView2/WebKit) |
| Frontend framework | Next.js 14 (App Router, static export) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 + Radix UI |
| Icons | Lucide React |
| Database | SQLite via `tauri-plugin-sql` (9 tables, fully local) |
| AI (Google) | Gemini 2.0 Flash / 2.5 Pro via Antigravity Gateway or API key |
| AI (GitHub) | Copilot GPT-4o / o1 / Claude via device code auth |
| PDF rendering | react-pdf + pdfjs-dist (local worker) |
| DOCX parsing | mammoth.js |
| PPTX parsing | JSZip + DrawingML XML |
| YouTube | Innertube API (no API key needed) |
| Speech | Web Speech Synthesis + Web Speech Recognition |
| Images | 19 custom illustrations via Nano Banana Pro / Gemini 3 Pro Image |
| CI/CD | GitHub Actions (Windows / macOS ARM + Intel / Linux matrix) |

---

## 🏗️ Build from Source

### Prerequisites
- [Node.js 22+](https://nodejs.org)
- [Rust stable](https://rustup.rs)
- [Tauri CLI v2](https://tauri.app/start/prerequisites/)

```bash
# Clone
git clone https://github.com/KNIGHTABDO/relearn.git
cd relearn

# Install dependencies
npm install

# Development (web preview)
npm run dev

# Development (Tauri desktop app with hot-reload)
npm run tauri:dev

# Production build (generates installer in src-tauri/target/release/bundle/)
npm run tauri:build
```

### Environment Variables (for web/dev mode only)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> In Tauri desktop mode, no environment variables are needed — all AI credentials are stored locally in SQLite.

---

## 🗂️ Project Structure

```
relearn/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home / Spaces dashboard
│   │   ├── learn/page.tsx      # Document viewer + AI tools
│   │   ├── space/page.tsx      # Space detail view
│   │   ├── upload/page.tsx     # File upload
│   │   ├── paste/page.tsx      # URL / text input
│   │   ├── record/page.tsx     # Audio recording
│   │   ├── settings/page.tsx   # AI providers, shortcuts, about
│   │   ├── exam/page.tsx       # Practice exam (timed)
│   │   └── progress/page.tsx   # Analytics dashboard
│   ├── components/
│   │   ├── layout/             # Header, sidebar, footer
│   │   ├── providers/          # DB, i18n, theme contexts
│   │   └── ui/                 # Shared components (command palette, onboarding, etc.)
│   ├── lib/
│   │   ├── database.ts         # SQLite schema + CRUD (9 tables)
│   │   ├── data-layer.ts       # Unified data access (desktop + web)
│   │   ├── ai-service.ts       # All AI prompts + client-side wrappers
│   │   ├── gemini-client.ts    # Google Gemini + Antigravity routing
│   │   ├── google-auth.ts      # Google OAuth (Antigravity flow)
│   │   └── github-auth.ts      # GitHub device code flow
│   └── src-tauri/              # Rust backend (Tauri v2)
│       ├── src/lib.rs          # Tauri commands (OAuth, AI calls, crash logging)
│       └── tauri.conf.json     # App config, CSP, WebView2 bootstrapper
├── public/images/              # 19 AI-generated illustrations
├── prebuild.js                 # Removes API routes, copies pdf.worker before build
└── .github/workflows/
    └── release.yml             # Multi-platform build matrix
```

---

## 🚧 Upcoming Features

- **Arabic RTL layout** — full right-to-left support component by component (in progress)
- **Web version** — hosted deployment (Vercel) for browser access
- **Mobile app** — iOS + Android via Tauri mobile
- **Exam scheduler** — set review reminders based on spaced repetition schedule
- **AI video summary** — generate short video explainers from documents
- **LMS integrations** — export to Google Classroom, Canvas, Blackboard
- **Real-time collaboration** — live cursors and shared editing in Spaces
- **Offline AI** — local LLM via Ollama for fully air-gapped use

---

## 🌐 Website

Landing page: **[relearn-website-kappa.vercel.app](https://relearn-website-kappa.vercel.app)**

Built with Next.js 15. Features a Veo 3 video hero, live download links from GitHub releases, and a dynamic changelog page.

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgements

- [YouLearn](https://youlearn.ai) — design and feature inspiration
- [OpenClaw](https://github.com/openai/openai-cli) — Antigravity Gateway auth approach
- [Tauri](https://tauri.app) — making Rust + web a reality
- [react-pdf](https://github.com/wojtekmaj/react-pdf) — PDF rendering in the browser
- [Nano Banana Pro](https://nanobanana.ai) — AI image generation for illustrations
