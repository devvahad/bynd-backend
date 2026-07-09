import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, LOVE_LANGUAGES, MAX_LOVE_LANGUAGES } from '../../constants.js';

export default async ({ userId, loveLanguages, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedLoveLanguages = [];

    if (!isClearing) {
      if (!Array.isArray(loveLanguages)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Love languages must be an array.' });
      }

      if (loveLanguages.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one love language is required unless preferNotToSay is true.',
        });
      }

      normalizedLoveLanguages = [...new Set(loveLanguages)];

      if (normalizedLoveLanguages.length > MAX_LOVE_LANGUAGES) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Max ${MAX_LOVE_LANGUAGES} love languages allowed.`,
        });
      }

      const invalid = normalizedLoveLanguages.filter((l) => !LOVE_LANGUAGES.includes(l));
      if (invalid.length) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid love languages: ${invalid.join(', ')}`,
        });
      }
    }

    const update = {
      loveLanguages: isClearing ? [] : normalizedLoveLanguages,
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
      message: isClearing ? 'Love languages cleared.' : 'Love languages updated.',
      data: { loveLanguages: user.loveLanguages },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};