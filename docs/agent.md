# AGENT.MD — AI Scoring Agent (Multi-Provider)

## Overview
Agent AI untuk scoring Writing IELTS secara otomatis. Support multi-provider: OpenAI GPT-4o, Google Gemini 1.5 Pro, dan Kimi AI (Moonshot).

---

## Provider Support

| Provider | Model | Base URL | Env Key |
|----------|-------|----------|---------|
| OpenAI | gpt-4o | https://api.openai.com/v1 | OPENAI_API_KEY |
| Google Gemini | gemini-1.5-pro | https://generativelanguage.googleapis.com | GEMINI_API_KEY |
| Kimi AI | moonshot-v1-8k | https://api.moonshot.cn/v1 | MOONSHOT_API_KEY |

---

## Rubric Scoring IELTS Writing

Setiap provider menilai 4 kriteria, masing-masing 0.0–9.0:

| Kriteria | Kode | Deskripsi |
|----------|------|-----------|
| Task Achievement | TA | Ketercapaian tugas, kelengkapan ide |
| Coherence & Cohesion | CC | Alur, paragraf, cohesive devices |
| Lexical Resource | LR | Kosakata, variasi, akurasi |
| Grammatical Range & Accuracy | GRA | Struktur kalimat, variasi, akurasi |

Overall Band Score = rata-rata 4 kriteria, dibulatkan ke 0.5 terdekat.

---

## Prompt Template (Task 2 Essay)

You are an expert IELTS examiner. Score the following IELTS Writing Task 2 essay.

Question: {question}

Essay: {essay}

Score each criterion from 0.0 to 9.0 in 0.5 increments: Task Achievement (TA), Coherence and Cohesion (CC), Lexical Resource (LR), Grammatical Range and Accuracy (GRA).

Provide: 1) Score for each criterion, 2) Overall Band Score (average rounded to nearest 0.5), 3) Brief feedback per criterion (2-3 sentences), 4) Overall feedback (3-4 sentences).

Respond in JSON: { "ta": 0.0, "cc": 0.0, "lr": 0.0, "gra": 0.0, "overall": 0.0, "feedback": { "ta": "...", "cc": "...", "lr": "...", "gra": "...", "overall": "..." } }

---

## Service Architecture

backend/services/aiScoring/
- index.ts          (Factory — pilih provider berdasarkan AI_SCORING_PROVIDER env)
- openai.ts         (OpenAI GPT-4o scorer)
- gemini.ts         (Google Gemini 1.5 Pro scorer)
- kimi.ts           (Kimi AI Moonshot scorer)
- types.ts          (Shared types: ScoringRequest, ScoringResult)
- utils.ts          (buildPrompt, parseScore)

---

## Fallback Logic

1. Coba provider utama (dari AI_SCORING_PROVIDER env)
2. Jika error/timeout -> coba provider fallback (urutan: openai -> gemini -> kimi)
3. Jika semua gagal -> status pending_manual, admin review manual
4. Semua error di-log ke tabel ai_scoring_logs

---

## Rate Limits & Cost Estimate

| Provider | Rate Limit | Est. Cost per Essay |
|----------|------------|---------------------|
| OpenAI GPT-4o | 500 RPM | ~$0.01 |
| Gemini 1.5 Pro | 1000 RPM | ~$0.002 |
| Kimi AI | 200 RPM | ~$0.003 |

---

## Admin Controls
- Pilih provider aktif via Admin UI (disimpan di tabel settings)
- Toggle fallback on/off
- Lihat log scoring (provider used, latency, error)
- Re-score submission dengan provider berbeda
