# StudyBuddy — AI-Powered Study Organizer

🚀 **Live Project**: https://studybuddy-production-168f.up.railway.app/  
📹 **Project Demo**: https://drive.google.com/file/d/14DggWaogHF3aLqWmN3N-ouaQ-1jQLZeA/view?usp=drivesdk

StudyBuddy is a full-stack web application that helps students organize courses and notes, with AI-powered summarization, quiz generation, and study progress tracking. Built with React, Node.js/Express, and SQLite.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Agent Flow Diagram](#agent-flow-diagram)
3. [Database Schema](#database-schema)
4. [Prompt Library](#prompt-library)
5. [Logic & Pattern Explanation](#logic--pattern-explanation)
6. [Features](#features)
7. [Getting Started](#getting-started)
8. [API Reference](#api-reference)
9. [Deployment](#deployment)

---

## System Architecture

The application follows a classic three-tier architecture with an AI service layer injected between the backend and external providers.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Port 3000)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  React Frontend                           │   │
│  │                                                          │   │
│  │  ThemeProvider (dark/light context)                      │   │
│  │       │                                                  │   │
│  │  ┌────┴──────┐   ┌──────────────┐   ┌───────────────┐  │   │
│  │  │ Dashboard │──▶│ CourseDetail │──▶│  NoteDetail   │  │   │
│  │  │  + Search │   │  + Add Note  │   │  + AI Tools   │  │   │
│  │  └───────────┘   └──────────────┘   └───────────────┘  │   │
│  │                          │                               │   │
│  │                   api.js (Axios)                         │   │
│  └──────────────────────────┼───────────────────────────── ┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Express Server (Port 3001)                      │
│                                                                  │
│  app.js (CORS, JSON parser, route mounter)                       │
│   ├── /courses  ──▶  courseController.js                         │
│   └── /notes    ──▶  noteController.js                           │
│                             │                                    │
│                      aiService.js  ◀── AI_PROVIDER (env var)     │
│                             │                                    │
│          ┌──────────────────┼──────────────────────┐            │
│          ▼                  ▼                       ▼            │
│     Gemini API       Hugging Face API         Ollama (local)     │
│     OpenAI API       Local Fallback                              │
│                                                                  │
│  middleware/                                                     │
│    errorHandler.js   fileUpload.js (Multer, PDF-only)            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ SQL (parameterized)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQLite Database                              │
│                    (server/studybuddy.db)                        │
│                                                                  │
│       users ──1:many──▶ courses ──1:many──▶ notes               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent Flow Diagram

StudyBuddy uses a **Tool-as-Service** AI pattern — each AI feature is a single-shot prompt/response cycle rather than a multi-step reasoning loop. The agent reasoning is handled inside `aiService.js` which selects the provider, constructs the prompt, validates the output, and self-corrects via a local fallback.

### Summarization Flow

```
User clicks "AI Summarize"
         │
         ▼
  noteController.summarizeNote()
         │
         ├── Guard: note.body empty? ──▶ 400 error (stop)
         │
         ▼
  aiService.summarize(noteBody)
         │
         ├── Read AI_PROVIDER from environment
         │
         ├─[gemini]──────▶ POST /v1beta/models/gemini-pro:generateContent
         ├─[huggingface]─▶ POST /facebook/bart-large-cnn
         ├─[ollama]──────▶ POST /api/generate (local)
         ├─[openai]──────▶ POST /v1/chat/completions
         └─[local]───────▶ summarizeLocally() (keyword extraction, no API)
                  │
                  ▼
         Raw text response
                  │
         ┌────────┴─────────┐
         │ Parse bullets     │
         │ strip HTML tags   │
         │ clean whitespace  │
         └────────┬─────────┘
                  │
         ┌────────┴──────────────────────────┐
         │ Valid summary?                     │
         │  YES → UPDATE notes SET summary=? │
         │  NO  → try summarizeLocally()     │
         └───────────────────────────────────┘
                  │
                  ▼
         Return { note: updatedNote } to controller
                  │
                  ▼
         JSON response to frontend
                  │
                  ▼
         NoteDetail re-renders with summary displayed
```

### Quiz Generation Flow

```
User clicks "Generate Quiz"
         │
         ▼
  noteController.generateQuiz()
         │
         ├── Guard: note.body empty? ──▶ 400 error (stop)
         │
         ▼
  aiService.generateQuiz(noteBody)
         │
         ├── Construct structured prompt (JSON output requested)
         ├── Call active AI provider
         │
         ▼
         Raw response (may be JSON, may be markdown-wrapped JSON)
         │
         ├── Try: regex extract [...] from response
         ├── Try: JSON.parse(extracted)
         │
         ├── Parse success? ──▶ return quiz array
         │
         └── Parse fail? ──▶ SELF-CORRECT via generateQuizLocally()
                               (fill-in-the-blank from sentence extraction)
         │
         ▼
  UPDATE notes SET quiz = JSON.stringify(quizArray)
         │
         ▼
  Return { quiz: [...] } to frontend
         │
         ▼
  NoteDetail renders quiz cards with reveal-on-click answers
```

### Review Toggle Flow

```
User clicks "Mark Reviewed"
         │
         ▼
  noteController.toggleReview()
         │
         ├── SELECT is_reviewed FROM notes WHERE id=?
         ├── newValue = current === 1 ? 0 : 1    (simple bit flip)
         ├── UPDATE notes SET is_reviewed=?
         │
         ▼
  Return updated note object
         │
         ▼
  Button state updates (green ✅ / grey ⬜)
  Dashboard reviewed count updates on next navigation
```

### Self-Correction Path

```
AI Provider call
      │
      ▼
  ┌─────────────────────────────────────────────┐
  │   Success?                                  │
  │     YES ──▶ parse & validate output        │
  │               │                             │
  │               ├── Valid format? ──▶ use it  │
  │               └── Invalid?                  │
  │                     │                       │
  │                     ▼                       │
  │              generateLocally()  ◀─ FALLBACK │
  │                                             │
  │     NO (network error / API error)          │
  │          │                                  │
  │          ▼                                  │
  │   generateLocally()  ◀────────── FALLBACK   │
  └─────────────────────────────────────────────┘
```

The local fallback ensures the feature never hard-fails from the user's perspective — they always get some output, even without an API key.

---

## Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                            users                                  │
├──────────────────────────────────────────────────────────────────┤
│  id          INTEGER  PRIMARY KEY AUTOINCREMENT                   │
│  email       TEXT     UNIQUE NOT NULL                            │
│  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │ 1
                           │
                           │ ON DELETE CASCADE
                           │
                           ▼ many
┌──────────────────────────────────────────────────────────────────┐
│                           courses                                 │
├──────────────────────────────────────────────────────────────────┤
│  id           INTEGER  PRIMARY KEY AUTOINCREMENT                  │
│  user_id      INTEGER  FK → users.id  (ON DELETE CASCADE)        │
│  name         TEXT     NOT NULL                                   │
│  description  TEXT                                               │
│  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP                  │
│  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ 1
                           │
                           │ ON DELETE CASCADE
                           │
                           ▼ many
┌──────────────────────────────────────────────────────────────────┐
│                            notes                                  │
├──────────────────────────────────────────────────────────────────┤
│  id           INTEGER  PRIMARY KEY AUTOINCREMENT                  │
│  course_id    INTEGER  FK → courses.id  (ON DELETE CASCADE)      │
│  title        TEXT     NOT NULL                                   │
│  body         TEXT     (note content, plain text)                │
│  summary      TEXT     (AI-generated bullet points)              │
│  quiz         TEXT     (JSON: [{question, answer}, ...])         │
│  is_reviewed  INTEGER  DEFAULT 0  (0 = not reviewed, 1 = done)  │
│  pdf_path     TEXT     (filename in server/uploads/)             │
│  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP                  │
│  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP                  │
└──────────────────────────────────────────────────────────────────┘
```

**Relationships:**
- `users` → `courses`: one user can have many courses (CASCADE DELETE)
- `courses` → `notes`: one course can have many notes (CASCADE DELETE)
- `PRAGMA foreign_keys = ON` is enabled at database init

**Migration strategy:** New columns (`pdf_path`, `is_reviewed`, `quiz`) are added via `ALTER TABLE ADD COLUMN` inside the database initialization function, with duplicate-column errors silently ignored. This means the database self-upgrades each time the server starts — no manual migration scripts needed at this scale.

---

## Prompt Library

### 1. Summarization Prompt

**Used in:** `aiService.summarize(text)`

```
Summarize the following study note into 3-5 concise bullet points.
Focus only on the key concepts. Use "•" for each bullet point.
Do not add any introduction or conclusion sentences.

Note:
{noteBody}
```

**Why this prompt:**
- "3–5 bullet points" sets a hard upper bound so summaries stay scannable
- "Focus only on key concepts" reduces hallucination/padding
- "Do not add introduction or conclusion sentences" prevents the model from wrapping bullets in prose (a common pattern with instruction-tuned models that hurts rendering)
- The `•` character instruction makes parsing predictable — the frontend splits on bullet characters rather than needing to detect markdown

**Temperature:** `0.3`

Low temperature was chosen deliberately. Summarization is not a creative task — you want the model to extract what's actually in the note, not invent paraphrases. A low temperature keeps the output consistent and grounded in the source text. Higher temperatures (0.7+) cause the model to sometimes "drift" and include content not present in the note, which would be misleading for a study tool.

---

### 2. Quiz Generation Prompt

**Used in:** `aiService.generateQuiz(text)`

```
Based on the following study note, generate 3-5 quiz questions with answers.
Return ONLY a valid JSON array in this exact format, no other text:
[{"question": "...", "answer": "..."}, ...]

Study note:
{noteBody}
```

**Why this prompt:**
- "Return ONLY a valid JSON array" with the exact format shown reduces the chance of the model wrapping output in markdown fences or adding explanatory text, which would break `JSON.parse()`
- Showing the exact schema (`[{"question": "...", "answer": "..."}]`) acts as a **one-shot example** — the model sees the structure it should follow, not just a description of it
- "3-5" questions balances usefulness vs. length. Fewer than 3 isn't enough to be useful; more than 5 causes fatigue
- "Based on the following study note" anchors the model to the source material to prevent generating hallucinated questions

**Temperature:** `0.5`

Slightly higher than summarization because quiz generation benefits from some variation — asking for questions about the same text multiple times should produce different questions. Pure extraction (low temperature) would always produce the same questions, reducing the value of regenerating. 0.5 provides variety while keeping questions grounded in the material.

**Self-correction:** If the response can't be parsed as JSON (the model added prose, code fences, or produced malformed output), the code extracts a `[...]` block with a regex and retries `JSON.parse()`. If that also fails, it falls back to `generateQuizLocally()` which produces fill-in-the-blank questions from sentence tokenization — no API required.

---

### 3. Local Fallback Summary (no API)

**Used in:** `aiService.summarizeLocally(text)`

No LLM prompt — pure algorithmic:

```
1. Split text into sentences on [.!?]
2. Tokenize each sentence into words
3. Score words by frequency (TF-style), filter stopwords
4. Score sentences by their word scores
5. Return top 3 sentences as bullet points
```

**Why this exists:**
- Makes the app fully functional without any API key (important for demos and first-run setup)
- Forces the API abstraction to always return *something*, which simplifies error handling upstream — the controller never needs to handle "AI completely unavailable" as a state

---

### 4. Few-Shot Example (quiz prompt in practice)

Input note:
```
Stack: LIFO (Last In First Out). Operations: push, pop.
Queue: FIFO (First In First Out). Used in scheduling and memory management.
```

Expected output (with a capable model):
```json
[
  {"question": "What does LIFO stand for?", "answer": "Last In First Out"},
  {"question": "What are the two main operations of a Stack?", "answer": "push and pop"},
  {"question": "What does FIFO stand for?", "answer": "First In First Out"},
  {"question": "What is a Queue used for?", "answer": "Scheduling and memory management"}
]
```

Local fallback output for the same note:
```json
[
  {"question": "Fill in the blank: \"Stack: LIFO (Last In First ______)?\"", "answer": "Out."},
  {"question": "Fill in the blank: \"Queue: FIFO (First In First ______)?\"", "answer": "Out."}
]
```

The difference shows why connecting an actual AI provider gives significantly better results.

---

## Logic & Pattern Explanation

### Why Tool-as-Service instead of ReAct or Plan-and-Execute

**ReAct** (Reason + Act) involves the LLM reasoning in a loop — observing tool outputs, deciding next steps, re-querying. It's the right pattern for agents that need to answer complex questions by chaining multiple tool calls (e.g., "search the web, read the page, extract data, summarize").

**Plan-and-Execute** has the LLM first create a plan (sequence of steps), then execute each step — better for tasks with many sub-problems.

StudyBuddy's AI tasks are **single-shot**: given a note body, produce a summary or quiz. There is no multi-step reasoning needed. A ReAct loop would add latency and complexity for zero benefit here.

The **Tool-as-Service** pattern used here is simpler and appropriate:
```
Controller → aiService.action(text) → Provider → Response → Controller
```
One call, one response. The "intelligence" is in the prompt design, not in a reasoning loop.

---

### Why Express Middleware for error handling

Express middleware with `next(error)` propagation was chosen over try-catch in every controller.

**Without centralized middleware:**
```js
// Every controller function needs this:
try { ... }
catch (err) {
  res.status(500).json({ success: false, data: null, error: err.message });
}
```

**With centralized middleware:**
```js
// errorHandler.js handles all errors uniformly
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, data: null, error: err.message });
});
```

This ensures every error — whether thrown in a controller, middleware, or route handler — produces the same `{ success, data, error }` envelope that the frontend expects. It also means adding logging, alerting, or error tracking only needs to happen in one place.

---

### Why the AI provider is abstracted behind a service class

The `aiService.js` module hides all provider-specific implementation behind two method calls: `summarize(text)` and `generateQuiz(text)`. The controllers don't import Axios or know any API URLs.

This matters because:
1. **Switching providers** requires zero changes in controllers
2. **Testing** can mock `aiService` without spinning up an API
3. **Adding a new provider** is just a new branch inside `aiService.js`
4. **The local fallback** can be dropped in anywhere without controller changes

This is the **Adapter pattern** — each provider (Gemini, HuggingFace, Ollama, OpenAI) is an adapter behind a common interface.

---

### Why SQLite and no ORM

SQLite was chosen because:
- **Zero configuration** — no server to run, no credentials, database is a file
- **Single user** — no concurrent write contention (SQLite has table-level write locks, which is fine for a personal tool)
- **Portable** — the entire database moves with `cp studybuddy.db backup.db`

**Raw SQL over ORM:** The schema has 3 tables with simple relationships. An ORM like Sequelize or Prisma would add setup overhead and indirection. Parameterized statements (`db.run('SELECT * FROM notes WHERE id = ?', [id])`) are already injection-safe and readable at this scale.

The trade-off: schema migrations are manual (ALTER TABLE in initialization code). At 3 tables this is manageable; at 10+ tables it would need a proper migration library.

---

### Why React Context for theming (not Redux or CSS-only)

**CSS-only** would work for applying styles but can't read the current theme value in JavaScript (needed for the toggle icon to show ☀️ vs 🌙).

**Redux** is overkill for a single boolean state that almost never changes.

**React Context** is right-sized:
- The theme value is provided once at the top of the tree (`ThemeProvider` in `App.js`)
- Any component that needs it calls `useTheme()`
- The actual style switching is done by CSS variables (no JS re-renders per element)

```
ThemeProvider sets: document.documentElement.setAttribute('data-theme', 'dark')
CSS responds:       [data-theme="dark"] { --bg-base: #080c14; }
                    [data-theme="light"] { --bg-base: #f0f4ff; }
```

The separation means: React manages *which* theme is active, CSS manages *what it looks like*. No per-component theme logic anywhere.

---

### Why no authentication (and how to add it)

The `users` table was included in the schema to leave the door open, but auth wasn't implemented because:
- This is a local personal tool — the threat model doesn't require it
- Adding auth (JWT + bcrypt + protected routes) would roughly double the backend code
- It shifts user experience from "open the app, start working" to "create an account first"

When auth becomes necessary (hosting for multiple users), the path is:
1. Add `POST /auth/register` and `POST /auth/login` endpoints
2. Issue JWT tokens, verify with `express-jwt` middleware on all routes
3. Filter all queries by `WHERE user_id = req.user.id`
4. The schema already has `user_id` on courses — minimal joins needed

---

## Features

| Feature | Status |
|---------|--------|
| Create / edit / delete courses | ✅ |
| Create / edit / delete notes with rich text | ✅ |
| Upload and preview PDFs with notes | ✅ |
| AI-generated note summaries | ✅ |
| AI-generated quiz questions | ✅ |
| Mark notes as reviewed | ✅ |
| Global search across courses and notes | ✅ |
| Dark / light mode with localStorage persistence | ✅ |
| Study progress stat cards on dashboard | ✅ |
| Multi-provider AI (Gemini, HuggingFace, Ollama, OpenAI, local) | ✅ |
| User authentication | 🔲 Planned |
| Export notes as PDF | 🔲 Planned |
| Spaced repetition for quizzes | 🔲 Planned |

---

## Getting Started

**Requirements:** Node.js v14+

```bash
# 1. Clone the repo
git clone https://github.com/your-username/study_buddy.git
cd study_buddy

# 2. Backend
cd server
npm install
cp .env.example .env     # edit with your AI key if you have one
node app.js              # runs on port 3001

# 3. Frontend (new terminal)
cd client
npm install
npm start                # runs on port 3000
```

Open `http://localhost:3000`. See `FREE_AI_SETUP.md` for connecting AI providers.

---

## API Reference

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | List all courses |
| POST | `/courses` | Create a course |
| GET | `/courses/:id` | Get one course |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete course + notes |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | List all notes |
| GET | `/courses/:id/notes` | Notes for a course |
| POST | `/courses/:id/notes` | Create note (+ optional PDF) |
| GET | `/notes/:id` | Get one note |
| PUT | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Delete note + PDF |
| POST | `/notes/:id/summarize` | Generate AI summary |
| POST | `/notes/:id/quiz` | Generate quiz questions |
| PATCH | `/notes/:id/review` | Toggle reviewed status |
| GET | `/pdf/:filename` | Serve PDF file |

All responses: `{ "success": true/false, "data": <payload>, "error": <string|null> }`

---

## Deployment

See `docs/DEPLOYMENT.md` for full instructions.

**Short version:** Frontend → Vercel, Backend → Railway (SQLite needs a persistent filesystem — Vercel's serverless functions are read-only).

Set `REACT_APP_API_URL` on Vercel and `CLIENT_URL` on Railway for CORS to work correctly in production.

---

## Tech Stack

**Frontend:** React 18, React Router v6, Axios, CSS Custom Properties (no framework)

**Backend:** Node.js, Express 4, SQLite3, Multer, Axios, dotenv, CORS

**AI Providers:** Google Gemini, Hugging Face Inference API, Ollama, OpenAI (configurable via env var)

**Storage:** SQLite (local file), server/uploads/ (PDFs)
