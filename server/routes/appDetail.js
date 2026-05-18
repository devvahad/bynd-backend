import { Router } from 'express';
import {
  AddAppDetailResolver,
  ListAppDetailResolver,
} from '../controllers/resolvers/index.js';
import {
  GetAppDetailController,
  UpdateAppDetailController,
} from '../controllers/appDetail.js';
import { authenticate, authorizeAdmin } from '../controllers/authentication.js';
import { AddAppDetailSchema, UpdateAppDetailSchema } from '../schemas/index.js';

const router = Router();

router.get('/', GetAppDetailController);
router.get('/all', ListAppDetailResolver);

router.use(authenticate, authorizeAdmin);
router.post('/', AddAppDetailSchema, AddAppDetailResolver);
router.put('/', UpdateAppDetailSchema, UpdateAppDetailController);

export default router;