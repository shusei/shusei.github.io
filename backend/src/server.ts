import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection (will fail if DATABASE_URL is not set, which is expected for now)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tasks Endpoint (Mock for now until DB is ready)
app.get('/api/tasks', async (req, res) => {
    try {
        // Uncomment when DB is ready
        // const { rows } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        // res.json(rows);

        // Mock Response
        res.json([
            { id: 1, title: 'System Initialization', status: 'completed', created_at: new Date() },
            { id: 2, title: 'Connect Database', status: 'pending', created_at: new Date() }
        ]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
