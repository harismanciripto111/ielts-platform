import OpenAI from 'openai';
import { ScoringRequest, ScoringResult } from './types';
import { buildPrompt, parseScore } from './utils';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function scoreWithOpenAI(req: ScoringRequest): Promise<ScoringResult> {
  const start = Date.now();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildPrompt(req) }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });
  const raw = response.choices[0].message.content!;
  return { ...parseScore(raw), provider: 'openai', latencyMs: Date.now() - start };
}
