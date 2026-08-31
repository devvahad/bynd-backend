import { randomUUID } from 'crypto';
import LikeModel from './schema.js';
import PassModel from './passSchema.js';
import MatchModel from '../matches/schema.js';
import MissedMatchModel from '../missedMatch/schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { RedisClient, UnifiedNotificationService } from '../../services/index.js';
import {
  SUCCESS_CODE,
  FREE_USER_LIKE_LIMIT,
  LIKE_COUNTER_PREFIX,
  LIKE_LIMIT_WINDOW_SECONDS,
  UNDO_PASS_REDIS_PREFIX,
  MATCH_STATUS,
  TYPE_OF_NOTIFICATIONS,
  DUPLICATE_KEY_ERROR_CODE,
} from '../../constants.js';

export default async ({ userId, likedUserId, likeIdempotencyKey }) => {
  const { code, message } = PropsValidationUtility({
    validProps: ['likedUserId'],
    sourceDocument: { likedUserId },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const idempotencyKey = likeIdempotencyKey || randomUUID();

  if (userId.toString() === likedUserId.toString()) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'You cannot like yourself.' });
  }

  const [likedUser, currentUser] = await Promise.all([
    UserModel.findOne({ _id: likedUserId, blocked: false, deleted: false }),
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }),
  ]);

  if (!likedUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found or unavailable.' });
  }
  if (!currentUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 403, message: 'Your account is not available.' });
  }

  const existingLikeByKey = await LikeModel.findOne({ likeIdempotencyKey: idempotencyKey });
  if (existingLikeByKey) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'This like has already been processed.' });
  }

  const existingLike = await LikeModel.findOne({ userRef: userId, likedUserRef: likedUserId, deleted: false });
  if (existingLike) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'You have already liked this user.' });
  }

  try {
    if (currentUser.isPremium) {
      const previousPass = await PassModel.findOne({ userRef: userId, passedUserRef: likedUserId, deleted: false });
      if (previousPass) {
        await PassModel.findByIdAndUpdate(previousPass._id, { deleted: true });
      }
    }

    if (!currentUser.isPremium) {
      const likeCounterKey = `${LIKE_COUNTER_PREFIX}${userId}`;
      const likeCount = await RedisClient.get(likeCounterKey);

      if (likeCount && parseInt(likeCount, 10) >= FREE_USER_LIKE_LIMIT) {
        throw ResponseUtility.GENERIC_ERR({
          code: 429,
          httpStatus: 429,
          message: 'You have reached your daily like limit. Upgrade to Premium for unlimited likes.',
          error: {
            limitReached: true,
            limit: FREE_USER_LIKE_LIMIT,
            resetInfo: 'Your limit will reset 24 hours after your first like.',
          },
        });
      }
    }

    const newLike = await LikeModel.create({ userRef: userId, likedUserRef: likedUserId, likeIdempotencyKey: idempotencyKey });

    if (currentUser.isPremium) {
      const missedMatch = await MissedMatchModel.findOne({
        $or: [
          { userRef: userId, missedUserRef: likedUserId, deleted: false },
          { userRef: likedUserId, missedUserRef: userId, deleted: false },
        ],
      });
      if (missedMatch) {
        await MissedMatchModel.findByIdAndUpdate(missedMatch._id, { deleted: true });
      }
      await RedisClient.del(`${UNDO_PASS_REDIS_PREFIX}${userId}`).catch(() => {});
    }

    if (!currentUser.isPremium) {
      const likeCounterKey = `${LIKE_COUNTER_PREFIX}${userId}`;
      const count = await RedisClient.incr(likeCounterKey);
      if (count === 1) {
        await RedisClient.expire(likeCounterKey, LIKE_LIMIT_WINDOW_SECONDS);
      }
    }

    const mutualLike = await LikeModel.findOne({ userRef: likedUserId, likedUserRef: userId, deleted: false });

    if (!mutualLike) {
      UnifiedNotificationService({
        userId: likedUserId,
        title: 'New Admirer',
        subtitle: `${currentUser.firstName || 'Someone'} liked your profile!`,
        type: TYPE_OF_NOTIFICATIONS.NEW_ADMIRER,
        reference: newLike._id.toString(),
        payload: { event: 'NEW_LIKE', likeId: newLike._id.toString(), admirerId: userId.toString() },
      }).catch(() => {});
    }

    let matchCreated = false;
    let matchData = null;

    if (mutualLike) {
      const [user1, user2] = [userId, likedUserId].sort((a, b) => a.toString().localeCompare(b.toString()));
      const existingMatch = await MatchModel.findOne({ user1Ref: user1, user2Ref: user2, deleted: false });

      if (!existingMatch) {
        const savedMatch = await MatchModel.create({
          user1Ref: user1, user2Ref: user2, status: MATCH_STATUS.ACTIVE, source: 'CHAT',
        });

        await UserModel.updateMany({ _id: { $in: [userId, likedUserId] } }, { $inc: { matchScore: 1 } });

        matchCreated = true;
        matchData = {
          matchId: savedMatch._id,
          matchedAt: savedMatch.createdOn,
          users: [
            { id: userId, name: currentUser.firstName || 'User', photo: currentUser.photos?.[0]?.url || null },
            { id: likedUserId, name: likedUser.firstName || 'User', photo: likedUser.photos?.[0]?.url || null },
          ],
        };

        UnifiedNotificationService({
          userId: likedUserId,
          title: "It's a Match!",
          subtitle: `You matched with ${currentUser.firstName || 'someone'}!`,
          type: TYPE_OF_NOTIFICATIONS.MATCH,
          reference: savedMatch._id.toString(),
          payload: { event: 'MATCH_CREATED', matchId: savedMatch._id.toString(), matchedUserId: userId.toString() },
        }).catch(() => {});
      }
    }

    let remainingLikes = null;
    if (!currentUser.isPremium) {
      const likeCounterKey = `${LIKE_COUNTER_PREFIX}${userId}`;
      const currentCount = await RedisClient.get(likeCounterKey);
      const used = currentCount ? parseInt(currentCount, 10) : 0;
      remainingLikes = FREE_USER_LIKE_LIMIT - used;
    }

    return ResponseUtility.SUCCESS({
      message: matchCreated ? "It's a match! You both liked each other." : 'User liked successfully.',
      data: {
        likeId: newLike._id,
        likedUser: { id: likedUser._id, name: likedUser.firstName || 'User' },
        matchCreated,
        ...(matchCreated && { match: matchData }),
        remainingLikes: currentUser.isPremium ? -1 : remainingLikes,
        canUndo: false,
      },
    });
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'Duplicate like detected.', error: 'This like action has already been recorded.' });
    }
    if (err.success !== undefined) throw err; // Already a ResponseUtility payload.
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err.message });
  }
};
