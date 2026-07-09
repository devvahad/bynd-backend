import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MAX_LANGUAGES, MAX_LANGUAGE_LENGTH } from '../../constants.js';

export default async ({ userId, languages, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedLanguages = [];

    if (!isClearing) {
      if (!Array.isArray(languages)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Languages must be an array.' });
      }

      if (languages.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one language is required unless preferNotToSay is true.',
        });
      }

      const invalidType = languages.find((l) => typeof l !== 'string');
      if (invalidType !== undefined) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Each language must be a string.' });
      }

      const trimmed = languages.map((l) => l.trim()).filter((l) => l.length > 0);

      const tooLong = trimmed.find((l) => l.length > MAX_LANGUAGE_LENGTH);
      if (tooLong) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Language entries must be at most ${MAX_LANGUAGE_LENGTH} characters.`,
        });
      }

      normalizedLanguages = [...new Set(trimmed)];

      if (normalizedLanguages.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one non-empty language is required unless preferNotToSay is true.',
        });
      }

      if (normalizedLanguages.length > MAX_LANGUAGES) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Max ${MAX_LANGUAGES} languages allowed.`,
        });
      }
    }

    const update = {
      languages: isClearing ? [] : normalizedLanguages,
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
      message: isClearing ? 'Languages cleared.' : 'Languages updated successfully.',
      data: { languages: user.languages },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};