import { Request, Response } from 'express';
import { pool } from '../config/db';
import { generateTransactionHash } from '../utils/hash';
import { parseTransactionInput } from '../services/gemini.service';

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { amount, type, description, category, date, tags, user_id } = req.body;

        if (!amount || !type || !description || !user_id) {
            return res.status(400).json({ error: 'Missing required fields: amount, type, description, user_id' });
        }

        const transactionDate = date || new Date().toISOString().split('T')[0];

        // Idempotency Hash
        const hash = generateTransactionHash({
            date: transactionDate,
            amount,
            description,
            type
        });

        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO transactions 
                (user_id, amount, type, description, category, tags, transaction_date, external_id_hash, source)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'api')
                RETURNING *`,
                [user_id, amount, type, description, category, tags || [], transactionDate, hash]
            );
            res.json(result.rows[0]);
        } catch (err: any) {
            if (err.code === '23505') { // Unique violation
                // Check if it's the hash constraint
                if (err.constraint === 'idx_transactions_dedup' || err.detail?.includes('external_id_hash')) {
                    // Fetch existing
                    const existing = await client.query(
                        'SELECT * FROM transactions WHERE user_id = $1 AND external_id_hash = $2',
                        [user_id, hash]
                    );
                    return res.status(200).json({ message: 'Transaction already exists', transaction: existing.rows[0] });
                }
            }
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const smartParse = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        const result = await parseTransactionInput(text);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to parse input' });
    }
};
