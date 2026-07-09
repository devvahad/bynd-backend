import { ResponseUtility } from '../../utility/index.js';
import { Types } from 'mongoose';
import NotificationModel from './index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

export default async ({ id, limit = PAGINATION_LIMIT, page = 1 }) => {
  if (!id) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing Property id!' });
  }

  if (!Types.ObjectId.isValid(id)) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Invalid id!' });
  }

  try {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || PAGINATION_LIMIT);
    const userObjectId = new Types.ObjectId(id);

    const [notificationList, total] = await Promise.all([
      NotificationModel.aggregate([
        { $match: { userRef: userObjectId } },
        { $sort: { createdOn: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
      ]),
      NotificationModel.countDocuments({ userRef: userObjectId }),
    ]);

    await NotificationModel.updateMany({ userRef: userObjectId, seen: false }, { seen: true });

    return ResponseUtility.SUCCESS_PAGINATION({
      data: notificationList,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    throw ResponseUtility.GENERIC_ERR({ message: error.message, error });
  }
};
