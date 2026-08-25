import { Router } from 'express';
import { DateControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import { DateListSchema, DateFeedbackSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/list', DateListSchema, DateControllers.list);
router.post('/feedback', DateFeedbackSchema, DateControllers.feedback);

export default router;
