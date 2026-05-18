import { Router } from 'express';
import {
    BroadcastResolver,
    ListNotificationResolver,
} from '../controllers/resolvers/index.js';
import { authenticate, authorizeAdmin } from '../controllers/authentication.js';
import { BroadcastSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);
router.get('/', ListNotificationResolver);
router.post('/broadcast', authorizeAdmin, BroadcastSchema, BroadcastResolver);

export default router;