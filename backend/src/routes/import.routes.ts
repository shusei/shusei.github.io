import { Router } from 'express';
import { upload, analyzeCsv, startImport, analyzePdf } from '../controllers/import.controller';

const router = Router();

router.post('/analyze', upload.single('file'), analyzeCsv);
router.post('/pdf', upload.single('file'), analyzePdf);
router.post('/start', startImport);

export default router;
