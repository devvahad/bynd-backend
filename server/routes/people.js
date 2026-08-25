import { Router } from 'express';
import { PeopleControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import { PeopleHomeSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/home', PeopleHomeSchema, PeopleControllers.home);

export default router;
