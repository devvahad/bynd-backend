import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, DATING_EXPECTATIONS } from '../../constants.js';

const isValidDatingExpectation = (datingExpectations) => DATING_EXPECTATIONS.includes(datingExpectations);

export default async ({ userId, datingExpectations, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({ validProps: ['userId'], sourceDocument: { userId } });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (preferNotToSay !== true && !isValidDatingExpectation(datingExpectations)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid dating expectation. Allowed: ${DATING_EXPECTATIONS.join(', ')}`,
    });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.datingExpectations = preferNotToSay === true ? null : datingExpectations;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({
      message: preferNotToSay === true ? 'Dating expectations cleared.' : 'Dating expectations updated.',
      data: { datingExpectations: user.datingExpectations },
    });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};