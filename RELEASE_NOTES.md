# ReLearn v0.1.0

> **The complete release.** 60+ commits, 2 days of continuous development, production-ready desktop app for Windows, macOS, and Linux.

---

## 📥 Downloads

| Platform | File | Size |
|----------|------|------|
| Windows | `ReLearn_0.1.0_x64-setup.exe` | ~12 MB |
| Windows | `ReLearn_0.1.0_x64_en-US.msi` | ~14 MB |
| macOS (Apple Silicon M1/M2/M3) | `ReLearn_0.1.0_aarch64.dmg` | ~15 MB |
| macOS (Intel) | `ReLearn_0.1.0_x86_64.dmg` | ~15 MB |
| Linux | `re-learn_0.1.0_amd64.AppImage` | ~89 MB |
| Linux | `re-learn_0.1.0_amd64.deb` | ~15 MB |
| Linux | `re-learn_0.1.0-1.x86_64.rpm` | ~15 MB |

---

## 🆕 What's New in v0.1.0

### Core Platform
- **Spaces system** — course-level folders holding multiple documents; space-level AI chat, exams, and study tools
- **Local SQLite database** — all data stored on your machine in a 9-table schema; zero cloud dependencies
- **Dual-mode architecture** — Tauri desktop uses SQLite + direct API calls; web/dev mode uses Next.js API routes + localStorage
- **Tauri v2 desktop app** — native installers for Windows (.msi), macOS ARM + Intel (.dmg), Linux (.AppImage/.deb/.rpm)
- **WebView2 bootstrapper** — auto-installs WebView2 runtime on Windows if not present (silent, no user action needed)

### File Support
- **PDF** — real page rendering via react-pdf with local pdf.js worker; text layer (selectable); zoom presets 50%–200%; continuous page scroll
- **DOCX / DOC** — text extraction via mammoth.js (browser-compatible, no server)
- **PPTX / PPT** — slide text extraction via JSZip + DrawingML `<a:t>` parsing; slide count as page count
- **Images** (PNG, JPG, WebP) — stored as base64; Gemini vision OCR for text extraction
- **YouTube URLs** — Innertube API transcript extraction (no API key needed); embedded `youtube-nocookie.com` player; timestamped transcript panel
- **Plain text / paste** — tab-based UI (YouTube / Website / Plain text), space-aware
- **Audio recording** — waveform visualization, pause/resume, post-recording AI chapter generation

### AI Features
- **RAG chat** — chunk-based retrieval from SQLite documents; AI instructed to cite `[Page X]` references
- **Clickable citations** — `[Page X]` buttons jump to PDF page; `[00:34]` buttons seek YouTube timestamp
- **Cross-document context** — Add Context button passes additional documents to AI system prompt
- **Streaming** — all AI responses stream with live `Loader2` spinner
- **Markdown rendering** — full inline renderer (bold, bullets, numbered lists, code, headings, horizontal rules)
- **Language injection** — AI responds in the user's selected language
- **Flashcards** — AI-generated, SQLite-cached (instant reload), editable (add/edit/delete), Copy All export, keyboard shortcuts (`Space`/`←`/`→`)
- **Practice Quiz** — multiple-choice with per-question explanations
- **Practice Exam** — timed, space-level, full scoring screen
- **Summaries, Notes, Chapters** — three separate AI generate modes per document
- **AI Podcast** — two-host conversation (Alex + Sam); Web Speech Synthesis TTS; speed control; auto-scrolling transcript
- **Voice Tutor** — speech recognition → AI → TTS; continuous conversation mode; visual ripple animations
- **Study Planner** — AI-generated weekly schedule based on weak topics; color-coded time blocks
- **Analytics Dashboard** — SVG bar chart, radar chart, GitHub-style heatmap, animated counters
- **Mind Map** — interactive CSS-animated nodes + SVG bezier connections
- **Study Report** — comprehensive study guide with TOC and source citations
- **Spaced Repetition (SM-2)** — 4-grade system (Again/Hard/Good/Easy); localStorage review scheduling; confetti on completion
- **Snap a Problem** — image upload → AI step-by-step solution
- **Collaborative Spaces** — invite by email, role-based access (Owner/Editor/Viewer), activity feed

### AI Providers
- **Google AI Pro via Antigravity Gateway** — one-click "Connect Google" OAuth using Antigravity's credentials; routes through `cloudcode-pa.googleapis.com/v1internal:generateContent` with full Antigravity headers; AI Pro subscription benefits (Gemini 2.0 Flash / 2.5 Pro) flow automatically without any GCP setup
- **Gemini API key** — paste key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey); free tier (250 req/day) or paid
- **GitHub Copilot** — device code auth; all models (GPT-4o, o1, Claude 3.5+) selectable; Rust `reqwest` bypass for CORS; `github_fetch_models` Tauri command
- **Settings UI** — three-tab navigation (AI Providers / Keyboard Shortcuts / About); Gemini API key input with show/hide toggle

