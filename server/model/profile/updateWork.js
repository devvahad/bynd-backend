import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MAX_JOB_TITLE_LENGTH, MAX_INDUSTRY_LENGTH } from '../../constants.js';

const normalizeField = (value, fieldName, maxLength) => {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `${fieldName} must be a string.` });
  }

  const trimmed = typeof value === 'string' ? value.trim() : '';

  if (trimmed.length > maxLength) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `${fieldName} cannot exceed ${maxLength} characters.`,
    });
  }

  return trimmed || null;
};

export default async ({ userId, work, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedWork = { jobTitle: null, industry: null };

    if (!isClearing) {
      if (work !== undefined && (work === null || typeof work !== 'object' || Array.isArray(work))) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'work must be an object.' });
      }

      const jobTitle = normalizeField(work?.jobTitle, 'Job title', MAX_JOB_TITLE_LENGTH);
      const industry = normalizeField(work?.industry, 'Industry', MAX_INDUSTRY_LENGTH);

      normalizedWork = { jobTitle, industry };
    }

    const update = { work: normalizedWork, updatedOn: new Date() };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'Work information cleared.' : 'Work updated successfully.',
      data: user.work,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};