import { ResponseUtility } from '../../utility/index.js';
import { UserModel } from '../index.js';
import { ADMIN_USER_ACTIONS } from '../../constants.js';

const ACTION_CONFIG = {
  [ADMIN_USER_ACTIONS.DELETED]: { update: { deleted: true }, label: 'deleted' },
  [ADMIN_USER_ACTIONS.BLOCKED]: { update: { blocked: true }, label: 'blocked' },
  [ADMIN_USER_ACTIONS.UNBLOCKED]: { update: { blocked: false }, label: 'unblocked' },
  [ADMIN_USER_ACTIONS.VERIFIED]: { update: { verified: true }, label: 'verified' },
};

export default async ({ userRef, action }) => {
  try {
    if (!userRef) {
      throw ResponseUtility.MISSING_PROPS({ message: 'Missing property userRef' });
    }

    if (action === undefined || action === null) {
      throw ResponseUtility.MISSING_PROPS({ message: 'Missing property action' });
    }

    const config = ACTION_CONFIG[action];

    if (!config) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid action provided!' });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userRef },
      { $set: { ...config.update, updatedOn: new Date() } },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({ message: `User has been successfully ${config.label}.` });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};