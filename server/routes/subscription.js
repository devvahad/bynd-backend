import { Router } from 'express';
import { SubscriptionControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import {
  SubscriptionBuySchema,
  SubscriptionDetailSchema,
  SubscriptionRestoreSchema,
  SubscriptionCancelSchema,
  SubscriptionTransactionHistorySchema,
  SubscriptionGetPlansSchema,
} from '../schemas/index.js';

const router = Router();

router.get('/plans', SubscriptionGetPlansSchema, SubscriptionControllers.getPlans);

router.use(authenticate);

router.post('/buy', SubscriptionBuySchema, SubscriptionControllers.buy);
router.post('/detail', SubscriptionDetailSchema, SubscriptionControllers.detail);
router.post('/restore', SubscriptionRestoreSchema, SubscriptionControllers.restore);
router.post('/cancel', SubscriptionCancelSchema, SubscriptionControllers.cancel);
router.post('/transactions', SubscriptionTransactionHistorySchema, SubscriptionControllers.transactionHistory);

export default router;