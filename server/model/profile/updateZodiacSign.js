import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, ZODIAC_SIGNS } from '../../constants.js';

export default async ({ userId, zodiacSign, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedSign = typeof zodiacSign === 'string' ? zodiacSign.trim() : zodiacSign;

    if (!isClearing) {
      if (!normalizedSign) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'zodiacSign is required unless preferNotToSay is true.',
        });
      }

      if (!ZODIAC_SIGNS.includes(normalizedSign)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid zodiac sign. Allowed: ${ZODIAC_SIGNS.join(', ')}`,
        });
      }
    }

    const update = {
      zodiacSign: isClearing ? null : normalizedSign,
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
      message: isClearing ? 'Zodiac sign cleared.' : 'Zodiac sign updated successfully.',
      data: { zodiacSign: user.zodiacSign },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};