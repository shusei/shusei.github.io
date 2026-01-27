import { pool } from './config/db';

const checkDb = async () => {
    const userId = "b8b8984a-0782-4e36-b5ad-ce42ae297d1b";
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT count(*) FROM transactions WHERE user_id = $1', [userId]);
        console.log(`Transactions count for user ${userId}:`, res.rows[0].count);

        if (parseInt(res.rows[0].count) > 0) {
            const recent = await client.query("SELECT count(*) FROM transactions WHERE user_id = $1 AND transaction_date >= '2026-01-01'", [userId]);
            console.log('Transactions in 2026:', recent.rows[0].count);

            const rows = await client.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC LIMIT 5', [userId]);
            console.log('Latest 5 by Transaction Date:', rows.rows.map(r => ({ date: r.transaction_date, amount: r.amount })));
        }
        client.release();
    } catch (err) {
        console.error('Error checking DB:', err);
    } finally {
        await pool.end();
    }
};

checkDb();
