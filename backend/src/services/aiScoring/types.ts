export interface ScoringRequest {
  question: string;
  essay: string;
  taskType: 1 | 2;
}

export interface ScoringResult {
  ta: number;
  cc: number;
  lr: number;
  gra: number;
  overall: number;
  feedback: { ta: string; cc: string; lr: string; gra: string; overall: string };
  provider: string;
  latencyMs: number;
}

export type ScoringProvider = 'openai' | 'gemini' | 'kimi';
