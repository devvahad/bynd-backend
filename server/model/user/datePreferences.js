import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({
  id,
  datePreferences = [],
  ethnicityPreferences = [],
  skipDatingPreference = false,
  skipEthnicityPreference = false,
}) => {
  if (!id) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User ID missing from authentication context.' });
  }

  const resolvedDatePreferences = skipDatingPreference ? [] : datePreferences;
  const resolvedEthnicityPreferences = skipEthnicityPreference ? [] : ethnicityPreferences;

  if (!skipDatingPreference && (!Array.isArray(resolvedDatePreferences) || resolvedDatePreferences.length === 0)) {
    throw ResponseUtility.MISSING_PROPS({
      message: "Please select who you'd like to date or choose skip.",
    });
  }

  if (!skipEthnicityPreference && (!Array.isArray(resolvedEthnicityPreferences) || resolvedEthnicityPreferences.length === 0)) {
    throw ResponseUtility.MISSING_PROPS({
      message: 'Please select ethnicity preferences or choose skip.',
    });
  }

  const { code, message } = await PropsValidationUtility({
    validProps: ['datePreferences', 'ethnicityPreferences', 'skipDatingPreference', 'skipEthnicityPreference'],
    sourceDocument: {
      datePreferences: resolvedDatePreferences,
      ethnicityPreferences: resolvedEthnicityPreferences,
      skipDatingPreference,
      skipEthnicityPreference,
    },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const userExists = await UserModel.findOne({ _id: id, deleted: false }).select('_id').lean();

  if (!userExists) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  const incrementProgress =
    (skipDatingPreference || resolvedDatePreferences.length > 0 ? 4 : 0) +
    (skipEthnicityPreference || resolvedEthnicityPreferences.length > 0 ? 4 : 0);

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        datePreferences: resolvedDatePreferences,
        ethnicityPreferences: resolvedEthnicityPreferences,
        skipDatingPreference,
        skipEthnicityPreference,
        lastUpdatedAt: new Date(),
      },
      $inc: { profileProgress: incrementProgress },
    },
    { new: true, strict: false },
  ).select('datePreferences ethnicityPreferences skipDatingPreference skipEthnicityPreference profileProgress');

  if (!updatedUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Dating preferences updated successfully.',
    data: {
      userId: id,
      datePreferences: updatedUser.datePreferences,
      ethnicityPreferences: updatedUser.ethnicityPreferences,
      skipDatingPreference: updatedUser.skipDatingPreference,
      skipEthnicityPreference: updatedUser.skipEthnicityPreference,
      profileProgress: updatedUser.profileProgress,
    },
  });
};