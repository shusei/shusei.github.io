import { Router } from 'express';
import * as QuestController from '../controllers/quests.controller';

const router = Router();

// GET /api/quests - List active quests
router.get('/', QuestController.listQuests);

// POST /api/quests - Create a new quest
router.post('/', QuestController.createQuest);

// POST /api/quests/:id/accept - Accept a quest
router.post('/:id/accept', QuestController.acceptQuest);

// POST /api/quests/receptionist/chat - Chat with AI Catgirl
router.post('/receptionist/chat', QuestController.chatWithReceptionist);

export default router;
