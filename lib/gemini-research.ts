// lib/gemini-research.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function geminiResearch(query: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Free tier safe

    const result = await model.generateContent(query);
    const response = await result.response;
    const text = response.text();

    return text || 'Gemini returned empty — quick breath, retry? ❤️';
  } catch (error: any) {
    console.error('Gemini error:', error);
    return `Hey buddy ❤️ Gemini research hiccup: ${error.message}. Check key or limits?`;
  }
}
