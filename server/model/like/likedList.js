import LikeModel from './schema.js';
import { UserModel } from '../index.js';
import { ResponseUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

export default async ({ userId, page = 1, limit = PAGINATION_LIMIT }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || PAGINATION_LIMIT;

  if (!userId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing userId.' });
  }

  const likes = await LikeModel.find({ userRef: userId, deleted: false })
    .sort({ createdOn: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  if (!likes.length) {
    return ResponseUtility.SUCCESS({ message: 'No liked users found.', data: { likedUsers: [], total: 0 } });
  }

  const likedUserIds = likes.map((like) => like.likedUserRef);

  const likedUsers = await UserModel.find({ _id: { $in: likedUserIds }, deleted: false, blocked: false })
    .select('_id firstName age')
    .lean();

  const likedUsersMap = new Map(likedUsers.map((u) => [u._id.toString(), u]));
  const orderedList = likes.map((like) => likedUsersMap.get(like.likedUserRef.toString())).filter(Boolean);

  const totalLikes = await LikeModel.countDocuments({ userRef: userId, deleted: false });

  return ResponseUtility.SUCCESS({
    message: 'Liked users fetched successfully.',
    data: {
      likedUsers: orderedList,
      pagination: {
        page: pageNum, limit: limitNum, total: totalLikes, totalPages: Math.ceil(totalLikes / limitNum),
      },
    },
  });
};
