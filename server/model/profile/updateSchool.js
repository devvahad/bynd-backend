import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MAX_SCHOOL_LENGTH } from '../../constants.js';

export default async ({ userId, school, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedSchool = null;

    if (!isClearing) {
      if (school !== undefined && school !== null && typeof school !== 'string') {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'school must be a string.' });
      }

      normalizedSchool = typeof school === 'string' ? school.trim() : null;

      if (normalizedSchool.length > MAX_SCHOOL_LENGTH) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `School name cannot exceed ${MAX_SCHOOL_LENGTH} characters.`,
        });
      }

      normalizedSchool = normalizedSchool || null;
    }

    const update = {
      school: isClearing ? null : normalizedSchool,
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
      message: isClearing ? 'School info cleared.' : 'School updated successfully.',
      data: { school: user.school },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};