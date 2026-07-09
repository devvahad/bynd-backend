import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, SEXUALITY_OPTIONS, MAX_SEXUALITY_OPTIONS } from '../../constants.js';

export default async ({ userId, sexuality, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedSexuality = [];

    if (!isClearing) {
      if (!Array.isArray(sexuality)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Sexuality must be an array.' });
      }

      if (sexuality.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one sexuality option is required unless preferNotToSay is true.',
        });
      }

      normalizedSexuality = [...new Set(sexuality)];

      if (normalizedSexuality.length > MAX_SEXUALITY_OPTIONS) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Max ${MAX_SEXUALITY_OPTIONS} sexuality options allowed.`,
        });
      }

      const invalid = normalizedSexuality.filter((s) => !SEXUALITY_OPTIONS.includes(s));
      if (invalid.length) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid sexuality options: ${invalid.join(', ')}`,
        });
      }
    }

    const update = {
      sexuality: isClearing ? [] : normalizedSexuality,
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
      message: isClearing ? 'Sexuality cleared.' : 'Sexuality updated successfully.',
      data: { sexuality: user.sexuality },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};