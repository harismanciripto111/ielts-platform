import { Router } from 'express';
import { getBooks, getTestSets, getTestSet } from '../controllers/book.controller';

const router = Router();
router.get('/books', getBooks);
router.get('/books/:bookId/testsets', getTestSets);
router.get('/testsets/:testSetId', getTestSet);

export default router;
