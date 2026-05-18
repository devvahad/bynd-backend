import { Router } from 'express';
import {
    AddFaqResolver,
    ListFaqResolver,
    UpdateFaqResolver,
    DeleteFaqResolver,
} from '../controllers/resolvers/index.js';
import { authenticate, authorizeAdmin } from '../controllers/authentication.js';
import { AddFaqSchema, UpdateFaqSchema, DeleteFaqSchema } from '../schemas/index.js';

const router = Router();

router.get('/', ListFaqResolver);

router.use(authenticate, authorizeAdmin);
router.post('/', AddFaqSchema, AddFaqResolver);
router.put('/', UpdateFaqSchema, UpdateFaqResolver);
router.delete('/', DeleteFaqSchema, DeleteFaqResolver);

export default router;