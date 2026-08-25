import { UserModel } from '../index.js';
import FilterModel from './schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MIN_HEIGHT_CM, MAX_HEIGHT_CM } from '../../constants.js';

const calculateDefaultAgeRange = (userAge) => ({
  min: Math.max(18, userAge - 5),
  max: Math.min(90, userAge + 5),
});

export default async ({ id }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['id'], sourceDocument: { id } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: id, deleted: false, blocked: false }).select('age');
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found or account is blocked.' });
  }

  const defaultAgeRange = calculateDefaultAgeRange(user.age || 25);

  const filterDoc = await FilterModel.findOneAndUpdate(
    { userId: id },
    {
      userId: id,
      basicFilters: {
        distance: 30,
        ageRange: defaultAgeRange,
        verifiedOnly: false,
        religions: [],
        genders: [],
        ethnicities: [],
        datingExpectations: [],
      },
      advancedFilters: {
        heightRange: { min: MIN_HEIGHT_CM, max: MAX_HEIGHT_CM },
        politicalViews: [],
        drinkingHabits: [],
        smokingHabits: [],
        children: [],
        familyPlans: [],
        education: [],
        exercise: [],
        relationshipType: [],
        languages: [],
      },
      isFilterActive: false,
      lastAppliedAt: Date.now(),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return ResponseUtility.SUCCESS({
    data: {
      basicFilters: filterDoc.basicFilters,
      advancedFilters: filterDoc.advancedFilters,
      isFilterActive: filterDoc.isFilterActive,
      message: 'Filters reset to default values.',
    },
  });
};
