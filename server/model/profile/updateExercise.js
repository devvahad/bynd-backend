import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, EXERCISE_HABITS } from '../../constants.js';

const isValidExerciseHabit = (exercise) => EXERCISE_HABITS.includes(exercise);

export default async ({ userId, exercise }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId', 'exercise'],
    sourceDocument: { userId, exercise },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (!isValidExerciseHabit(exercise)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid exercise habit. Allowed: ${EXERCISE_HABITS.join(', ')}`,
    });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.exercise = exercise;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({ message: 'Exercise habit updated.', data: { exercise: user.exercise } });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};