import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, SMOKING_HABITS } from '../../constants.js';

export default async ({ userId, smokingHabits, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedHabit = typeof smokingHabits === 'string' ? smokingHabits.trim() : smokingHabits;

    if (!isClearing) {
      if (!normalizedHabit) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'smokingHabits is required unless preferNotToSay is true.',
        });
      }

      if (!SMOKING_HABITS.includes(normalizedHabit)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid smoking habit. Allowed: ${SMOKING_HABITS.join(', ')}`,
        });
      }
    }

    const update = isClearing
      ? { smokingHabits: null, skipSmokingHabits: true, updatedOn: new Date() }
      : { smokingHabits: normalizedHabit, skipSmokingHabits: false, updatedOn: new Date() };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'Smoking habits cleared.' : 'Smoking habits updated.',
      data: { smokingHabits: user.smokingHabits },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};