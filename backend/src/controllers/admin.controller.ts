import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSubmissions(_req: Request, res: Response) {
  const subs = await prisma.writingSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { username: true } } },
  });
  return res.json(subs);
}

export async function manualScore(req: Request, res: Response) {
  const { taScore, ccScore, lrScore, graScore, overallScore, adminFeedback } = req.body;
  const sub = await prisma.writingSubmission.update({
    where: { id: Number(req.params.id) },
    data: { taScore, ccScore, lrScore, graScore, overallScore, adminFeedback, status: 'MANUAL_SCORED', scoringProvider: 'manual', scoredAt: new Date() },
  });
  return res.json(sub);
}

export async function getSettings(_req: Request, res: Response) {
  const settings = await prisma.settings.findMany();
  return res.json(Object.fromEntries(settings.map((s) => [s.key, s.value])));
}

export async function updateSettings(req: Request, res: Response) {
  const updates: Record<string, string> = req.body;
  for (const [key, value] of Object.entries(updates)) {
    await prisma.settings.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  return res.json({ message: 'Settings updated' });
}

export async function getAiLogs(_req: Request, res: Response) {
  const logs = await prisma.aiScoringLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return res.json(logs);
}
