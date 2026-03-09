import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { scoreEssay } from '../services/aiScoring';

const prisma = new PrismaClient();

export async function submitWriting(req: Request, res: Response) {
  try {
    const { questionId, essayText, taskType } = req.body;
    const sub = await prisma.writingSubmission.create({
      data: { userId: req.session.userId!, questionId: Number(questionId), essayText, taskType: Number(taskType) },
    });
    return res.status(201).json(sub);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSubmissions(req: Request, res: Response) {
  const subs = await prisma.writingSubmission.findMany({
    where: { userId: req.session.userId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(subs);
}

export async function getSubmission(req: Request, res: Response) {
  const sub = await prisma.writingSubmission.findUnique({ where: { id: Number(req.params.id) } });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  return res.json(sub);
}

export async function triggerScore(req: Request, res: Response) {
  try {
    const sub = await prisma.writingSubmission.findUnique({ where: { id: Number(req.params.id) } });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    const question = await prisma.question.findUnique({ where: { id: sub.questionId } });
    const result = await scoreEssay({ question: question?.content || '', essay: sub.essayText, taskType: sub.taskType as 1 | 2 });
    await prisma.writingSubmission.update({
      where: { id: sub.id },
      data: {
        taScore: result.ta, ccScore: result.cc, lrScore: result.lr, graScore: result.gra,
        overallScore: result.overall, aiFeedback: result.feedback,
        scoringProvider: result.provider, status: 'AI_SCORED', scoredAt: new Date(),
      },
    });
    await prisma.aiScoringLog.create({
      data: { submissionId: sub.id, provider: result.provider, latencyMs: result.latencyMs, success: true },
    });
    return res.json({ message: 'Scored successfully', result });
  } catch (err: any) {
    await prisma.writingSubmission.update({ where: { id: Number(req.params.id) }, data: { status: 'FAILED' } });
    return res.status(500).json({ error: err.message });
  }
}
