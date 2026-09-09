import { Router } from 'express';
import { processChatbotQuery } from '../controllers/chatbot.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/query', processChatbotQuery);

export default router;
