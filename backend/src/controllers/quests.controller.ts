import { Request, Response } from 'express';
import { query } from '../db';
import { Quest, QuestStatus } from '../types';

// Helper to generate UUID (if not using pgcrypto in DB, but we are using uuid-ossp)
// We rely on DB to generate UUIDs for cleaner code, or we can generate here.
// For now, let's assume DB handles defaults or client sends nothing for ID.

/**
 * List Quests with filters
 * GET /api/quests?status=posted&guild_class=Slay
 */
export const listQuests = async (req: Request, res: Response) => {
    try {
        const { status, guild_class, risk_level } = req.query;

        let sql = `
            SELECT q.*, u.name as creator_name, u.adventurer_rank as creator_rank 
            FROM quests q
            JOIN users u ON q.creator_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (status) {
            sql += ` AND q.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        } else {
            // Default: show active quests (posted)
            sql += ` AND q.status = 'posted'`;
        }

        if (guild_class) {
            sql += ` AND q.guild_class = $${paramCount}`;
            params.push(guild_class);
            paramCount++;
        }

        if (risk_level) {
            sql += ` AND q.risk_level = $${paramCount}`;
            params.push(risk_level);
            paramCount++;
        }

        sql += ` ORDER BY q.created_at DESC LIMIT 50`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error listing quests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Create a new Quest
 * POST /api/quests
 */
export const createQuest = async (req: Request, res: Response) => {
    try {
        const {
            title, description, guild_class, tags, reward_gp,
            risk_level, required_rank, creator_id, location
        } = req.body;

        // Validation (Basic)
        if (!title || !creator_id || !reward_gp) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sql = `
            INSERT INTO quests (
                title, description, guild_class, tags, reward_gp, 
                risk_level, required_rank, creator_id, location, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'posted')
            RETURNING *
        `;

        const params = [
            title, description, guild_class, tags || [], reward_gp,
            risk_level || 'L0', required_rank || 'F', creator_id, location
        ];

        const result = await query(sql, params);

        // TODO: Create Ledger Event (Escrow Deposit) here inside a transaction
        // But for MVP Step 1, we just create the quest.

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating quest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Accept a Quest (Concurrency Lock)
 * POST /api/quests/:id/accept
 */
export const acceptQuest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { mercenary_id } = req.body;

        if (!mercenary_id) {
            return res.status(400).json({ error: 'Mercenary ID required' });
        }

        // 1. Check if quest is available (posted)
        // We use a simple update with WHERE clause for concurrency control (Atomic Update)
        // If row count is 0, it means someone else took it or it's not posted.

        const sql = `
            UPDATE quests 
            SET status = 'accepted', mercenary_id = $1, updated_at = NOW()
            WHERE id = $2 AND status = 'posted'
            RETURNING *
        `;

        const result = await query(sql, [mercenary_id, id]);

        if (result.rowCount === 0) {
            return res.status(409).json({ error: 'Quest not available or already taken' });
        }

        res.json({ message: 'Quest accepted successfully', quest: result.rows[0] });
    } catch (error) {
        console.error('Error accepting quest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
