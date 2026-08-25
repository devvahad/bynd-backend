import { UserModel } from '../index.js';
import LikeModel from '../like/schema.js';
import {
  USER_SEGMENT,
  INBOUND_LIKES_THRESHOLD,
  MISSED_MATCH_FREQUENCY,
  MISSED_MATCH_DAILY_CAP,
  MIN_SWIPES_BEFORE_POPUP,
} from '../../constants.js';
import { logger } from '../../services/logger.js';

/**
 * Recompute a user's inbound-likes-last-7-days count and derived segment.
 */
export const updateInboundLikes = async (userId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inboundLikesCount = await LikeModel.countDocuments({
      likedUserRef: userId,
      deleted: false,
      createdOn: { $gte: sevenDaysAgo },
    });

    let segment = USER_SEGMENT.LOW;
    if (inboundLikesCount >= INBOUND_LIKES_THRESHOLD.HIGH) {
      segment = USER_SEGMENT.HIGH;
    } else if (inboundLikesCount >= INBOUND_LIKES_THRESHOLD.LOW) {
      segment = USER_SEGMENT.MEDIUM;
    }

    await UserModel.findByIdAndUpdate(userId, {
      inboundLikesLast7Days: inboundLikesCount,
      userSegment: segment,
      lastInboundLikesUpdate: new Date(),
    });

    return { inboundLikesCount, segment };
  } catch (error) {
    logger.error(`updateInboundLikes error: ${error.message}`);
    return null;
  }
};

/**
 * Decide whether the "you missed a match" popup should be shown, based on
 * session-swipe minimums, a daily cap, and a per-segment frequency.
 */
export const shouldShowMissedMatchPopup = async (user) => {
  try {
    if ((user.sessionSwipeCount ?? 0) < MIN_SWIPES_BEFORE_POPUP) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastReset = new Date(user.lastMissedMatchReset || 0);
    lastReset.setHours(0, 0, 0, 0);

    if (today > lastReset) {
      await UserModel.findByIdAndUpdate(user._id, {
        dailyMissedMatchShown: 0,
        lastMissedMatchReset: new Date(),
      });
      user.dailyMissedMatchShown = 0; // eslint-disable-line no-param-reassign
    }

    const segment = (user.userSegment || USER_SEGMENT.LOW).toUpperCase();
    const dailyCapForSegment = MISSED_MATCH_DAILY_CAP[segment];

    if ((user.dailyMissedMatchShown ?? 0) >= dailyCapForSegment) {
      return false;
    }

    const frequencyForSegment = MISSED_MATCH_FREQUENCY[segment];
    return ((user.missedMatchCount ?? 0) + 1) % frequencyForSegment === 0;
  } catch (error) {
    logger.error(`shouldShowMissedMatchPopup error: ${error.message}`);
    return false;
  }
};

export const incrementSessionSwipes = async (userId) => {
  try {
    await UserModel.findByIdAndUpdate(userId, { $inc: { sessionSwipeCount: 1 } });
  } catch (error) {
    logger.error(`incrementSessionSwipes error: ${error.message}`);
  }
};

/**
 * Reset session swipe count. Intended to be called on app open/login.
 */
export const resetSessionSwipes = async (userId) => {
  try {
    await UserModel.findByIdAndUpdate(userId, { sessionSwipeCount: 0 });
  } catch (error) {
    logger.error(`resetSessionSwipes error: ${error.message}`);
  }
};
