import { query, checkConnection } from '../src/db';

async function seed() {
    console.log('🌱 Starting Database Seed...');

    if (!await checkConnection()) process.exit(1);

    try {
        // 1. Create Guild Master (Admin/Client)
        const guildMaster = await query(`
            INSERT INTO users (name, email, role, adventurer_rank, title, trust_score)
            VALUES ('Guild Master', 'master@guild.com', 'admin', 'S', 'The First', 100)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);
        console.log(`👤 Created Guild Master: ${guildMaster.rows[0].id}`);

        // 2. Create Mercenary (User)
        const mercenary = await query(`
            INSERT INTO users (name, email, role, adventurer_rank, title, trust_score)
            VALUES ('Solo Leveling', 'jin@hunter.com', 'user', 'B', 'Shadow Monarch', 95)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `);
        console.log(`⚔️ Created Mercenary: ${mercenary.rows[0].id}`);

        // 3. Create a demo Quest
        await query(`
            INSERT INTO quests (title, description, guild_class, tags, reward_gp, creator_id, status)
            VALUES (
                '討伐：房間裡的巨大蟑螂', 
                '急！在廚房出現一隻巨大蟑螂，會飛。請求支援。', 
                'Slay', 
                ARRAY['#pest', '#urgent'], 
                500, 
                $1,
                'posted'
            )
        `, [guildMaster.rows[0].id]);
        console.log('📜 Created Demo Quest');

        console.log('✅ Seed executed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
