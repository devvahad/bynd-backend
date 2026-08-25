import MatchModel from '../../model/matches/schema.js';
import LikeModel from '../../model/like/schema.js';
import PassModel from '../../model/like/passSchema.js';
import { logger } from '../../services/logger.js';
import { MATCH_STATUS, PLAN_DATE_EXPIRY_HOURS } from '../../constants.js';

export const expireMatchesJob = async () => {
  try {
    const currentTime = new Date();
    const expiryDate = new Date(currentTime.getTime() - PLAN_DATE_EXPIRY_HOURS * 60 * 60 * 1000);

    const matchesToExpire = await MatchModel.find({
      status: MATCH_STATUS.ACTIVE,
      deleted: false,
      createdOn: { $lt: expiryDate },
      $or: [{ datePlanned: { $exists: false } }, { datePlanned: null }],
    });

    for (const match of matchesToExpire) {
      const { user1Ref, user2Ref } = match;

      // eslint-disable-next-line no-await-in-loop
      await MatchModel.updateOne({ _id: match._id }, { $set: { status: MATCH_STATUS.EXPIRED } });

      // eslint-disable-next-line no-await-in-loop
      await LikeModel.updateMany(
        {
          deleted: false,
          $or: [
            { userRef: user1Ref, likedUserRef: user2Ref },
            { userRef: user2Ref, likedUserRef: user1Ref },
          ],
        },
        { $set: { deleted: true } },
      );

      // eslint-disable-next-line no-await-in-loop
      await PassModel.updateMany(
        {
          deleted: false,
          $or: [
            { userRef: user1Ref, passedUserRef: user2Ref },
            { userRef: user2Ref, passedUserRef: user1Ref },
          ],
        },
        { $set: { deleted: true } },
      );
    }

    return { success: true, expiredCount: matchesToExpire.length };
  } catch (error) {
    logger.error(`Error in expireMatchesJob: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default expireMatchesJob;
