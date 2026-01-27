import { pool } from './config/db';
import redis from './config/redis';

const verifyConnections = async () => {
    console.log('🔍 Testing Cloud Connectivity...');

    // 1. Test Supabase (PostgreSQL)
    try {
        console.log('👉 Connecting to Supabase (PostgreSQL)...');
        const res = await pool.query('SELECT NOW() as now');
        console.log('✅ Supabase Connected! Server Time:', res.rows[0].now);
    } catch (err: any) {
        console.error('❌ Supabase Connection Failed:', err.message);
    }

    // 2. Test Upstash (Redis)
    try {
        console.log('👉 Connecting to Upstash (Redis)...');
        const res = await redis.ping();
        console.log('✅ Upstash Connected! PING response:', res);
    } catch (err: any) {
        console.error('❌ Upstash Connection Failed:', err.message);
    }

    // Cleanup
    await pool.end();
    redis.disconnect();
};

verifyConnections();
