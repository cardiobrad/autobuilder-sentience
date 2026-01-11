// lib/gemini-research.ts
// Updated January 11, 2026 - Grok's final safe version
// Forces clean string output, extra error handling, no objects that break JSON.stringify

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function geminiResearch(query: string): Promise<string> {
  try {
    // Use the most reliable free-tier model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate content with safety settings to avoid weird output
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    // Safely extract text - never return raw response object
    const response = await result.response;
    let text = response.text?.() || '';

    // Clean up any invisible/control characters that break JSON
    text = text.replace(/[-\u001F\u007F-\u009F]/g, '').trim();

    if (!text) {
      return 'Gemini returned empty — quick breath, retry? ❤️';
    }

    return text;
  } catch (error: any) {
    console.error('Gemini research error:', error);

    // Return plain string error - never an object
    const errorMsg = error.message || 'Unknown Gemini error';
    return `Hey buddy ❤️ Gemini research hiccup: ${errorMsg}. Try again or check API key/limits?`;
  }
}
