import { Router } from 'express';

const router = Router();

// GET /api/users/me - Get current user profile
router.get('/me', (req, res) => {
    res.json({ message: "Get user profile endpoint" });
});

export default router;
