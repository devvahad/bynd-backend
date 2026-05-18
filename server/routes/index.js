import { Router } from 'express';
import generalRouter from './general.js';
import userRouter from './user.js';
import adminRouter from './admin.js';
import faqRouter from './faq.js';
import notificationRouter from './notification.js';
import appDetailRouter from './appDetail.js';

const router = Router();

router.use('/', generalRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/faqs', faqRouter);
router.use('/notifications', notificationRouter);
router.use('/app-detail', appDetailRouter);

export default router;