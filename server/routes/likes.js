import { Router } from 'express';
import { LikesControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import {
  LikeUserSchema,
  PassUserSchema,
  UnlikeUserSchema,
  LikedListSchema,
  LikedByListSchema,
  UndoPassSchema,
  GetUserDetailsSchema,
} from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/like', LikeUserSchema, LikesControllers.likeUser);
router.post('/pass', PassUserSchema, LikesControllers.passUser);
router.post('/unlike', UnlikeUserSchema, LikesControllers.unlikeUser);
router.post('/liked-list', LikedListSchema, LikesControllers.likedListUser);
router.post('/liked-by', LikedByListSchema, LikesControllers.likedByListUser);
router.post('/undo-pass', UndoPassSchema, LikesControllers.undoPassUser);
router.post('/user-details', GetUserDetailsSchema, LikesControllers.getUserDetails);

export default router;
