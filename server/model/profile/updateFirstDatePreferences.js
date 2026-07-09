import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, FIRST_DATE_ACTIVITIES, MAX_FIRST_DATE_PREFERENCES } from '../../constants.js';

export default async ({ userId, firstDatePreferences, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedPreferences = [];

    if (!isClearing) {
      if (!Array.isArray(firstDatePreferences)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'First date preferences must be an array.' });
      }

      if (firstDatePreferences.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one first date preference is required unless preferNotToSay is true.',
        });
      }

      normalizedPreferences = [...new Set(firstDatePreferences)];

      if (normalizedPreferences.length > MAX_FIRST_DATE_PREFERENCES) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Max ${MAX_FIRST_DATE_PREFERENCES} first date preferences allowed.`,
        });
      }

      const invalid = normalizedPreferences.filter((f) => !FIRST_DATE_ACTIVITIES.includes(f));
      if (invalid.length) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid first date preferences: ${invalid.join(', ')}`,
        });
      }
    }

    const update = {
      firstDatePreferences: isClearing ? [] : normalizedPreferences,
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
      message: isClearing ? 'First date preferences cleared.' : 'First date preferences updated.',
      data: { firstDatePreferences: user.firstDatePreferences },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};