import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { BlockedContactModel } from './schema.js';
import { ResponseUtility } from '../../utility/index.js';

/**
 * Unblock a previously blocked contact so the user can appear again
 * in swipe decks / people listings.
 */
export default async ({ id, blockedContactId }) => {
  if (!id || !blockedContactId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property blockedContactId.' });
  }

  const user = await UserModel.findOne({ _id: new Types.ObjectId(id), deleted: { $ne: true } });
  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const blockedContact = await BlockedContactModel.findOne({
    _id: new Types.ObjectId(blockedContactId),
    userId: new Types.ObjectId(id),
  });

  if (!blockedContact) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Blocked contact not found.' });
  }

  await BlockedContactModel.findByIdAndDelete(blockedContactId);

  return ResponseUtility.SUCCESS({
    message: 'Contact unblocked successfully.',
    data: {
      unblocked: true,
      phoneNumber: blockedContact.phoneNumber,
      name: blockedContact.name,
    },
  });
};
