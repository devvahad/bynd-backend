import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, DRINKING_HABITS } from '../../constants.js';

export default async ({ userId, drinkingHabits, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedHabit = typeof drinkingHabits === 'string' ? drinkingHabits.trim() : drinkingHabits;

    if (!isClearing) {
      if (!normalizedHabit) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'drinkingHabits is required unless preferNotToSay is true.',
        });
      }

      if (!DRINKING_HABITS.includes(normalizedHabit)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid drinking habit. Allowed: ${DRINKING_HABITS.join(', ')}`,
        });
      }
    }

    const update = isClearing
      ? { drinkingHabits: null, skipDrinkingHabits: true, updatedOn: new Date() }
      : { drinkingHabits: normalizedHabit, skipDrinkingHabits: false, updatedOn: new Date() };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'Drinking habits cleared.' : 'Drinking habits updated.',
      data: { drinkingHabits: user.drinkingHabits },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};