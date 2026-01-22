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
// Tasks Endpoint
app.get('/api/tasks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create Task Endpoint
app.post('/api/tasks', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const { rows } = await pool.query(
            "INSERT INTO tasks (title, status) VALUES ($1, 'pending') RETURNING *",
            [title]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
