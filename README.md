# StudyBuddy

A personal study organizer I built to help manage notes and courses in one place. It uses AI to summarize notes and can even generate quiz questions — which honestly makes reviewing stuff a lot easier.

The stack is pretty simple: React on the frontend, Node/Express on the backend, and SQLite for storage. No complicated setup needed.

---

## What it can do

- Create courses and organize notes inside them
- Upload PDFs alongside notes and preview them in-app
- Generate AI summaries of your notes with one click
- Generate quiz questions from note content (fill-in-the-blank style)
- Mark notes as "reviewed" to track study progress
- Search across all your courses and notes from the dashboard
- Switch between dark and light mode (preference is saved)

---

## Getting it running

You'll need **Node.js v14+** installed. That's pretty much it.

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Set up your environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

The `.env` file looks like this:

```env
PORT=3001
AI_PROVIDER=local

# Pick one of these depending on what you're using:
GEMINI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
LLM_API_KEY=your_openai_key_here
```

See `FREE_AI_SETUP.md` for details on each option. If you leave `AI_PROVIDER=local`, it'll use a basic built-in fallback — no API key needed.

### 3. Start the server

```bash
node app.js
```

### 4. Install and start the frontend

Open a new terminal:

```bash
cd client
npm install
npm start
```

That's it. Frontend runs on `http://localhost:3000`, backend on `http://localhost:3001`.

---

## Project structure

```
studybuddy/
├── server/
│   ├── app.js                  # Entry point, sets up Express
│   ├── .env                    # Your API keys go here
│   ├── controllers/
│   │   ├── courseController.js
│   │   └── noteController.js   # Handles summaries, quizzes, reviews
│   ├── models/
│   │   └── database.js         # SQLite schema + migrations
│   ├── routes/
│   │   ├── courses.js
│   │   └── notes.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── fileUpload.js       # Multer config (PDF only)
│   └── services/
│       └── aiService.js        # Abstraction for different AI providers
│
├── client/
│   └── src/
│       ├── components/
│       │   └── Header.js       # Shared header with theme toggle
│       ├── pages/
│       │   ├── Dashboard.js    # Course list + global search
│       │   ├── CourseDetail.js # Notes for a course
│       │   └── NoteDetail.js   # Note editor, AI tools, quiz
│       ├── services/
│       │   └── api.js
│       ├── ThemeContext.js     # Dark/light mode state
│       ├── App.js
│       ├── App.css
│       └── index.css
│
├── README.md
└── FREE_AI_SETUP.md
```

---

## API reference

### Courses

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/courses` | List all courses |
| POST | `/courses` | Create a course |
| GET | `/courses/:id` | Get one course |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete course + all its notes |

### Notes

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/notes` | List all notes |
| GET | `/courses/:courseId/notes` | Notes for a specific course |
| POST | `/courses/:courseId/notes` | Create a note (PDF optional) |
| GET | `/notes/:id` | Get one note |
| PUT | `/notes/:id` | Update a note |
| DELETE | `/notes/:id` | Delete note + PDF file |
| POST | `/notes/:id/summarize` | Generate AI summary |
| POST | `/notes/:id/quiz` | Generate quiz questions |
| PATCH | `/notes/:id/review` | Toggle reviewed status |
| GET | `/pdf/:filename` | Serve a PDF file |

All responses follow the same shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## Database schema

```
users
  id, email, created_at

courses
  id, user_id → users.id, name, description, created_at, updated_at

notes
  id, course_id → courses.id, title, body, summary, quiz,
  is_reviewed, pdf_path, created_at, updated_at
```

Cascade deletes are enabled — deleting a course removes all its notes automatically.

---

## AI setup

The app supports four providers. Check `FREE_AI_SETUP.md` for full instructions.

| Provider | Cost | Notes |
|----------|------|-------|
| Local (built-in) | Free | No API needed, basic output |
| Hugging Face | Free | Good quality, slightly slow |
| Google Gemini | Free tier | Fast, generous limits |
| Ollama | Free, local | Runs on your machine |
| OpenAI | Paid | Best quality |

Switch providers by changing `AI_PROVIDER` in `.env` and restarting the server.

---

## Tech used

**Backend:** Node.js, Express, SQLite3, Multer, Axios, dotenv

**Frontend:** React, React Router, Axios, vanilla CSS (no framework)

---

## Things I'd add next

- Proper user authentication (the DB schema already has a `users` table ready)
- Pomodoro timer per course
- Export notes as PDF
- Spaced repetition for the quiz feature

---

## Troubleshooting

**Server won't start** — make sure you're in the `server/` folder and have run `npm install`.

**AI summarize does nothing** — check your `.env` file has the right key and `AI_PROVIDER` matches it. Restart the server after any `.env` change.

**"Cannot GET /api/..."** — the API doesn't use an `/api` prefix. Routes are directly at `/notes`, `/courses`, etc.

**PDF not showing** — PDFs are stored in `server/uploads/`. Make sure that folder exists and the server has write permissions.

**Frontend can't reach backend** — double check that the backend is running on port 3001. The frontend proxies requests there automatically.

**Light mode text invisible** — this was a known issue that's been fixed. If you're on an older build, pull the latest changes.
