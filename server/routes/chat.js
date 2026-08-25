import { Router } from 'express';
import { ChatControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import { ChatUserListSchema, ChatMessageListSchema, ChatActionSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/user-list', ChatUserListSchema, ChatControllers.userList);
router.post('/message-list', ChatMessageListSchema, ChatControllers.messageList);
router.post('/action', ChatActionSchema, ChatControllers.action);

export default router;
