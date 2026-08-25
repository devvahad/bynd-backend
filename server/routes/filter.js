import { Router } from 'express';
import { FilterControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import {
  BasicFiltersSchema, AdvancedFiltersSchema, GetSavedFiltersSchema, ResetFiltersSchema,
} from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/basic', BasicFiltersSchema, FilterControllers.basic);
router.post('/advanced', AdvancedFiltersSchema, FilterControllers.advanced);
router.post('/saved', GetSavedFiltersSchema, FilterControllers.getSaved);
router.post('/reset', ResetFiltersSchema, FilterControllers.reset);

export default router;
