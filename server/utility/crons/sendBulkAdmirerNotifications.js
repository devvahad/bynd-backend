import LikeModel from '../../model/like/schema.js';
import { UserModel } from '../../model/index.js';
import { UnifiedNotificationService } from '../../services/index.js';
import { logger } from '../../services/logger.js';
import { TYPE_OF_NOTIFICATIONS } from '../../constants.js';

export default async () => {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const likes = await LikeModel.aggregate([
      { $match: { createdOn: { $gte: twelveHoursAgo }, deleted: false } },
      { $group: { _id: '$likedUserRef', likeCount: { $sum: 1 } } },
      { $match: { likeCount: { $gt: 1 } } },
    ]);

    for (const item of likes) {
      // eslint-disable-next-line no-await-in-loop
      const user = await UserModel.findById(item._id);
      if (!user) continue;

      if (user.lastBulkLikeNotificationSentAt && user.lastBulkLikeNotificationSentAt > twelveHoursAgo) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await UnifiedNotificationService({
        userId: user._id,
        title: 'New Likes',
        subtitle: `You have ${item.likeCount} new admirers waiting to be discovered!`,
        type: TYPE_OF_NOTIFICATIONS.NEW_ADMIRER,
        payload: { event: 'MULTIPLE_NEW_LIKES', count: item.likeCount },
        saveToDb: false,
      });

      user.lastBulkLikeNotificationSentAt = new Date();
      // eslint-disable-next-line no-await-in-loop
      await user.save();
    }

    logger.info('Bulk admirer notifications sent successfully.');
  } catch (err) {
    logger.error(`Bulk admirer notification error: ${err.message}`);
  }
};
