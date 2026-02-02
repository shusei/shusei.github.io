import { Router } from 'express';
import * as QuestController from '../controllers/quests.controller';

const router = Router();

// GET /api/quests - List active quests
router.get('/', QuestController.listQuests);

// POST /api/quests - Create a new quest
router.post('/', QuestController.createQuest);

// POST /api/quests/:id/accept - Accept a quest
router.post('/:id/accept', QuestController.acceptQuest);

export default router;