### UI & UX
- **Onboarding wizard** — 3-step first-launch modal (input methods → AI tools → tips); localStorage persistence; 800ms delay; skip/dismiss
- **Command palette** — `⌘K` / `Ctrl+K` from any page; 5 static commands + live SQLite space search; keyboard navigation (↑↓ Enter Esc)
- **Dark mode** — Light / Dark / System toggle; full custom dark palette; zero-flash inline `<script>` in `<head>`
- **10 languages** — English, Spanish, French, Arabic, German, Chinese, Japanese, Korean, Portuguese, Hindi; ~500 translation keys across all 10 locales; AI responds in selected language
- **Home loading skeleton** — animated skeleton cards during `fetchSpaces()`; eliminates empty-state flash
- **Inline error states** — `handleLearn` and `createSpace` both show `AlertCircle` errors instead of silent failures
- **Sidebar search** — full-text SQLite LIKE query across titles, content, and space names
- **Sidebar history** — real recent documents from SQLite ordered by `created_at DESC`
- **PDF text selection toolbar** — 7 AI actions on text selection (Explain, Chat, Quiz, Flashcards, Add to Notes, Read Aloud, Summarize)
- **19 AI-generated illustrations** — logo, feature icons, empty states (Nano Banana Pro / Gemini 3 Pro Image)

### Production Hardening
- **ErrorBoundary component** — prevents single component crash from killing whole app
- **Graceful DB init failure** — DatabaseProvider catches `initDatabase()` failure, shows toast, sets `ready=true` to degrade gracefully
- **17 silent catch blocks eliminated** — all `catch {}` blocks across database.ts, data-layer.ts, gemini-client.ts now log with `console.warn/error`
- **Crash logging** — Rust panic hook writes stack traces to `%LOCALAPPDATA%\ReLearn\crash.log` (Windows) / `~/.relearn/crash.log` (Linux/macOS)
- **Windows crash dialog** — `MessageBoxA` displays fatal startup errors instead of silent exit
- **Auto-update checker** — polls GitHub releases on startup (once/hour throttle), shows floating update banner
- **DevTools** — F12 works in release builds (`"devtools"` feature enabled in Tauri)
- **CSP** — comprehensive Content Security Policy covering all AI endpoints, YouTube, OAuth servers, pdfjs blob workers, and Tauri IPC

### Website
- Landing page: [relearn-website-kappa.vercel.app](https://relearn-website-kappa.vercel.app)
- Next.js 15 + Veo 3 video hero + 4 AI hero images
- OS-auto-detected download button pulling latest GitHub release
- Dynamic changelog page from GitHub Releases API

---

## 🐛 Bugs Fixed

Over 40 bugs were found and fixed during development. Key ones:

| Bug | Impact |
|-----|--------|
| `chatStream` not imported | P0 — every AI chat message crashed |
| `uploadTextAction` wrong field types | P0 — every text upload crashed |
| All 10 AI components calling deleted `/api/` routes | P0 — every generate tool was broken in desktop mode |
| DatabaseProvider never added to layout.tsx | P0 — SQLite never initialized, all data silently lost |
| `learning-panel.tsx` shape mismatch on all generate calls | P0 — summaries/notes/chapters always showed error state |
| `voice-tutor.tsx` calling deleted `/api/chat` route | P0 — Voice Tutor entirely broken |
| `setFlipped` instead of `setIsFlipped` | P1 — flashcard keyboard shortcuts crashed app |
| Study Planner shape mismatch | P1 — always showed mock demo data, never real AI output |
| `dbReady` used before hook call in learn/page.tsx | P1 — SPA navigation to /learn crashed immediately |
| Space creation silent crash (snake_case/camelCase mismatch) | P1 — spaces appeared to create but never saved |
| `fetchSpaces()` reading non-existent field names | P1 — space file counts always showed 0 |
| CSP missing `ipc: http://ipc.localhost` | P1 — every Tauri `invoke()` call blocked (both Connect buttons dead) |
| pdfjs-dist version mismatch | P1 — PDF rendering broken |
| YouTube embed blocked by CSP `frame-src` | P1 — YouTube player never loaded |
| Google OAuth scope (`generative-language.retriever`) | P1 — all Gemini calls 403 |
| SQL plugin `preload` object instead of array | Fatal — app crashed on every launch after first open |

---

## ⬆️ Upgrade Notes

This is the first public release — no migration needed. Fresh install.

If you previously had a broken layout from switching to Arabic, open DevTools (F12) → Console and run:
```javascript
localStorage.removeItem('relearn-language')
```
Then refresh.

---

## 🔮 What's Coming in v0.2.0

- Arabic RTL layout (component-by-component, no global flex reversal)
- Web version (Vercel hosted)
- Exam scheduling and spaced review reminders
- AI-generated video explainers
- Mobile app (iOS + Android via Tauri mobile target)
- LMS export (Google Classroom, Canvas)
- Offline AI via Ollama (local LLM, no internet required)
