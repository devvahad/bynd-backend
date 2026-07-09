import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, RELIGIONS } from '../../constants.js';

export default async ({ userId, religion, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedReligion = typeof religion === 'string' ? religion.trim() : religion;

    if (!isClearing) {
      if (!normalizedReligion) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'religion is required unless preferNotToSay is true.',
        });
      }

      if (!RELIGIONS.includes(normalizedReligion)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid religion. Allowed: ${RELIGIONS.join(', ')}`,
        });
      }
    }

    const update = {
      religion: isClearing ? null : normalizedReligion,
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
      message: isClearing ? 'Religion cleared.' : 'Religion updated.',
      data: { religion: user.religion },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};