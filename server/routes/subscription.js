import { Router } from 'express';
import { SubscriptionControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import { SubscriptionBuySchema, SubscriptionDetailSchema, SubscriptionRestoreSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/buy', SubscriptionBuySchema, SubscriptionControllers.buy);
router.post('/detail', SubscriptionDetailSchema, SubscriptionControllers.detail);
router.post('/restore', SubscriptionRestoreSchema, SubscriptionControllers.restore);

export default router;
