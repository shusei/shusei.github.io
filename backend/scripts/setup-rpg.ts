import fs from 'fs';
import path from 'path';
import { query } from '../src/db';

async function setupRpgDb() {
    try {
        console.log("📜 Reading migration file...");
        const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260202_guild_init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🔨 Executing schema migration...");
        // Split by semicolon to execute one by one if needed, but pg should handle the block
        await query(sql);
        console.log("✅ Schema created successfully.");

        // Insert Dummy User (Kuromi)
        console.log("👤 Creating dummy adventurer...");
        const dummyUserQuery = `
            INSERT INTO users (id, name, email, adventurer_rank, title)
            VALUES ('d220ee37-62ad-4360-a61e-964ee40b92bf', '庫洛米喵 (Kuromi)', 'kuromi@usunai.com', 'S', 'Guild Manager')
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        `;
        const userRes = await query(dummyUserQuery);
        const userId = userRes.rows[0]?.id || 'd220ee37-62ad-4360-a61e-964ee40b92bf';

        // Insert Dummy Quest
        console.log("⚔️ Posting initial quest...");
        const dummyQuestQuery = `
            INSERT INTO quests (title, description, guild_class, reward_gp, risk_level, creator_id)
            VALUES ('幫忙搬運重型垃圾喵！', '家裡整理出好幾袋積壓已久的垃圾，需要力氣大的冒險者幫忙搬運到回收點（測試任務）', 'GATHER', 300, 'L1', $1)
            ON CONFLICT DO NOTHING;
        `;
        await query(dummyQuestQuery, [userId]);

        console.log("✨ Database is now ALIVE and populated!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error setting up RPG database:", err);
        process.exit(1);
    }
}

setupRpgDb();
