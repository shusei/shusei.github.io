import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const verifyMigration = async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('Error: DATABASE_URL is not set.');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });

    try {
        await client.connect();
        console.log('Connected to database for verification.');

        // 1. Check Extensions
        const extensionsRes = await client.query(`
      SELECT extname FROM pg_extension WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'extensions');
    `);
        const extensions = extensionsRes.rows.map(r => r.extname);
        console.log('Installed Extensions in "extensions" schema:', extensions);

        if (!extensions.includes('pgcrypto') || !extensions.includes('vector')) {
            console.error('FAILED: Missing required extensions (pgcrypto, vector).');
        } else {
            console.log('PASSED: Extensions verified.');
        }

        // 2. Check Tables
        const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('import_batches', 'subscriptions', 'import_mappings', 'goals', 'transactions');
    `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('Found Tables:', tables);

        const expectedTables = ['import_batches', 'subscriptions', 'import_mappings', 'goals', 'transactions'];
        const missingTables = expectedTables.filter(t => !tables.includes(t));

        if (missingTables.length > 0) {
            console.error('FAILED: Missing tables:', missingTables);
        } else {
            console.log('PASSED: All tables verified.');
        }

        // 3. Check RLS Enabled
        const rlsRes = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('import_batches', 'subscriptions', 'import_mappings', 'goals', 'transactions');
    `);

        const rlsDisabled = rlsRes.rows.filter(r => !r.rowsecurity);
        if (rlsDisabled.length > 0) {
            console.error('FAILED: RLS not enabled for:', rlsDisabled.map(r => r.tablename));
        } else {
            console.log('PASSED: RLS enabled for all tables.');
        }

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        await client.end();
    }
};

verifyMigration();
