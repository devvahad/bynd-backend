import { Router } from 'express';
import { authenticate } from '../controllers/authentication.js';
import {
  AddPromptResolver,
  ListPromptsResolver,
  UpdatePromptResolver,
  DeletePromptResolver,
  SkipPromptsResolver,
} from '../controllers/resolvers/index.js';

const router = Router();

router.use(authenticate);

router.post('/add', AddPromptResolver);
router.get('/list', ListPromptsResolver);
router.put('/update', UpdatePromptResolver);
router.delete('/delete', DeletePromptResolver);
router.post('/skip', SkipPromptsResolver);

export default router;
