import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MAX_EDUCATION_LENGTH } from '../../constants.js';

export default async ({ userId, education, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedEducation = null;

    if (!isClearing) {
      if (education !== undefined && education !== null && typeof education !== 'string') {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'education must be a string.' });
      }

      normalizedEducation = typeof education === 'string' ? education.trim() : null;

      if (normalizedEducation && normalizedEducation.length > MAX_EDUCATION_LENGTH) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `education must be at most ${MAX_EDUCATION_LENGTH} characters.`,
        });
      }

      normalizedEducation = normalizedEducation || null;
    }

    const update = {
      education: isClearing ? null : normalizedEducation,
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
      message: isClearing ? 'Education info cleared.' : 'Education updated successfully.',
      data: { education: user.education },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};