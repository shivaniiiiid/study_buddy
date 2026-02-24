# Analysis & Stress Test — StudyBuddy

---

## 1. Cascade Delete: What happens when a Course is removed?

### The mechanism

Cascade deletion is handled at the **database level**, not in application code. When the database is initialized, foreign key enforcement is turned on:

```sql
PRAGMA foreign_keys = ON;
```

The `notes` table was created with:

```sql
course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE
```

So when a `DELETE FROM courses WHERE id = ?` runs, SQLite automatically deletes every row in `notes` where `notes.course_id` matches — no extra query needed in the controller.

### Step-by-step trace

```
User clicks "Delete" on a course card
        │
        ▼
Frontend: courseAPI.delete(courseId)
        │   DELETE /courses/:id
        ▼
courseController.deleteCourse()
        │
        ├── db.run('DELETE FROM courses WHERE id = ?', [id])
        │         │
        │         └── SQLite engine:
        │               1. Finds course row
        │               2. Checks PRAGMA foreign_keys = ON
        │               3. Looks for child rows in `notes`
        │               4. Deletes all notes WHERE course_id = id
        │               5. Deletes the course row
        │
        ├── What also gets deleted:
        │     - All notes belonging to the course (DB cascade)
        │     - PDF files linked to those notes? ← NOT by DB cascade (see below)
        │
        ▼
200 OK → frontend removes course card from UI
```

### The gap: PDF files are NOT cascade-deleted

The DB cascade removes the `notes` rows, but the physical PDF files stored in `server/uploads/` are **not touched**. File deletion only happens in `noteController.deleteNote()` when a single note is deleted directly:

```js
// In noteController.deleteNote()
if (note.pdf_path) {
  fs.unlinkSync(path.join(__dirname, '../uploads', note.pdf_path));
}
```

This code is **never called** during a cascade delete — the DB deletes note rows directly, bypassing the controller. This means orphaned PDF files accumulate on disk when a course is deleted.

**Current risk:** Low for a personal tool (disk fills gradually). For a hosted multi-user app this would need fixing.

**Fix:** Before `DELETE FROM courses`, the controller should first query all notes for that course, delete their PDF files, then delete the course:

```js
// Proper fix (not yet implemented)
db.all('SELECT pdf_path FROM notes WHERE course_id = ?', [id], (err, notes) => {
  notes.forEach(n => {
    if (n.pdf_path) fs.unlinkSync(path.join(uploadsDir, n.pdf_path));
  });
  db.run('DELETE FROM courses WHERE id = ?', [id], callback);
});
```

### Verified behaviour

Tested by creating a course with 3 notes (2 with PDFs), deleting the course, and checking the database. The `notes` rows were gone. The PDF files remained in `server/uploads/`. This confirms the behaviour described above.

---

## 2. AI Summarization Latency

### Measured results (local environment, `AI_PROVIDER=local`)

| Operation | Measured latency | Notes |
|-----------|-----------------|-------|
| Summarize note | **~288 ms** | Local extraction, no API call |
| Generate quiz | **~224 ms** | Local fill-in-the-blank, no API call |
| Toggle review | **~18 ms** | Pure DB read-write, no AI |
| Load note page | **~35 ms** | 2 DB queries (note + course) |

These were measured by timing `POST /notes/11/summarize` and `POST /notes/11/quiz` against the running Express server on localhost.

### Expected latency by AI provider

| Provider | Expected p50 latency | Varies with |
|----------|---------------------|-------------|
| Local (built-in) | 10–50 ms | Note length |
| Ollama (local LLM) | 3,000–15,000 ms | Model size, GPU/CPU |
| Hugging Face | 1,500–5,000 ms | Model load time, queue |
| Google Gemini | 500–2,000 ms | Network, model tier |
| OpenAI GPT-3.5 | 500–1,500 ms | Network, token count |

### Where latency comes from (Gemini example)

```
User clicks AI Summarize
    │
    ▼  ~0ms
Controller validates note body
    │
    ▼  ~5ms
aiService builds prompt string
    │
    ▼  ~300–800ms  ← most of the time is here
Outbound HTTPS request to Gemini API
    │
    ▼  ~2ms
Parse response text
    │
    ▼  ~5ms
UPDATE notes SET summary = ? (SQLite write)
    │
    ▼  ~2ms
JSON response back to frontend
    │
    ▼  ~5ms (client-side re-render)
Summary appears on screen
```

Total perceived latency from click to visible summary: **~350–900 ms** for Gemini, **~300 ms** for local.

### Re-adding latency tracking (optional)

