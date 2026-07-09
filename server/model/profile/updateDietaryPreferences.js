import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, DIETARY_PREFERENCES } from '../../constants.js';

const findInvalidPreferences = (dietaryPreferences) =>
  dietaryPreferences.filter((preference) => !DIETARY_PREFERENCES.includes(preference));

export default async ({ userId, dietaryPreferences, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({ validProps: ['userId'], sourceDocument: { userId } });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (preferNotToSay !== true) {
    if (!Array.isArray(dietaryPreferences)) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Dietary preferences must be an array.' });
    }

    const invalid = findInvalidPreferences(dietaryPreferences);
    if (invalid.length > 0) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid dietary preferences: ${invalid.join(', ')}` });
    }
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.dietaryPreferences = preferNotToSay === true ? [] : [...new Set(dietaryPreferences)];
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({
      message: preferNotToSay === true ? 'Dietary preferences cleared.' : 'Dietary preferences updated.',
      data: { dietaryPreferences: user.dietaryPreferences },
    });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};