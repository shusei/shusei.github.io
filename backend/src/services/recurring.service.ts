import { pool } from '../config/db';
import { generateTransactionHash } from '../utils/hash';

export const processRecurringPayments = async () => {
    console.log('Starting recurring payments check...');
    const client = await pool.connect();

    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1; // 1-12
        const dateStr = today.toISOString().split('T')[0];

        // Find due subscriptions
        // 1. Monthly: billing_day matches today
        // 2. Yearly: billing_month AND billing_day matches today
        const dueQuery = `
            SELECT * FROM subscriptions 
            WHERE is_active = true 
            AND (
                (billing_cycle = 'monthly' AND billing_day = $1)
                OR
                (billing_cycle = 'yearly' AND billing_month = $2 AND billing_day = $1)
            )
        `;

        const { rows: subscriptions } = await client.query(dueQuery, [currentDay, currentMonth]);
        console.log(`Found ${subscriptions.length} due subscriptions.`);

        let processedCount = 0;

        for (const sub of subscriptions) {
            // Generate Hash for Idempotency (Unique per subscription per date)
            const hash = generateTransactionHash({
                date: dateStr,
                amount: parseFloat(sub.amount),
                description: sub.name,
                type: sub.type // 'income' or 'expense'
            });

            try {
                await client.query(
                    `INSERT INTO transactions 
                    (user_id, amount, type, description, category, transaction_date, external_id_hash, source, subscription_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'recurring', $8)`,
                    [
                        sub.user_id,
                        sub.amount,
                        sub.type,
                        sub.name,
                        sub.category,
                        dateStr,
                        hash,
                        sub.id
                    ]
                );

                // Update last_run_at
                await client.query('UPDATE subscriptions SET last_run_at = NOW() WHERE id = $1', [sub.id]);
                processedCount++;

            } catch (err: any) {
                if (err.code === '23505') {
                    // Already processed for today, skip silently
                } else {
                    console.error(`Failed to process subscription ${sub.id}:`, err);
                }
            }
        }

        console.log(`Processed ${processedCount} recurring transactions.`);

    } catch (err) {
        console.error('Recurring payments job failed:', err);
    } finally {
        client.release();
    }
};
