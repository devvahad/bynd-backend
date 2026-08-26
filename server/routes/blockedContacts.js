import { Router } from 'express';
import { BlockedContactsControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import {
  AddBlockedContactSchema,
  ListBlockedContactsSchema,
  UnblockContactSchema,
  SyncContactsSchema,
  ContactsListSchema,
} from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/add', AddBlockedContactSchema, BlockedContactsControllers.add);
router.post('/list', ListBlockedContactsSchema, BlockedContactsControllers.list);
router.post('/unblock', UnblockContactSchema, BlockedContactsControllers.unblock);
router.post('/sync', SyncContactsSchema, BlockedContactsControllers.syncContacts);
router.post('/contacts', ContactsListSchema, BlockedContactsControllers.contactsList);

export default router;
