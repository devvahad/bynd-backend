import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MIN_HEIGHT_CM, MAX_HEIGHT_CM } from '../../constants.js';

const cmToFeetInches = (cm) => {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
};

export default async ({ userId, heightCm, preferNotToSay }) => {
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
      update.heightCm = null;
      update.heightLabel = null;
    } else {
      if (heightCm === undefined || heightCm === null || heightCm === '') {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'heightCm is required unless preferNotToSay is true.',
        });
      }

      if (typeof heightCm !== 'number' && typeof heightCm !== 'string') {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'heightCm must be a number.' });
      }

      const cm = Number(heightCm);

      if (!Number.isFinite(cm)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'heightCm must be a valid number.' });
      }

      if (cm < MIN_HEIGHT_CM || cm > MAX_HEIGHT_CM) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Height must be between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm.`,
        });
      }

      const roundedCm = Math.round(cm * 10) / 10;
      update.heightCm = roundedCm;
      update.heightLabel = cmToFeetInches(roundedCm);
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
      message: isClearing ? 'Height cleared.' : 'Height updated.',
      data: { heightCm: user.heightCm, heightLabel: user.heightLabel },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};