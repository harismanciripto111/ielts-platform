import { scoreWithOpenAI } from './openai';
import { scoreWithGemini } from './gemini';
import { scoreWithKimi } from './kimi';
import { ScoringRequest, ScoringResult, ScoringProvider } from './types';

const FALLBACK_ORDER: ScoringProvider[] = ['openai', 'gemini', 'kimi'];

export async function scoreEssay(req: ScoringRequest): Promise<ScoringResult> {
  const primary = (process.env.AI_SCORING_PROVIDER || 'openai') as ScoringProvider;
  const providers = [primary, ...FALLBACK_ORDER.filter((p) => p !== primary)];
  for (const provider of providers) {
    try {
      if (provider === 'openai') return await scoreWithOpenAI(req);
      if (provider === 'gemini') return await scoreWithGemini(req);
      if (provider === 'kimi') return await scoreWithKimi(req);
    } catch (err) {
      console.error('[AI Scoring] ' + provider + ' failed:', err);
    }
  }
  throw new Error('All AI scoring providers failed');
}
