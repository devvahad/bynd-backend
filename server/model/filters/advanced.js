import { UserModel } from '../index.js';
import FilterModel from './schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import {
  SUCCESS_CODE, POLITICAL_VIEWS, DRINKING_HABITS, SMOKING_HABITS, CHILDREN_STATUS, FAMILY_PLANS, CANNABIS,
  EDUCATION_LEVELS, EXERCISE_HABITS, RELATIONSHIP_TYPES, MIN_HEIGHT_CM, MAX_HEIGHT_CM, OPEN_TO_EVERYONE,
} from '../../constants.js';

const normalizeOpenFilter = (values) => (values.includes(OPEN_TO_EVERYONE) ? [OPEN_TO_EVERYONE] : values);

const parseHeightLabel = (label) => {
  const match = label?.match(/(\d+)'(\d+)?/);
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2] || 0, 10);
  return feet * 30.48 + inches * 2.54;
};

export default async ({ id, advancedFilters = {} }) => {
  const { code, message } = PropsValidationUtility({ validProps: ['id'], sourceDocument: { id } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: id, deleted: false, blocked: false }).select('isPremium');
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found or account is blocked.' });
  }

  if (!user.isPremium) {
    throw ResponseUtility.GENERIC_ERR({
      code: 403,
      httpStatus: 403,
      message: 'Advanced filters are only available for premium members. Upgrade to unlock this feature.',
      error: { requiresPremium: true, filterType: 'advanced' },
    });
  }

  let { heightRange } = advancedFilters;
  const expandHeight = advancedFilters.expandHeight === true;
  const {
    politicalViews, drinkingHabits, smokingHabits, children, familyPlans,
    education, exercise, relationshipType, languages, cannabis,
  } = advancedFilters;

  const validations = [
    { field: 'politicalViews', values: politicalViews, allowed: POLITICAL_VIEWS },
    { field: 'drinkingHabits', values: drinkingHabits, allowed: DRINKING_HABITS },
    { field: 'smokingHabits', values: smokingHabits, allowed: SMOKING_HABITS },
    { field: 'children', values: children, allowed: CHILDREN_STATUS },
    { field: 'familyPlans', values: familyPlans, allowed: FAMILY_PLANS },
    { field: 'education', values: education, allowed: EDUCATION_LEVELS },
    { field: 'exercise', values: exercise, allowed: EXERCISE_HABITS },
    { field: 'relationshipType', values: relationshipType, allowed: RELATIONSHIP_TYPES },
    { field: 'cannabis', values: cannabis, allowed: CANNABIS },
  ];

  validations.forEach((v) => {
    if (Array.isArray(v.values) && v.values.length > 0) {
      const invalid = v.values.filter((x) => x !== OPEN_TO_EVERYONE && !v.allowed.includes(x));
      if (invalid.length > 0) {
        throw ResponseUtility.GENERIC_ERR({ message: `Invalid ${v.field} values: ${invalid.join(', ')}` });
      }
    }
  });

  let filterDoc = await FilterModel.findOne({ userId: id });
  if (!filterDoc) {
    filterDoc = new FilterModel({ userId: id });
  }

  const oldAdv = filterDoc.advancedFilters || {};

  if (heightRange) {
    let minCm = MIN_HEIGHT_CM;
    let maxCm = MAX_HEIGHT_CM;

    if (typeof heightRange === 'string') {
      const [minLabel, maxLabel] = heightRange.split('-').map((h) => h.trim());
      minCm = parseHeightLabel(minLabel);
      maxCm = parseHeightLabel(maxLabel);
      if (!minCm || !maxCm) {
        throw ResponseUtility.GENERIC_ERR({ message: "Invalid height range format. Use 4'11\" - 5'10\"" });
      }
    } else if (typeof heightRange === 'object') {
      const convert = (f, i) => f * 30.48 + (i || 0) * 2.54;
      minCm = heightRange.minFeet !== undefined
        ? convert(heightRange.minFeet, heightRange.minInches)
        : (heightRange.min ?? oldAdv.heightRange?.min ?? MIN_HEIGHT_CM);
      maxCm = heightRange.maxFeet !== undefined
        ? convert(heightRange.maxFeet, heightRange.maxInches)
        : (heightRange.max ?? oldAdv.heightRange?.max ?? MAX_HEIGHT_CM);
    }

    if (minCm < MIN_HEIGHT_CM || maxCm > MAX_HEIGHT_CM || minCm > maxCm) {
      throw ResponseUtility.GENERIC_ERR({ message: `Height must be between ${MIN_HEIGHT_CM}cm and ${MAX_HEIGHT_CM}cm.` });
    }

    heightRange = { min: minCm, max: maxCm };
  }

  filterDoc.advancedFilters = {
    heightRange: heightRange ?? oldAdv.heightRange ?? { min: MIN_HEIGHT_CM, max: MAX_HEIGHT_CM },
    politicalViews: normalizeOpenFilter(politicalViews ?? oldAdv.politicalViews ?? []),
    drinkingHabits: normalizeOpenFilter(drinkingHabits ?? oldAdv.drinkingHabits ?? []),
    smokingHabits: normalizeOpenFilter(smokingHabits ?? oldAdv.smokingHabits ?? []),
    children: normalizeOpenFilter(children ?? oldAdv.children ?? []),
    familyPlans: normalizeOpenFilter(familyPlans ?? oldAdv.familyPlans ?? []),
    education: normalizeOpenFilter(education ?? oldAdv.education ?? []),
    exercise: normalizeOpenFilter(exercise ?? oldAdv.exercise ?? []),
    relationshipType: normalizeOpenFilter(relationshipType ?? oldAdv.relationshipType ?? []),
    cannabis: normalizeOpenFilter(cannabis ?? oldAdv.cannabis ?? []),
    languages: languages ?? oldAdv.languages ?? [],
    expandHeight: expandHeight ?? oldAdv.expandHeight ?? false,
  };
  filterDoc.isFilterActive = true;
  filterDoc.lastAppliedAt = Date.now();

  await filterDoc.save();

  return ResponseUtility.SUCCESS({
    data: {
      basicFilters: filterDoc.basicFilters,
      advancedFilters: filterDoc.advancedFilters,
      isFilterActive: filterDoc.isFilterActive,
      message: 'Advanced filters applied successfully.',
    },
  });
};
