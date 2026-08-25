import { randomUUID } from 'crypto';
import PassModel from './passSchema.js';
import LikeModel from './schema.js';
import MissedMatchModel from '../missedMatch/schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { RedisClient } from '../../services/index.js';
import {
  updateInboundLikes,
  shouldShowMissedMatchPopup,
  incrementSessionSwipes,
} from '../missedMatch/missedMatchHelper.js';
import { SUCCESS_CODE, UNDO_PASS_REDIS_PREFIX, DUPLICATE_KEY_ERROR_CODE } from '../../constants.js';

export default async ({ userId, passedUserId, passIdempotencyKey }) => {
  const { code, message } = PropsValidationUtility({
    validProps: ['passedUserId'],
    sourceDocument: { passedUserId },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const idempotencyKey = passIdempotencyKey || randomUUID();

  if (userId.toString() === passedUserId.toString()) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid action.' });
  }

  const [passedUser, currentUser] = await Promise.all([
    UserModel.findOne({ _id: passedUserId, blocked: false, deleted: false }),
    UserModel.findOne({ _id: userId, blocked: false, deleted: false }),
  ]);

  if (!passedUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found or unavailable.' });
  }
  if (!currentUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 403, message: 'Your account is not available.' });
  }

  try {
    const existingPassByKey = await PassModel.findOne({ passIdempotencyKey: idempotencyKey });
    if (existingPassByKey) {
      throw ResponseUtility.GENERIC_ERR({
        code: 409,
        message: 'This pass has already been processed.',
        error: { passId: existingPassByKey._id, alreadyProcessed: true, canUndo: !!currentUser.isPremium },
      });
    }

    // "Liked-by" list support: did the passed user already like us?
    const hadLikedMe = await LikeModel.findOne({ userRef: passedUserId, likedUserRef: userId, deleted: false });

    const existingPass = await PassModel.findOne({ userRef: userId, passedUserRef: passedUserId, deleted: false });

    if (existingPass) {
      if (hadLikedMe) {
        // Re-passing removes the stale incoming like so this profile drops from the liked-by list.
        await LikeModel.findByIdAndUpdate(hadLikedMe._id, { deleted: true });
        return ResponseUtility.SUCCESS({
          data: {
            passId: existingPass._id,
            passedUser: { id: passedUser._id },
            canUndo: !!currentUser.isPremium,
            message: 'User passed successfully.',
            alreadyPassed: true,
          },
        });
      }
      throw ResponseUtility.GENERIC_ERR({
        code: 409,
        message: 'You have already passed this user.',
        error: { passId: existingPass._id, duplicate: true, canUndo: !!currentUser.isPremium },
      });
    }

    let missedMatchData = null;
    let showMissedMatchPopup = false;

    if (hadLikedMe) {
      await LikeModel.findByIdAndUpdate(hadLikedMe._id, { deleted: true });

      const hoursSinceLastUpdate = (Date.now() - new Date(currentUser.lastInboundLikesUpdate || 0).getTime()) / (1000 * 60 * 60);
      let evalUser = currentUser;

      if (hoursSinceLastUpdate >= 24) {
        await updateInboundLikes(userId);
        const updatedUser = await UserModel.findById(userId);
        evalUser = updatedUser;
      }

      const updatedUser = await UserModel.findByIdAndUpdate(userId, { $inc: { missedMatchCount: 1 } }, { new: true });

      let missedMatch = await MissedMatchModel.findOne({ userRef: userId, missedUserRef: passedUserId });

      if (!missedMatch) {
        showMissedMatchPopup = await shouldShowMissedMatchPopup(updatedUser);
        missedMatch = await MissedMatchModel.create({
          userRef: userId,
          missedUserRef: passedUserId,
          popupShown: showMissedMatchPopup,
          userSegment: evalUser.userSegment,
        });
      } else {
        showMissedMatchPopup = await shouldShowMissedMatchPopup(evalUser);
        await MissedMatchModel.findByIdAndUpdate(missedMatch._id, { popupShown: showMissedMatchPopup });
      }

      if (showMissedMatchPopup) {
        await UserModel.findByIdAndUpdate(userId, { $inc: { dailyMissedMatchShown: 1 } });
        missedMatchData = {
          missedMatchId: missedMatch._id,
          missedUserId: passedUserId,
          showPopup: true,
          message: 'You missed a match! This person already liked you.',
        };
      }
    }

    const newPass = await PassModel.create({ userRef: userId, passedUserRef: passedUserId, passIdempotencyKey: idempotencyKey });

    await incrementSessionSwipes(userId);

    if (currentUser.isPremium) {
      const redisKey = `${UNDO_PASS_REDIS_PREFIX}${userId}`;
      const passedListRaw = await RedisClient.get(redisKey);
      let passedList = [];
      if (passedListRaw) {
        try { passedList = JSON.parse(passedListRaw); } catch { passedList = []; }
      }
      passedList.push(passedUserId);
      await RedisClient.set(redisKey, JSON.stringify(passedList));
    }

    return ResponseUtility.SUCCESS({
      data: {
        passId: newPass._id,
        passedUser: { id: passedUser._id },
        canUndo: !!currentUser.isPremium,
        message: 'User passed successfully.',
        ...(missedMatchData && { missedMatch: missedMatchData }),
      },
    });
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'Duplicate pass detected.', error: 'This pass action has already been recorded.' });
    }
    if (err.success !== undefined) throw err;
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err.message });
  }
};
