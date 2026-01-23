import { Router } from 'express';
import { createTransaction, smartParse } from '../controllers/transaction.controller';

const router = Router();

router.post('/', createTransaction);
router.post('/smart', smartParse);

export default router;
