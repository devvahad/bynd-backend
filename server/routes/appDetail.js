import { Router } from 'express';
import {
  AddAppDetailResolver,
  ListAppDetailResolver,
  GetAppDetailResolver,
  UpdateAppDetailResolver,
} from '../controllers/resolvers/index.js';
import { authenticate, authorizeAdmin } from '../controllers/authentication.js';
import { AddAppDetailSchema, UpdateAppDetailSchema } from '../schemas/index.js';

const router = Router();

router.get('/', GetAppDetailResolver);
router.get('/all', ListAppDetailResolver);
router.use(authenticate, authorizeAdmin);
router.post('/', AddAppDetailSchema, AddAppDetailResolver);
router.put('/', UpdateAppDetailSchema, UpdateAppDetailResolver);

export default router;