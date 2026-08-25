import { randomUUID } from 'crypto';
import LikeModel from '../like/schema.js';
import PassModel from '../like/passSchema.js';
import { UserModel } from '../index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({ userId, missedUserId }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['missedUserId'], sourceDocument: { missedUserId } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const currentUser = await UserModel.findById(userId);
  if (!currentUser || !currentUser.isPremium) {
    throw ResponseUtility.GENERIC_ERR({ code: 403, httpStatus: 403, message: 'This action requires a premium subscription.' });
  }

  const likeToRemove = await LikeModel.findOne({ userRef: missedUserId, likedUserRef: userId, deleted: false });
  if (likeToRemove) {
    await LikeModel.findByIdAndUpdate(likeToRemove._id, { deleted: true });
  }

  const existingPass = await PassModel.findOne({ userRef: userId, passedUserRef: missedUserId });
  if (!existingPass) {
    await PassModel.create({ userRef: userId, passedUserRef: missedUserId, passIdempotencyKey: randomUUID() });
  }

  return ResponseUtility.SUCCESS({
    data: {
      message: 'User removed from your likes section.',
      likeRemoved: !!likeToRemove,
    },
  });
};
