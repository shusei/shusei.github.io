import { Router } from 'express';
import { createTransaction, smartParse, getTransactions } from '../controllers/transaction.controller';

const router = Router();

router.post('/', createTransaction);
router.get('/', getTransactions);
router.post('/smart', smartParse);

export default router;
