const axios = require('axios');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.timeout = 120000; // Increased to 2 minutes for Ollama
  }

  async summarize(text) {
    // Quick local summarization fallback
    if (this.provider === 'local') {
      return this.summarizeLocally(text);
    }

    switch (this.provider) {
      case 'huggingface':
        return await this.summarizeWithHuggingFace(text);
      case 'gemini':
        return await this.summarizeWithGemini(text);
      case 'ollama':
        return await this.summarizeWithOllama(text);
      case 'openai':
      default:
        return await this.summarizeWithOpenAI(text);
    }
  }

  summarizeLocally(text) {
    try {
      console.log('Using local summarization');

      // Clean and prepare text
      const cleanText = text.trim();
      if (!cleanText) {
        return '• No content to summarize';
      }

      const words = cleanText.split(/\s+/);
      const wordCount = words.length;
      const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);

      // Extract key concepts (simple heuristic)
      const keyWords = words.filter(word =>
        word.length > 5 &&
        !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'this', 'that', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word.toLowerCase())
      ).slice(0, 5);

      // Generate summary based on content length
      let summary = '';

      if (wordCount < 20) {
        summary = `• Brief note about ${keyWords[0] || 'main topic'}`;
      } else if (wordCount < 50) {
        summary = `• Key points about ${keyWords[0] || 'main topic'}:\n`;
        summary += `  • Covers ${keyWords[1] || 'important concept'}\n`;
        summary += `  • Includes ${keyWords[2] || 'relevant details'}`;
      } else {
        summary = `• Summary of ${keyWords[0] || 'main topic'}:\n`;
        summary += `  • Main concepts: ${keyWords.slice(0, 3).join(', ')}\n`;
        summary += `  • Key details: ${sentences.slice(0, 2).join('. ')}.\n`;
        summary += `  • Total: ${wordCount} words analyzed`;
      }

      return summary;
    } catch (error) {
      console.error('Local summarization error:', error.message);
      return `• Summary error: ${error.message}`;
    }
  }

  async summarizeWithOpenAI(text) {
    try {
      console.log('Using OpenAI for summarization');

      const response = await axios.post(
        process.env.LLM_API_URL,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes study notes into concise bullet points.'
            },
            {
              role: 'user',
              content: `Summarize the following study note into 3–5 concise bullet points focusing only on key concepts:\n\n${text}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response format');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      throw new Error(`OpenAI API failed: ${error.message}`);
    }
  }

  async summarizeWithHuggingFace(text) {
    try {
      console.log('Using Hugging Face for summarization');

      const response = await axios.post(
        process.env.HUGGINGFACE_API_URL,
        {
          inputs: `Summarize the following study note into 3–5 concise bullet points focusing only on key concepts:\n\n${text}`,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.3,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      console.log('Hugging Face response status:', response.status);
      console.log('Hugging Face response:', response.data);

      if (!response.data?.[0]?.generated_text) {
        throw new Error('Invalid Hugging Face response format');
      }

      return response.data[0].generated_text;
    } catch (error) {
      console.error('Hugging Face API Error:', error.message);
      if (error.response) {
        console.error('Hugging Face Error Details:', error.response.data);
      }
      throw new Error(`Hugging Face API failed: ${error.message}`);
    }
  }

  async summarizeWithGemini(text) {
    try {
      console.log('Using Google Gemini for summarization');

      const response = await axios.post(
        process.env.GEMINI_API_URL,
        {
          contents: [{
            parts: [{
              text: `Summarize the following study note into 3–5 concise bullet points focusing only on key concepts:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY
          },
          timeout: this.timeout
        }
      );

      console.log('Gemini response status:', response.status);
      console.log('Gemini response data:', response.data);

      // Check if response has the expected structure
      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        console.log('Gemini response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid Gemini response format - missing candidates');
      }

      // Check if candidate has content and parts
      const candidate = response.data.candidates[0];
      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        console.log('Gemini candidate structure:', JSON.stringify(candidate, null, 2));
        throw new Error('Invalid Gemini response format - missing content/parts');
      }

      return candidate.content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      if (error.response) {
        console.error('Gemini Error Details:', error.response.data);
      }
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }

  async summarizeWithOllama(text) {
    try {
      console.log('Using Ollama for summarization');
      console.log('Ollama URL:', process.env.OLLAMA_API_URL);
      console.log('Ollama Model:', process.env.OLLAMA_MODEL);

      const response = await axios.post(
        process.env.OLLAMA_API_URL,
        {
          model: process.env.OLLAMA_MODEL || 'mistral',
          prompt: `Summarize the following study note into 3-5 concise bullet points focusing only on key concepts:\n\n${text}`,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      console.log('Ollama response status:', response.status);
      console.log('Ollama response data:', response.data);

      if (!response.data?.response) {
        throw new Error('Invalid Ollama response format - missing response');
      }

      return response.data.response;
    } catch (error) {
      console.error('Ollama API Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Please start Ollama with "ollama serve"');
      }
      if (error.response?.status === 404) {
        throw new Error('Ollama model not found. Please run "ollama pull mistral"');
      }
      throw new Error(`Ollama API failed: ${error.message}`);
    }
  }

  async generateQuiz(text) {
    if (this.provider === 'local') {
      return this.generateQuizLocally(text);
    }
    try {
      const prompt = `Based on the following study note, generate 3-5 quiz questions with answers. Return ONLY a valid JSON array in this exact format, no other text:
[{"question": "...", "answer": "..."}, ...]

Study note:
${text}`;

      let rawResult;
      switch (this.provider) {
        case 'gemini':
          rawResult = await this.summarizeWithGemini(prompt);
          break;
        case 'huggingface':
          rawResult = await this.summarizeWithHuggingFace(prompt);
          break;
        case 'ollama':
          rawResult = await this.summarizeWithOllama(prompt);
          break;
        default:
          rawResult = await this.summarizeWithOpenAI(prompt);
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.generateQuizLocally(text);
    } catch (error) {
      console.error('Quiz generation error:', error.message);
      return this.generateQuizLocally(text);
    }
  }

  generateQuizLocally(text) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const quiz = [];
    const usedIdx = new Set();
    while (quiz.length < Math.min(4, sentences.length) && usedIdx.size < sentences.length) {
      const idx = Math.floor(Math.random() * sentences.length);
      if (usedIdx.has(idx)) continue;
      usedIdx.add(idx);
      const sentence = sentences[idx];
      const words = sentence.split(' ');
      if (words.length < 5) continue;
      // Blank out a key word for fill-in-the-blank style
      const blankIdx = Math.floor(words.length * 0.6);
      const answer = words[blankIdx];
      const question = words.map((w, i) => i === blankIdx ? '______' : w).join(' ') + '?';
      quiz.push({ question: `Fill in the blank: "${question}"`, answer });
    }
    if (quiz.length === 0) {
      quiz.push({ question: 'What is the main topic of this note?', answer: 'See the note content above.' });
    }
    return quiz;
  }

  async testConnection() {
    const testText = "This is a test note about artificial intelligence and machine learning concepts.";

    try {
      const result = await this.summarize(testText);
      console.log(`${this.provider} API test successful`);
      return { success: true, provider: this.provider, result };
    } catch (error) {
      console.error(`${this.provider} API test failed:`, error.message);
      return { success: false, provider: this.provider, error: error.message };
    }
  }
}

module.exports = new AIService();
