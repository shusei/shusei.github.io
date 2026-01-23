import { Router } from 'express';
import { upload, analyzeCsv, startImport } from '../controllers/import.controller';

const router = Router();

router.post('/analyze', upload.single('file'), analyzeCsv);
router.post('/start', startImport);

export default router;
