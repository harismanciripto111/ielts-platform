import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function startAttempt(req: Request, res: Response) {
  try {
    const { testSetId } = req.body;
    const attempt = await prisma.testAttempt.create({
      data: { userId: req.session.userId!, testSetId: Number(testSetId) },
    });
    return res.status(201).json(attempt);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function submitAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const questions = await prisma.question.findMany({
      where: { id: { in: answers.map((a: any) => a.questionId) } },
    });
    const answerData = answers.map((a: any) => {
      const q = questions.find((q) => q.id === a.questionId);
      const isCorrect = q?.answerKey ? q.answerKey.toLowerCase() === a.userAnswer.toLowerCase() : null;
      return { attemptId: Number(id), questionId: a.questionId, userAnswer: a.userAnswer, isCorrect };
    });
    await prisma.answer.createMany({ data: answerData });
    const correct = answerData.filter((a: any) => a.isCorrect).length;
    const total = answerData.length;
    const score = { correct, total, percentage: Math.round((correct / total) * 100) };
    const attempt = await prisma.testAttempt.update({
      where: { id: Number(id) },
      data: { submittedAt: new Date(), scores: score },
    });
    return res.json(attempt);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: Number(id) },
      include: { answers: { include: { question: true } } },
    });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    return res.json(attempt);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
