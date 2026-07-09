import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, CANNABIS } from '../../constants.js';

const isValidCannabisOption = (cannabis) => CANNABIS.includes(cannabis);

export default async ({ userId, cannabis, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({ validProps: ['userId'], sourceDocument: { userId } });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (preferNotToSay !== true && !isValidCannabisOption(cannabis)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid cannabis option. Allowed: ${CANNABIS.join(', ')}`,
    });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.cannabis = preferNotToSay === true ? null : cannabis;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({
      message: preferNotToSay === true ? 'Cannabis usage cleared.' : 'Cannabis usage updated.',
      data: { cannabis: user.cannabis },
    });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};