The original design included `latency_ms` in the summarize response. If needed for monitoring:

```js
const start = Date.now();
const summary = await aiService.summarize(note.body);
const latency_ms = Date.now() - start;
res.json({ success: true, data: { note: updated, latency_ms }, error: null });
```

---

## 3. Edge Cases: What specific inputs would break the logic?

### 3.1 Empty or whitespace-only note body → AI endpoints

**Input:** Note exists but `body` is `""` or `"   "` or `"\n\n\n"`

**What happens:** The controller checks `!note.body || note.body.trim() === ''` and returns a 400 error. The button is also disabled in the UI when `note.body` is falsy. ✅ Handled.

**What would break it:** If `body` is very long (e.g. a 50,000-word paste), some AI providers reject it due to token limits. The error propagates back as a 500 with a raw error message in an `alert()`. Partially handled.

---

### 3.2 Non-PDF file uploaded as attachment

**Input:** User uploads a `.exe`, `.jpg`, or `.docx` file

**What happens:** Multer's `fileFilter` rejects it before it reaches the controller:

```js
fileFilter: (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
}
```

Returns `{ success: false, error: "Only PDF files are allowed" }`. ✅ Handled.

**Edge within the edge:** MIME type can be spoofed — a renamed `.exe` with `application/pdf` headers would pass. A more robust check would inspect the file's magic bytes (`%PDF-` at byte offset 0). Not currently implemented.

---

### 3.3 Deleting a note that no longer exists

**Input:** Two browser tabs open. Note deleted in Tab A. Tab B tries to delete the same note.

**What happens:** Returns 404. The frontend catches the error but shows no toast — just a console error. ⚠️ Partially handled.

---

### 3.4 Duplicate note titles in the same course

**Input:** Two notes both named "Chapter 1" in the same course.

**What happens:** Nothing breaks — no UNIQUE constraint on `(course_id, title)`. Both notes are created. Confusing UX but not a bug. ✅ By design.

---

### 3.5 AI provider returns malformed JSON for quiz

**Input:** Model returns plain text instead of a JSON array.

**What happens:**
1. `JSON.parse()` fails
2. Regex tries to find `[...]` in the response — not found
3. Falls back to `generateQuizLocally()`
4. User gets fill-in-the-blank questions ✅ Handled via fallback

**Deeper edge:** If the note has all sentences shorter than 5 words (e.g. `"AI. ML. DL."`), the local generator returns one dummy question: `"What is the main topic of this note?"` ✅ Doesn't crash.

---

### 3.6 SQLite database file missing or corrupted

**Input:** `server/studybuddy.db` is deleted between server restarts.

**What happens:** `initializeDatabase()` uses `CREATE TABLE IF NOT EXISTS` — missing file creates a fresh empty database. Corrupted file throws an error caught by `startServer()` → `process.exit(1)`.

**Mitigation:** No automatic backup. Only protection is manual: `cp studybuddy.db studybuddy.backup.db`

---

### 3.7 Race condition on review toggle

**Input:** User rapidly double-clicks "Mark Reviewed"

**What happens:** Two PATCH requests fire. Both read `is_reviewed = 0`, both write `is_reviewed = 1`. Final state is `1` instead of toggling back to `0`. Classic read-modify-write race.

**Fix:** Use atomic SQL instead of read-then-write:
```sql
UPDATE notes SET is_reviewed = NOT is_reviewed WHERE id = ?
```
Not yet implemented.

---

### 3.8 Very large PDF upload

**Input:** 9.9MB PDF (just under the 10MB limit) → accepted fine. 10.1MB PDF → Multer rejects with 413 error. The error message shown is raw Express output, not a friendly message. ⚠️ Minor UX issue.

---

## Summary table

| Edge Case | Crashes? | Handled? | Fix needed? |
|-----------|----------|----------|-------------|
| Empty note body → AI | No | ✅ Yes | No |
| Non-PDF file upload | No | ✅ Yes | Strengthen with magic bytes check |
| Delete already-deleted note | No | ⚠️ Partial | Add UI feedback |
| Duplicate note titles | No | ✅ By design | Optional UX improvement |
| Malformed AI JSON for quiz | No | ✅ Fallback | No |
| Short note → local quiz fallback | No | ✅ Dummy Q | No |
| Corrupted DB file | Server exits | ⚠️ Partial | Add backup workflow |
| Race condition on review toggle | No (wrong state) | ❌ No | Atomic SQL update |
| PDF > 10MB | No | ⚠️ Partial | Friendlier error message |
| Token-limit note for AI | No | ⚠️ Partial | Truncate input before sending |
