import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

const MIN_DISTANCE = 1;
const MAX_DISTANCE = 100;

export default async ({ userId, firstDateDistance, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const update = { updatedOn: new Date() };

    if (isClearing) {
      update.firstDateDistance = null;
    } else {
      if (firstDateDistance === undefined || firstDateDistance === null || firstDateDistance === '') {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'firstDateDistance is required unless preferNotToSay is true.',
        });
      }

      if (typeof firstDateDistance !== 'number' && typeof firstDateDistance !== 'string') {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'firstDateDistance must be a number.' });
      }

      const distance = Number(firstDateDistance);

      if (!Number.isFinite(distance)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'firstDateDistance must be a valid number.' });
      }

      if (distance < MIN_DISTANCE || distance > MAX_DISTANCE) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Distance must be between ${MIN_DISTANCE} and ${MAX_DISTANCE} miles.`,
        });
      }

      update.firstDateDistance = Math.round(distance * 10) / 10;
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'First date distance cleared.' : 'First date distance updated.',
      data: { firstDateDistance: user.firstDateDistance },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};