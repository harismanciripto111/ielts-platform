import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScoringRequest, ScoringResult } from './types';
import { buildPrompt, parseScore } from './utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function scoreWithGemini(req: ScoringRequest): Promise<ScoringResult> {
  const start = Date.now();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: buildPrompt(req) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });
  const raw = result.response.text();
  return { ...parseScore(raw), provider: 'gemini', latencyMs: Date.now() - start };
}
