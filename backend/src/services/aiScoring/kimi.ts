import axios from 'axios';
import { ScoringRequest, ScoringResult } from './types';
import { buildPrompt, parseScore } from './utils';

export async function scoreWithKimi(req: ScoringRequest): Promise<ScoringResult> {
  const start = Date.now();
  const response = await axios.post(
    'https://api.moonshot.cn/v1/chat/completions',
    { model: 'moonshot-v1-8k', messages: [{ role: 'user', content: buildPrompt(req) }], temperature: 0.3 },
    { headers: { Authorization: 'Bearer ' + process.env.MOONSHOT_API_KEY, 'Content-Type': 'application/json' } }
  );
  const raw = response.data.choices[0].message.content;
  return { ...parseScore(raw), provider: 'kimi', latencyMs: Date.now() - start };
}
