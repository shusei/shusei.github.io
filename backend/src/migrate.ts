import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('Error: DATABASE_URL environment variable is not set.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const migrationFilePath = path.join(__dirname, '../supabase/migrations/20260122_initial_schema.sql');
        const sql = fs.readFileSync(migrationFilePath, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration executed successfully!');

    } catch (err) {
        console.error('Error executing migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
};

runMigration();
