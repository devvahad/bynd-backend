import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, FOOD_ALLERGIES } from '../../constants.js';

export default async ({ userId, foodAllergies, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedAllergies = [];

    if (!isClearing) {
      if (!Array.isArray(foodAllergies)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Food allergies must be an array.' });
      }

      normalizedAllergies = [...new Set(foodAllergies)];

      const invalid = normalizedAllergies.filter((f) => !FOOD_ALLERGIES.includes(f));
      if (invalid.length) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid food allergies: ${invalid.join(', ')}`,
        });
      }
    }

    const update = {
      foodAllergies: isClearing ? [] : normalizedAllergies,
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
      message: isClearing ? 'Food allergies cleared.' : 'Food allergies updated.',
      data: { foodAllergies: user.foodAllergies },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};