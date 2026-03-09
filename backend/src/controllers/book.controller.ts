import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getBooks(_req: Request, res: Response) {
  const books = await prisma.book.findMany({ orderBy: { year: 'asc' } });
  return res.json(books);
}

export async function getTestSets(req: Request, res: Response) {
  const { bookId } = req.params;
  const testSets = await prisma.testSet.findMany({
    where: { bookId: Number(bookId) },
    orderBy: { testNumber: 'asc' },
  });
  return res.json(testSets);
}

export async function getTestSet(req: Request, res: Response) {
  const { testSetId } = req.params;
  const testSet = await prisma.testSet.findUnique({
    where: { id: Number(testSetId) },
    include: { sections: { include: { questions: true } } },
  });
  if (!testSet) return res.status(404).json({ error: 'TestSet not found' });
  return res.json(testSet);
}
