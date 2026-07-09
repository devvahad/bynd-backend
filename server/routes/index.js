import { Router } from 'express';
import generalRouter from './general.js';
import userRouter from './user.js';
import adminRouter from './admin.js';
import faqRouter from './faq.js';
import notificationRouter from './notification.js';
import appDetailRouter from './appDetail.js';
import profileRouter from './profile.js';
import promptRouter from './prompt.js';

const router = Router();

router.use('/', generalRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/faqs', faqRouter);
router.use('/notifications', notificationRouter);
router.use('/app-detail', appDetailRouter);
router.use('/profile', profileRouter);
router.use('/prompts', promptRouter);

export default router;