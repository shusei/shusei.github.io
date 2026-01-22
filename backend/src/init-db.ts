import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
`;

async function initDb() {
    try {
        console.log("Connecting to database...");
        await pool.query(createTableQuery);
        console.log("Table 'tasks' created successfully.");

        // Insert some initial data if empty
        const { rows } = await pool.query('SELECT COUNT(*) FROM tasks');
        if (parseInt(rows[0].count) === 0) {
            await pool.query("INSERT INTO tasks (title, status) VALUES ('Database Connected', 'completed')");
            console.log("Initial data inserted.");
        } else {
            console.log("Table already has data, skipping initialization.");
        }
    } catch (err) {
        console.error("Error initializing DB:", err);
    } finally {
        await pool.end();
    }
}

initDb();
