import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, USER_ETHNICITIES, MAX_ETHNICITIES } from '../../constants.js'

export default async ({ userId, userEthnicities, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedEthnicities = [];

    if (!isClearing) {
      if (!Array.isArray(userEthnicities)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Ethnicities must be an array.' });
      }

      if (userEthnicities.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one ethnicity is required unless preferNotToSay is true.',
        });
      }

      normalizedEthnicities = [...new Set(userEthnicities)];

      if (normalizedEthnicities.length > MAX_ETHNICITIES) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Max ${MAX_ETHNICITIES} ethnicities allowed.` });
      }

      const invalid = normalizedEthnicities.filter((e) => !USER_ETHNICITIES.includes(e));
      if (invalid.length) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid ethnicities: ${invalid.join(', ')}` });
      }
    }

    const update = {
      userEthnicities: isClearing ? [] : normalizedEthnicities,
      updatedOn: new Date(),
    };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'Ethnicities cleared.' : 'Ethnicities updated.',
      data: { userEthnicities: user.userEthnicities },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};