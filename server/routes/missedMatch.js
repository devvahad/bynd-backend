import { Router } from 'express';
import { MissedMatchControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import { FindOutWhoSchema, PassAfterMissedMatchSchema, InitSessionSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/find-out-who', FindOutWhoSchema, MissedMatchControllers.findOutWho);
router.post('/pass', PassAfterMissedMatchSchema, MissedMatchControllers.passAfterMissedMatch);
router.post('/session/init', InitSessionSchema, MissedMatchControllers.initSession);

export default router;
