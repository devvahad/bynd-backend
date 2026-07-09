import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({
  id,
  religion,
  politicalView,
  religionSkipped = false,
  politicalViewSkipped = false,
}) => {
  if (!id) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User ID missing from authentication context.' });
  }

  const resolvedReligion = religionSkipped ? '' : religion;
  const resolvedPoliticalView = politicalViewSkipped ? '' : politicalView;

  if (!religionSkipped && !resolvedReligion) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Religion is required unless skipped.' });
  }

  if (!politicalViewSkipped && !resolvedPoliticalView) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Political view is required unless skipped.' });
  }

  const { code, message } = await PropsValidationUtility({
    validProps: ['religion', 'politicalView'],
    sourceDocument: { religion: resolvedReligion, politicalView: resolvedPoliticalView },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const incrementProgress =
    (resolvedReligion || religionSkipped ? 5 : 0) +
    (resolvedPoliticalView || politicalViewSkipped ? 5 : 0);

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        religion: resolvedReligion,
        religionSkipped,
        politicalView: resolvedPoliticalView,
        politicalViewSkipped,
        lastUpdatedAt: new Date(),
      },
      $inc: { profileProgress: incrementProgress },
    },
    { new: true, strict: false },
  ).select('religion religionSkipped politicalView politicalViewSkipped profileProgress');

  if (!updatedUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Religion and political view updated successfully.',
    data: {
      userId: id,
      religion: updatedUser.religion,
      religionSkipped: updatedUser.religionSkipped,
      politicalView: updatedUser.politicalView,
      politicalViewSkipped: updatedUser.politicalViewSkipped,
      profileProgress: updatedUser.profileProgress,
    },
  });
};