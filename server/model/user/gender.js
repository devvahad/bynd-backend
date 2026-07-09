import UserModel from './index.js';
import { ResponseUtility } from '../../utility/index.js';
import { ALLOWED_GENDERS } from '../../constants.js';

export default async ({ id, gender, subGender = null, subGenderSkipped = false }) => {
  if (!id) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User ID missing from authentication context.' });
  }

  if (!gender || !ALLOWED_GENDERS.includes(gender)) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Primary gender is required.' });
  }

  const resolvedSubGender = subGenderSkipped ? '' : subGender;

  if (!subGenderSkipped && resolvedSubGender !== null && typeof resolvedSubGender !== 'string') {
    throw ResponseUtility.GENERIC_ERR({
      message: 'Sub-gender must be a string value from the select dropdown.',
    });
  }

  if (!subGenderSkipped && (resolvedSubGender === null || resolvedSubGender === '')) {
    return ResponseUtility.SUCCESS({
      message: 'Primary gender selected. Sub-gender selection required to save.',
      data: { gender, subGender: resolvedSubGender, subGenderSkipped, profileProgress: 0 },
    });
  }

  const profileProgress = 8 + (subGenderSkipped || resolvedSubGender ? 4 : 0);

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        gender,
        subGender: resolvedSubGender,
        subGenderSkipped,
        profileProgress,
        lastUpdatedAt: new Date(),
      },
    },
    { new: true, strict: false },
  ).select('gender subGender subGenderSkipped profileProgress');

  if (!updatedUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Gender and sub-gender updated successfully.',
    data: {
      userId: id,
      gender: updatedUser.gender,
      subGender: updatedUser.subGender,
      subGenderSkipped: updatedUser.subGenderSkipped,
      profileProgress,
    },
  });
};