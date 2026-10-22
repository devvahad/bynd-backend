import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({ id, removedUserId }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['removedUserId'],
    sourceDocument: { removedUserId },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (id === removedUserId) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'You cannot remove yourself.' });
  }

  const [remover, removedUser] = await Promise.all([
    UserModel.findOne({ _id: id, deleted: false }),
    UserModel.findOne({ _id: removedUserId, deleted: false }),
  ]);

  if (!remover || !removedUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'One or both users do not exist.' });
  }

  if (remover.removedUsers?.some((userId) => userId.toString() === removedUserId)) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'User is already removed.' });
  }

  await Promise.all([
    UserModel.findByIdAndUpdate(id, { $addToSet: { removedUsers: removedUserId } }),
    UserModel.findByIdAndUpdate(removedUserId, { $addToSet: { removedBy: id } }),
  ]);

  return ResponseUtility.SUCCESS({ message: 'User removed successfully.' });
};