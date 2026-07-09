import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, CHILDREN_STATUS } from '../../constants.js';

const isValidChildrenStatus = (children) => CHILDREN_STATUS.includes(children);

export default async ({ userId, children, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({ validProps: ['userId'], sourceDocument: { userId } });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (preferNotToSay !== true && !isValidChildrenStatus(children)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid children status. Allowed: ${CHILDREN_STATUS.join(', ')}`,
    });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.children = preferNotToSay === true ? null : children;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({
      message: preferNotToSay === true ? 'Children status cleared.' : 'Children status updated.',
      data: { children: user.children },
    });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};