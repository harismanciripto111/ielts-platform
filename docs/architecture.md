# ARCHITECTURE.MD — IELTS Platform

## System Overview

User Browser -> Next.js 15 Frontend (:3000) -> Express.js API Server (:3001) -> PostgreSQL (:5432) via Prisma ORM

Express.js juga terhubung ke AI Scoring Service yang support 3 provider:
- OpenAI GPT-4o
- Google Gemini 1.5 Pro
- Kimi AI (Moonshot)

---

## Tech Stack

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Frontend | Next.js | 15.x (stable) |
| CSS Framework | Tailwind CSS | v4 |
| UI Components | shadcn/ui | latest |
| Backend | Express.js | 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Auth | express-session + bcrypt | - |
| AI Scoring | OpenAI / Gemini / Kimi | multi-provider |
| Container | Docker Compose | v2 |

---

## Database Schema (Prisma)

Model User:
- id: Int (PK, autoincrement)
- username: String (unique)
- passwordHash: String
- role: Role (default USER)
- createdAt: DateTime
- Relations: testAttempts, writingSubs

Enum Role: USER, ADMIN

Model Book:
- id, name (e.g. "Cambridge IELTS 15"), year
- Relations: testSets

Model TestSet:
- id, bookId, testNumber (1-4), type ("Academic"|"General")
- Relations: book, sections, testAttempts

Model Section:
- id, testSetId, type (SectionType), order, audioUrl?, passage?
- Relations: testSet, questions

Enum SectionType: LISTENING, READING, WRITING

Model Question:
- id, sectionId, questionNo, questionType, content, imageUrl?, options (Json)?, answerKey?
- Relations: section, answers

Enum QuestionType: MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE_NG, MATCHING, SENTENCE_COMPLETION, SHORT_ANSWER, WRITING_TASK

Model TestAttempt:
- id, userId, testSetId, startedAt, submittedAt?, scores (Json)?
- Relations: user, testSet, answers

Model Answer:
- id, attemptId, questionId, userAnswer, isCorrect?
- Relations: attempt, question

Model WritingSubmission:
- id, userId, questionId, essayText, taskType (1 or 2)
- status: WritingStatus (default PENDING)
- scoringProvider: String? ("openai" | "gemini" | "kimi" | "manual")
- taScore, ccScore, lrScore, graScore, overallScore: Float?
- aiFeedback: Json?, adminFeedback: String?, scoredAt?, createdAt
- Relations: user

Enum WritingStatus: PENDING, AI_SCORED, MANUAL_SCORED, FAILED

Model Settings:
- id, key (unique), value

Model AiScoringLog:
- id, submissionId, provider, latencyMs, success, errorMsg?, createdAt

---

## API Routes

Auth:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

Test:
- GET  /api/books
- GET  /api/books/:bookId/testsets
- GET  /api/testsets/:testSetId
- POST /api/attempts              (mulai test)
- POST /api/attempts/:id/submit   (submit test)
- GET  /api/attempts/:id/result

Writing:
- POST /api/writing/submit
- GET  /api/writing/submissions
- GET  /api/writing/submissions/:id
- POST /api/writing/score/:id     (trigger AI scoring)

Admin:
- GET  /api/admin/submissions
- PUT  /api/admin/submissions/:id/score  (manual score)
- GET  /api/admin/settings
- PUT  /api/admin/settings               (ganti AI provider)
- GET  /api/admin/ai-logs

---

## Docker Compose Services

Services:
1. postgres (image: postgres:16, port 5432, volume pgdata)
2. backend (build ./backend, port 3001, depends on postgres)
3. frontend (build ./frontend, port 3000, depends on backend)

---

## Session Config

express-session dengan PgSession store:
- secret: SESSION_SECRET env
- resave: false
- saveUninitialized: false
- cookie: httpOnly=true, secure=production, maxAge=7 days
- tableName: user_sessions

---

## AI Scoring Service Flow

1. POST /api/writing/score/:id dipanggil
2. Controller load WritingSubmission dari DB
3. Panggil scoreEssay(req) dari aiScoring/index.ts
4. index.ts pilih provider dari AI_SCORING_PROVIDER env (default: openai)
5. Jika provider gagal -> fallback ke provider berikutnya (openai -> gemini -> kimi)
6. Hasil score disimpan ke WritingSubmission (taScore, ccScore, lrScore, graScore, overallScore, aiFeedback)
7. Log disimpan ke AiScoringLog (provider, latencyMs, success/error)
8. Status update: AI_SCORED atau FAILED
