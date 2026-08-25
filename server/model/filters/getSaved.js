import { UserModel } from '../index.js';
import FilterModel from './schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

const calculateDefaultAgeRange = (userAge) => ({
  min: Math.max(18, userAge - 5),
  max: Math.min(90, userAge + 5),
});

export default async ({ id }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['id'], sourceDocument: { id } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: id, deleted: false, blocked: false }).select('age isPremium');
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found or account is blocked.' });
  }

  let filterDoc = await FilterModel.findOne({ userId: id });

  if (!filterDoc) {
    filterDoc = await FilterModel.create({
      userId: id,
      basicFilters: {
        distance: 30,
        ageRange: calculateDefaultAgeRange(user.age || 25),
        verifiedOnly: false,
        religions: [],
        genders: [],
        ethnicities: [],
        datingExpectations: [],
      },
      isFilterActive: false,
    });
  }

  const response = {
    userId: id,
    isPremium: user.isPremium || false,
    basicFilters: filterDoc.basicFilters,
    isFilterActive: filterDoc.isFilterActive,
    lastAppliedAt: filterDoc.lastAppliedAt,
  };

  if (user.isPremium) {
    response.advancedFilters = filterDoc.advancedFilters || {};
  }

  return ResponseUtility.SUCCESS({ data: response });
};
