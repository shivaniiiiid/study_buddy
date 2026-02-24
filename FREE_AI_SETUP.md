# Setting up a free AI provider

By default the app uses a local fallback for summaries and quizzes — it works, but the output is pretty basic. If you want proper AI-generated results, pick one of the options below. All of them have a free tier.

---

## Option 1 — Hugging Face (easiest free option)

1. Go to https://huggingface.co/settings/tokens and sign up/log in
2. Click "New token", give it a name, select "Read" access, and create it
3. Copy the token (starts with `hf_...`)
4. Open `server/.env` and update:

```env
HUGGINGFACE_API_KEY=hf_your_token_here
AI_PROVIDER=huggingface
```

5. Restart the server (`node app.js`)

Works straight away. Free with no billing info required. A bit slower than paid options but the quality is fine for study notes.

---

## Option 2 — Google Gemini (fast, generous free tier)

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account and create an API key
3. Copy the key
4. Open `server/.env` and update:

```env
GEMINI_API_KEY=your_key_here
AI_PROVIDER=gemini
```

5. Restart the server

Gemini is noticeably faster than Hugging Face and the free tier limit is pretty generous for personal use.

---

## Option 3 — Ollama (runs 100% on your machine, no internet needed)

Good if you don't want to send your notes to any external service.

1. Download and install Ollama from https://ollama.ai
2. Open a terminal and pull a model:

```bash
ollama pull mistral
```

3. Make sure Ollama is running:

```bash
ollama serve
```

4. Open `server/.env` and update:

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=mistral
OLLAMA_API_URL=http://localhost:11434
```

5. Restart the server

Takes a few minutes to pull the model the first time, but after that it's instant and completely offline.

---

## Option 4 — OpenAI (best output, but costs money)

1. Get an API key from https://platform.openai.com/api-keys
2. Open `server/.env` and update:

```env
LLM_API_KEY=sk-your-key-here
LLM_API_URL=https://api.openai.com/v1/chat/completions
AI_PROVIDER=openai
```

3. Restart the server

Quality is the best of all four options. Worth it if you already have credits.

---

## Switching providers later

Just change `AI_PROVIDER` in `.env` and restart the server. That's all you need to do.

```env
AI_PROVIDER=local         # built-in fallback, no key needed
AI_PROVIDER=huggingface   # Hugging Face
AI_PROVIDER=gemini        # Google Gemini
AI_PROVIDER=ollama        # local Ollama
AI_PROVIDER=openai        # OpenAI
```

---

## Quick comparison

| Provider | Cost | Speed | Quality |
|----------|------|-------|---------|
| Local (built-in) | Free | Instant | Basic |
| Hugging Face | Free | Slow-ish | Good |
| Gemini | Free tier | Fast | Very good |
| Ollama | Free | Medium | Good |
| OpenAI | Paid | Fast | Best |

---

## Testing if it works

After setting a provider and restarting the server, visit:

```
http://localhost:3001/test-api
```

You should see a success response with the provider name and a test output. If it fails, the error message usually tells you what's wrong (bad key, wrong URL, model not found, etc.).

Then try clicking "AI Summarize" or "Generate Quiz" on any note with content.

---

## Common issues

**Hugging Face returns 401** — token is wrong or expired. Generate a new one.

**Gemini returns 403** — the API key might not be enabled yet. Try waiting a minute after creating it.

**Ollama not connecting** — make sure `ollama serve` is running in a separate terminal. It doesn't start automatically.

**Nothing changes after editing .env** — you need to restart the server every time you change `.env`. The app doesn't hot-reload environment variables.
