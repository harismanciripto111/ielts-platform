# PLAN.MD — IELTS Test Website (Self-Hosted / Local VPS)

## Vision
Website platform IELTS test lengkap yang bisa diakses semua orang, self-hosted di VPS lokal, tanpa JWT — auth berbasis session dengan username + password saja.

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 15 (App Router, stable) + Tailwind CSS v4 + shadcn/ui |
| Backend | Express.js (REST API) |
| Database | PostgreSQL + Prisma ORM |
| Auth | express-session + bcrypt (no JWT) |
| AI Scoring | Multi-provider: OpenAI GPT-4o / Google Gemini 1.5 Pro / Kimi AI (Moonshot) |
| Hosting | Self-hosted VPS (Docker Compose) |
| PDF Parser | Python (pdfplumber / PyMuPDF) |

---

## Fitur Utama

### Listening
- Upload audio MP3 per section (Section 1–4)
- Soal: multiple choice, fill in the blank, matching, map/diagram labelling
- Auto scoring — bandingkan jawaban user vs answer key
- Timer countdown per section

### Reading
- 3 passage per test (Academic atau General)
- Soal: multiple choice, True/False/Not Given, matching headings, sentence completion
- Auto scoring

### Writing
- Task 1: describe chart/graph/diagram (gambar diupload per soal)
- Task 2: argumentative essay
- AI scoring otomatis via multi-provider (OpenAI GPT-4o / Gemini 1.5 Pro / Kimi AI)
- Fallback manual scoring by admin jika AI error
- Rubric: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range — masing-masing 0–9

### Speaking (Phase 2)
- Upload rekaman audio
- AI transcribe + score (Whisper + GPT)

---

## Auth & User Management
- Register / Login dengan username + password
- Session-based (express-session + connect-pg-simple)
- Role: user / admin
- Admin bisa manage soal, review writing, export CSV

---

## Admin Panel
- Manajemen test set per buku Cambridge
- Review Writing submissions
- Export hasil test ke CSV
- Pilih AI scoring provider (OpenAI / Gemini / Kimi) via Admin UI

---

## AI Scoring Multi-Provider

| Provider | Model | API |
|----------|-------|-----|
| OpenAI | GPT-4o | api.openai.com |
| Google | Gemini 1.5 Pro | generativelanguage.googleapis.com |
| Kimi AI | moonshot-v1-8k | api.moonshot.cn |

Env vars yang dibutuhkan:
- OPENAI_API_KEY
- GEMINI_API_KEY
- MOONSHOT_API_KEY (Kimi AI)
- AI_SCORING_PROVIDER=openai|gemini|kimi (bisa dipilih via Admin UI, disimpan di DB/env)

---

## Data Source
- Cambridge IELTS 1–19 (PDF) — extract via Python parser
- Soal + answer key di-seed ke PostgreSQL
- Gambar (chart, map, diagram) di-extract dan disimpan di folder /public/images

---

## Struktur Folder Proyek

```
ielts-platform/
├── frontend/          # Next.js 15
│   ├── app/
│   │   ├── (auth)/    # login, register
│   │   ├── (user)/    # dashboard, test, result
│   │   └── (admin)/   # admin panel
│   ├── components/
│   └── lib/
├── backend/           # Express.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   │   └── aiScoring/ # openai.ts, gemini.ts, kimi.ts, index.ts
│   └── prisma/
├── parser/            # Python PDF parser
│   ├── extract.py
│   └── seed.py
├── docker-compose.yml
└── .env.example
```

---

## Roadmap Fase

| Fase | Fitur | Status |
|------|-------|--------|
| 1 | Setup proyek, DB schema, Auth | Planned |
| 2 | Listening module (soal + scoring) | Planned |
| 3 | Reading module (soal + scoring) | Planned |
| 4 | PDF parser + seed data Cambridge 1–19 | Planned |
| 5 | Writing + AI Scoring multi-provider | Planned |
| 6 | Admin panel + export CSV | Planned |
| 7 | Speaking (Whisper + GPT) | Planned |
| 8 | Deploy & performance tuning | Planned |

---

## Environment Variables (.env.example)

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ielts_db

# Session
SESSION_SECRET=your-secret-key-here

# AI Scoring
OPENAI_API_KEY=
GEMINI_API_KEY=
MOONSHOT_API_KEY=
AI_SCORING_PROVIDER=openai

# App
PORT=3001
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```
