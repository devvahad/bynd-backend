import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, ACTIVE_STATUS } from '../../constants.js';

const isValidActiveStatus = (activeStatus) => ACTIVE_STATUS.includes(activeStatus);

export default async ({ userId, activeStatus, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({ validProps: ['userId'], sourceDocument: { userId } });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (preferNotToSay !== true && !isValidActiveStatus(activeStatus)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid active status. Allowed: ${ACTIVE_STATUS.join(', ')}`,
    });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.activeStatus = preferNotToSay === true ? null : activeStatus;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({
      message: preferNotToSay === true ? 'Active status cleared.' : 'Active status updated.',
      data: { activeStatus: user.activeStatus },
    });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};