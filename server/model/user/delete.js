import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, DELETE_ACCOUNT_REASONS } from '../../constants.js';
import { RedisClient } from '../../services/index.js';

export default async ({ id, reason, metOnApp }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['reason'],
    sourceDocument: { reason },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (!DELETE_ACCOUNT_REASONS.includes(reason)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid delete reason.' });
  }

  if (reason === 'I met someone' && typeof metOnApp !== 'boolean') {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: "metOnApp is required when reason is 'I met someone'.",
    });
  }

  const user = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        deleted: true,
        deleteReason: reason,
        metOnApp: reason === 'I met someone' ? metOnApp : null,
        deletedOn: new Date(),
        fcmToken: '',
        device: '',
      },
    },
    { new: true },
  );

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  await RedisClient.set(user._id.toString(), JSON.stringify({ deleted: true }));

  return ResponseUtility.SUCCESS({ message: 'Your account has been deleted successfully.' });
};