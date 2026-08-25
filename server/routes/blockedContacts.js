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

// Add a contact to blocked list manually.
router.post('/add', AddBlockedContactSchema, BlockedContactsControllers.add);

// Get blocked contacts list.
router.post('/list', ListBlockedContactsSchema, BlockedContactsControllers.list);

// Unblock a contact.
router.post('/unblock', UnblockContactSchema, BlockedContactsControllers.unblock);

// Sync contacts from phone (one-time only).
router.post('/sync', SyncContactsSchema, BlockedContactsControllers.syncContacts);

// Get synced contacts list (excluding blocked).
router.post('/contacts', ContactsListSchema, BlockedContactsControllers.contactsList);

export default router;
