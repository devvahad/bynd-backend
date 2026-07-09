import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, LOOKING_FOR } from '../../constants.js';

export default async ({ userId, lookingFor, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedLookingFor = typeof lookingFor === 'string' ? lookingFor.trim() : lookingFor;

    if (!isClearing) {
      if (!normalizedLookingFor) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'lookingFor is required unless preferNotToSay is true.',
        });
      }

      if (!LOOKING_FOR.includes(normalizedLookingFor)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid looking for value. Allowed: ${LOOKING_FOR.join(', ')}`,
        });
      }
    }

    const update = {
      lookingFor: isClearing ? null : normalizedLookingFor,
      skipLookingFor: isClearing,
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
      message: isClearing ? 'Looking for cleared.' : 'Looking for updated.',
      data: { lookingFor: user.lookingFor },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};