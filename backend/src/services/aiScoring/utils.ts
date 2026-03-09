import { ScoringRequest } from './types';

export function buildPrompt(req: ScoringRequest): string {
  return 'You are an expert IELTS examiner. Score the following IELTS Writing Task ' + req.taskType + ' essay.\n\nQuestion: ' + req.question + '\n\nEssay:\n' + req.essay + '\n\nScore each criterion from 0.0 to 9.0 in 0.5 increments: Task Achievement (TA), Coherence and Cohesion (CC), Lexical Resource (LR), Grammatical Range and Accuracy (GRA).\n\nRespond ONLY in JSON: {"ta":0.0,"cc":0.0,"lr":0.0,"gra":0.0,"overall":0.0,"feedback":{"ta":"...","cc":"...","lr":"...","gra":"...","overall":"..."}}';
}

export function parseScore(raw: string) {
  const parsed = JSON.parse(raw);
  const avg = (parsed.ta + parsed.cc + parsed.lr + parsed.gra) / 4;
  const overall = Math.round(avg * 2) / 2;
  return { ...parsed, overall };
}
