# CODING-GUIDE.MD — IELTS Platform

## Panduan Coding dan Konvensi

---

## 1. Setup Proyek

### Init Next.js 15 (Frontend)

npx create-next-app@15 frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

### Init Express (Backend)

mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client express-session connect-pg-simple bcrypt cors dotenv
npm install -D typescript @types/express @types/node @types/express-session @types/bcrypt ts-node nodemon
npx prisma init

### AI Scoring Dependencies

npm install openai @google/generative-ai axios

---

## 2. Konvensi Kode

### Naming
- File: kebab-case (auth.controller.ts, writing.service.ts)
- Component: PascalCase (TestCard.tsx, WritingEditor.tsx)
- Variable/Function: camelCase (getTestById, scoreEssay)
- DB column: snake_case (Prisma maps otomatis)
- Env var: SCREAMING_SNAKE_CASE

### TypeScript
- Selalu define interface/type untuk request body dan response
- Tidak ada any — gunakan unknown lalu narrowing
- Async functions selalu pakai try/catch

---

## 3. AI Scoring Service

### File: backend/services/aiScoring/types.ts

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
  feedback: {
    ta: string;
    cc: string;
    lr: string;
    gra: string;
    overall: string;
  };
  provider: string;
  latencyMs: number;
}

export type ScoringProvider = 'openai' | 'gemini' | 'kimi';

### File: backend/services/aiScoring/index.ts (Factory with fallback)

import { scoreWithOpenAI } from './openai';
import { scoreWithGemini } from './gemini';
import { scoreWithKimi } from './kimi';
import { ScoringRequest, ScoringResult, ScoringProvider } from './types';

const FALLBACK_ORDER: ScoringProvider[] = ['openai', 'gemini', 'kimi'];

export async function scoreEssay(req: ScoringRequest): Promise<ScoringResult> {
  const primary = (process.env.AI_SCORING_PROVIDER || 'openai') as ScoringProvider;
  const providers = [primary, ...FALLBACK_ORDER.filter(p => p !== primary)];
  for (const provider of providers) {
    try {
      if (provider === 'openai') return await scoreWithOpenAI(req);
      if (provider === 'gemini') return await scoreWithGemini(req);
      if (provider === 'kimi') return await scoreWithKimi(req);
    } catch (err) {
      console.error('[AI Scoring]', provider, 'failed:', err);
    }
  }
  throw new Error('All AI scoring providers failed');
}

### File: backend/services/aiScoring/openai.ts

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

### File: backend/services/aiScoring/gemini.ts

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

### File: backend/services/aiScoring/kimi.ts

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

### File: backend/services/aiScoring/utils.ts

export function buildPrompt(req: any): string {
  return 'You are an expert IELTS examiner. Score the following IELTS Writing Task ' + req.taskType + ' essay.\n\nQuestion: ' + req.question + '\n\nEssay:\n' + req.essay + '\n\nScore each criterion 0.0-9.0 in 0.5 increments: TA, CC, LR, GRA.\nRespond ONLY in JSON: { "ta": 0.0, "cc": 0.0, "lr": 0.0, "gra": 0.0, "overall": 0.0, "feedback": { "ta": "...", "cc": "...", "lr": "...", "gra": "...", "overall": "..." } }';
}

export function parseScore(raw: string): any {
  const parsed = JSON.parse(raw);
  const avg = (parsed.ta + parsed.cc + parsed.lr + parsed.gra) / 4;
  const overall = Math.round(avg * 2) / 2;
  return { ...parsed, overall };
}

---

## 4. Auth Middleware

### File: backend/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  next();
}

---

## 5. Python PDF Parser

### File: parser/extract.py

import pdfplumber
import json
from pathlib import Path

def extract_questions(pdf_path: str) -> dict:
    questions = []
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"
    return { "source": Path(pdf_path).stem, "questions": questions }

if __name__ == "__main__":
    import sys
    pdf_file = sys.argv[1]
    result = extract_questions(pdf_file)
    output_file = pdf_file.replace('.pdf', '.json')
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("Extracted to", output_file)

---

## 6. Git Workflow

Branch naming:
- feat/listening-module
- feat/reading-module
- feat/writing-ai-scoring
- fix/session-expiry
- chore/seed-cambridge-15

Commit format (Conventional Commits):
- feat: add AI scoring with multi-provider fallback
- fix: session not persisting on refresh
- chore: seed Cambridge IELTS 15 questions
- docs: update architecture with AI scoring routes

---

## 7. Environment Variables (.env)

DATABASE_URL=postgresql://ielts_user:secret@localhost:5432/ielts_db
SESSION_SECRET=your-very-long-random-secret
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
MOONSHOT_API_KEY=sk-...
AI_SCORING_PROVIDER=openai
PORT=3001
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
