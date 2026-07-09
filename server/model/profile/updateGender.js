import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, ALLOWED_GENDERS, MAX_SUB_GENDER_LENGTH } from '../../constants.js';

export default async ({ userId, gender, subGender, hideGender }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId', 'gender'],
      sourceDocument: { userId, gender },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    if (!ALLOWED_GENDERS.includes(gender)) {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: `Invalid gender. Allowed: ${ALLOWED_GENDERS.join(', ')}`,
      });
    }

    const update = { gender, updatedOn: new Date() };

    if (subGender !== undefined) {
      if (subGender !== null && typeof subGender !== 'string') {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'subGender must be a string or null.' });
      }

      const normalizedSubGender = typeof subGender === 'string' ? subGender.trim() : null;

      if (normalizedSubGender && normalizedSubGender.length > MAX_SUB_GENDER_LENGTH) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `subGender must be at most ${MAX_SUB_GENDER_LENGTH} characters.`,
        });
      }

      update.subGender = normalizedSubGender || null;
    }

    if (hideGender !== undefined) {
      if (typeof hideGender !== 'boolean') {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'hideGender must be a boolean.' });
      }

      update.hideGender = hideGender;
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
      message: 'Gender updated.',
      data: { gender: user.gender, subGender: user.subGender, hideGender: user.hideGender },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};