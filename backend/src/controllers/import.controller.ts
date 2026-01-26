import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { generateMappingSuggestion } from '../services/mapping.service';
import { importQueue } from '../queues/import.queue';

// Configure Multer
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage: storage });

export const analyzeCsv = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Read only the first few lines to get headers
        const records = parse(fileContent, {
            to: 1, // Read only header
            skip_empty_lines: true
        });

        if (records.length === 0) return res.status(400).json({ error: 'Empty CSV' });

        const headers = records[0];
        const suggestion = await generateMappingSuggestion(headers);

        res.json({
            fileId: req.file.filename,
            headers,
            suggestion
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to analyze CSV' });
    }
};

export const startImport = async (req: Request, res: Response) => {
    try {
        const { fileId, mapping, userId } = req.body;
        if (!fileId || !mapping || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const filePath = path.join(uploadDir, fileId);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Add to Queue
        const job = await importQueue.add('csv-import', {
            filePath,
            userId,
            mapping
        });

        res.json({ message: 'Import started', jobId: job.id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to start import' });
    }
};

import { extractTextFromPdf } from '../services/pdf.service';
import { parseBankStatement } from '../services/gemini.service';

export const analyzePdf = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);

        // 1. Extract Text
        const text = await extractTextFromPdf(fileBuffer);

        // 2. Parse with AI
        const transactions = await parseBankStatement(text);

        res.json({
            fileId: req.file.filename,
            transactions
        });

    } catch (err: any) {
        console.error(err);
        if (err.message === 'RATE_LIMIT') {
            return res.status(429).json({ error: 'AI 服務忙碌中 (Rate Limit)，請稍後再試' });
        }
        res.status(500).json({ error: 'Failed to analyze PDF' });
    }
};
