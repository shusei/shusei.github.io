import fs from 'fs';
import path from 'path';
import { query, checkConnection } from '../src/db';

async function runMigration() {
    console.log('🔄 Starting Database Migration...');

    const isConnected = await checkConnection();
    if (!isConnected) {
        console.error('❌ Could not connect to database. Aborting migration.');
        process.exit(1);
    }

    const migrationFile = path.join(__dirname, '../supabase/migrations/20260202_guild_init.sql');

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log(`📖 Reading migration file: ${path.basename(migrationFile)}`);

        await query(sql);

        console.log('✅ Migration executed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
