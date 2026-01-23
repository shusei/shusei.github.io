import { Queue, Worker, Job } from 'bullmq';
import connection from '../config/redis';
import { pool } from '../config/db';
import { generateTransactionHash } from '../utils/hash';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export const importQueue = new Queue('import-queue', { connection });

const processImportJob = async (job: Job) => {
    const { filePath, userId, mapping } = job.data;
    console.log(`Processing job ${job.id} for user ${userId}`);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        console.log(`Parsed ${records.length} rows. Starting DB insert...`);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let insertedCount = 0;
            let skippedCount = 0;

            for (const record of records as any[]) {
                // Apply mapping
                const amount = parseFloat(record[mapping.amount]);
                const date = record[mapping.date] || new Date().toISOString().split('T')[0];
                const description = record[mapping.description] || 'Imported Transaction';
                const type = record[mapping.type] || (amount < 0 ? 'expense' : 'income');
                const absAmount = Math.abs(amount);

                // Hash for idempotency
                const hash = generateTransactionHash({
                    date,
                    amount: absAmount,
                    description,
                    type
                });

                try {
                    await client.query(
                        `INSERT INTO transactions 
                        (user_id, amount, type, description, category, transaction_date, external_id_hash, source)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, 'csv')`,
                        [userId, absAmount, type, description, 'Uncategorized', date, hash]
                    );
                    insertedCount++;
                } catch (err: any) {
                    if (err.code === '23505') { // Unique violation
                        skippedCount++;
                    } else {
                        throw err;
                    }
                }
            }

            await client.query('COMMIT');
            console.log(`Job ${job.id} completed. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

            // Cleanup file
            fs.unlinkSync(filePath);

            return { insertedCount, skippedCount };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error(`Job ${job.id} failed:`, err);
        throw err;
    }
};

const worker = new Worker('import-queue', processImportJob, { connection });

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
