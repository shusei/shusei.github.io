import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

// Helper to check connection
export const checkConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Database Connected:', res.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Database Connection Failed:', err);
        return false;
    }
};

export default pool;
