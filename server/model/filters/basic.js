import { UserModel } from '../index.js';
import FilterModel from './schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import {
  SUCCESS_CODE, RELIGIONS, ALLOWED_GENDERS, USER_ETHNICITIES, LOOKING_FOR, OPEN_TO_EVERYONE,
} from '../../constants.js';

const normalizeOpenFilter = (values) => (values.includes(OPEN_TO_EVERYONE) ? [OPEN_TO_EVERYONE] : values);

const calculateDefaultAgeRange = (userAge) => ({
  min: Math.max(18, userAge - 5),
  max: Math.min(90, userAge + 5),
});

const validateEnum = (field, values = [], allowed) => {
  if (!Array.isArray(values) || values.length === 0) return;
  const invalid = values.filter((v) => v !== OPEN_TO_EVERYONE && !allowed.includes(v));
  if (invalid.length > 0) {
    throw ResponseUtility.GENERIC_ERR({ message: `Invalid ${field} values: ${invalid.join(', ')}` });
  }
};

export default async ({ id, basicFilters = {} }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['id'], sourceDocument: { id } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: id, deleted: false, blocked: false });
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found or account is blocked.' });
  }

  const {
    distance = 30,
    ageRange,
    verifiedOnly = false,
    religions = [],
    genders = [],
    ethnicities = [],
    datingExpectations = [],
    expandDistance = false,
    expandAge = false,
  } = basicFilters;

  if (distance < 0 || distance > 30) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Distance must be between 0 and 30 miles.' });
  }

  const defaultAgeRange = calculateDefaultAgeRange(user.age || 25);
  const ageMin = ageRange?.min ?? defaultAgeRange.min;
  const ageMax = ageRange?.max ?? defaultAgeRange.max;

  if (ageMin < 18 || ageMax > 90 || ageMin > ageMax) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Invalid age range. Min age must be \u226518, max \u226490.' });
  }

  validateEnum('religion', religions, RELIGIONS);
  validateEnum('gender', genders, ALLOWED_GENDERS);
  validateEnum('ethnicity', ethnicities, USER_ETHNICITIES);
  validateEnum('dating expectation', datingExpectations, LOOKING_FOR);

  const existingFilters = (await FilterModel.findOne({ userId: id }).lean()) || { basicFilters: {} };

  const mergedBasicFilters = {
    distance: basicFilters.distance ?? existingFilters.basicFilters?.distance ?? 30,
    ageRange: { min: ageMin, max: ageMax },
    verifiedOnly: verifiedOnly ?? existingFilters.basicFilters?.verifiedOnly ?? false,
    religions: normalizeOpenFilter(religions.length ? religions : existingFilters.basicFilters?.religions ?? []),
    genders: normalizeOpenFilter(genders.length ? genders : existingFilters.basicFilters?.genders ?? []),
    ethnicities: normalizeOpenFilter(ethnicities.length ? ethnicities : existingFilters.basicFilters?.ethnicities ?? []),
    datingExpectations: normalizeOpenFilter(
      datingExpectations.length ? datingExpectations : existingFilters.basicFilters?.datingExpectations ?? [],
    ),
    expandDistance: expandDistance ?? existingFilters.basicFilters?.expandDistance ?? false,
    expandAge: expandAge ?? existingFilters.basicFilters?.expandAge ?? false,
  };

  const filterDoc = await FilterModel.findOneAndUpdate(
    { userId: id },
    { userId: id, basicFilters: mergedBasicFilters, isFilterActive: true, lastAppliedAt: Date.now() },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );

  return ResponseUtility.SUCCESS({
    data: {
      basicFilters: filterDoc.basicFilters,
      isFilterActive: filterDoc.isFilterActive,
      message: 'Basic filters applied successfully.',
    },
  });
};
