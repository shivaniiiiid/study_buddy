# Free AI API Setup Guide

StudyBuddy now supports multiple free AI providers for note summarization! Choose the one that works best for you.

## 🆓 **Option 1: Hugging Face (Recommended - Free)**

### Setup:
1. **Get API Key**:
   - Go to https://huggingface.co/settings/tokens
   - Create a new token (it's free)
   - Copy the token

2. **Update .env file**:
   ```env
   HUGGINGFACE_API_KEY=hf_your_token_here
   AI_PROVIDER=huggingface
   ```

3. **Restart server**:
   ```cmd
   cd server
   node app.js
   ```

**Pros**: Completely free, good models, no rate limits
**Cons**: Slower than paid options

---

## 🚀 **Option 2: Google Gemini (Free Tier Available)**

### Setup:
1. **Get API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key (free tier available)
   - Copy the key

2. **Update .env file**:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   AI_PROVIDER=gemini
   ```

3. **Restart server**:
   ```cmd
   cd server
   node app.js
   ```

**Pros**: Fast, good quality, generous free tier
**Cons**: May have usage limits

---

## 🦙 **Option 3: Ollama (100% Free & Local)**

### Setup:
1. **Install Ollama**:
   ```cmd
   # Download from https://ollama.ai
   # Install and run Ollama
   ollama serve
   ```

2. **Download a model**:
   ```cmd
   ollama pull mistral
   ```

3. **Update .env file**:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_MODEL=mistral
   ```

4. **Restart server**:
   ```cmd
   cd server
   node app.js
   ```

**Pros**: Completely free, runs locally, no internet needed
**Cons**: Requires local setup, uses your computer resources

---

## 🔧 **How to Switch Providers**

Simply change the `AI_PROVIDER` value in your `.env` file:

```env
# For OpenAI (default)
AI_PROVIDER=openai

# For Hugging Face
AI_PROVIDER=huggingface

# For Google Gemini  
AI_PROVIDER=gemini

# For Ollama
AI_PROVIDER=ollama
```

---

## 🧪 **Test Your Setup**

After setting up any provider:

1. **Restart the server**
2. **Test the connection**:
   ```cmd
   curl http://localhost:3001/test-api
   ```
   Or visit: `http://localhost:3001/test-api`

3. **Try generating a summary** in the app

---

## 📊 **Comparison**

| Provider | Cost | Speed | Quality | Setup |
|----------|-------|-------|--------|-------|
| Hugging Face | Free | Medium | Good | Easy |
| Gemini | Free tier | Fast | Very Good | Easy |
| Ollama | 100% Free | Medium | Good | Medium |
| OpenAI | Paid | Fast | Excellent | Easy |

---

## 🚨 **Troubleshooting**

**Hugging Face Issues**:
- Check your token is correct
- Ensure model name is correct

**Gemini Issues**:
- Verify API key is enabled
- Check your Google Cloud quota

**Ollama Issues**:
- Make sure Ollama is running: `ollama serve`
- Check model is downloaded: `ollama list`

**General Issues**:
- Restart server after changing .env
- Check console logs for specific errors
- Test with `/test-api` endpoint first

---

## 💡 **Recommendation**

For most users, **Hugging Face** is the best free option:
- ✅ Completely free
- ✅ Good quality summaries
- ✅ Easy setup
- ✅ No rate limiting issues

Choose the provider that fits your needs and budget!
