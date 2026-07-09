import { UserModel } from '../index.js';
import PromptModel from '../prompt/index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, PROMPTS, MAX_BIO_LENGTH, MAX_PHOTOS, MIN_PHOTOS, PROMPT_CATEGORIES, NA, USER_PROJECTION } from '../../constants.js';

const formatters = {
  scalar: (value) => (value === null || value === undefined || value === '' ? NA : value),
  list: (values) => (Array.isArray(values) && values.length > 0 ? values.join(', ') : NA),
  count: (values, noun) => {
    const total = Array.isArray(values) ? values.length : 0;
    if (total === 0) return NA;
    return `${total} ${noun}${total > 1 ? 's' : ''}`;
  },
};

const isEmptyValue = (value) =>
  value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

const buildFieldDefinitions = ({ user, promptsWithText }) => [
  {
    moduleId: 'photos',
    title: 'Photos',
    isClickable: true,
    action: 'navigate_to_photos_edit',
    data: () => {
      const photos = Array.isArray(user.photos) ? [...user.photos].sort((a, b) => a.order - b.order) : [];
      return { photos, count: photos.length, maxPhotos: MAX_PHOTOS, minPhotos: MIN_PHOTOS };
    },
    isEmpty: () => isEmptyValue(user.photos),
    displayValue: () => formatters.count(user.photos, 'photo'),
  },
  {
    moduleId: 'prompts',
    title: 'Prompts',
    isClickable: true,
    action: 'navigate_to_prompts_edit',
    data: () => ({
      prompts: promptsWithText,
      count: promptsWithText.length,
      categories: PROMPT_CATEGORIES,
    }),
    isEmpty: () => promptsWithText.length === 0,
    displayValue: () =>
      promptsWithText.length > 0 ? `${promptsWithText.length} prompt${promptsWithText.length > 1 ? 's' : ''} added` : NA,
  },
  {
    moduleId: 'interests',
    title: 'Interests',
    isClickable: true,
    action: 'navigate_to_interests_edit',
    data: () => user.interests || [],
    isEmpty: () => isEmptyValue(user.interests),
    displayValue: () => formatters.count(user.interests, 'interest'),
  },
  {
    moduleId: 'bio',
    title: 'Bio',
    isClickable: true,
    action: 'navigate_to_bio_edit',
    data: () => ({ bio: user.bio || null, characterCount: user.bio ? user.bio.length : 0, maxLength: MAX_BIO_LENGTH }),
    isEmpty: () => isEmptyValue(user.bio),
    displayValue: () => formatters.scalar(user.bio),
  },
  {
    moduleId: 'name',
    title: 'Name',
    isClickable: true,
    action: 'navigate_to_name_edit',
    data: () => ({ firstName: user.firstName }),
    isEmpty: () => isEmptyValue(user.firstName),
    displayValue: () => formatters.scalar(user.firstName),
  },
  {
    moduleId: 'dob',
    title: 'Age',
    isClickable: true,
    data: () => ({ dob: user.dob, age: user.age }),
    isEmpty: () => isEmptyValue(user.dob) && isEmptyValue(user.age),
    displayValue: () => (user.age ? `${user.age} years old` : NA),
  },
  {
    moduleId: 'location',
    title: 'Location',
    isClickable: true,
    data: () => ({
      city: user.city,
      state: user.state,
      country: user.country,
      coordinates: user.location?.coordinates,
    }),
    isEmpty: () => isEmptyValue(user.city),
    displayValue: () => (user.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : NA),
  },
  {
    moduleId: 'languages',
    title: 'Languages',
    isClickable: true,
    data: () => user.languages || [],
    isEmpty: () => isEmptyValue(user.languages),
    displayValue: () => formatters.list(user.languages),
  },
  {
    moduleId: 'height',
    title: 'Height',
    isClickable: true,
    data: () => ({ heightLabel: user.heightLabel, heightCm: user.heightCm }),
    isEmpty: () => isEmptyValue(user.heightLabel),
    displayValue: () => formatters.scalar(user.heightLabel),
  },
  {
    moduleId: 'work',
    title: 'Work',
    isClickable: true,
    data: () => user.work || { jobTitle: null, industry: null },
    isEmpty: () => !user.work || (isEmptyValue(user.work.jobTitle) && isEmptyValue(user.work.industry)),
    displayValue: () => formatters.scalar(user.work?.jobTitle),
  },
  {
    moduleId: 'school',
    title: 'School',
    isClickable: true,
    data: () => ({ school: user.school }),
    isEmpty: () => isEmptyValue(user.school),
    displayValue: () => formatters.scalar(user.school),
  },
  {
    moduleId: 'education',
    title: 'Education',
    isClickable: true,
    data: () => ({ education: user.education }),
    isEmpty: () => isEmptyValue(user.education),
    displayValue: () => formatters.scalar(user.education),
  },
  {
    moduleId: 'pronouns',
    title: 'Pronouns',
    isClickable: true,
    data: () => user.pronouns || [],
    isEmpty: () => isEmptyValue(user.pronouns),
    displayValue: () => formatters.list(user.pronouns),
  },
  {
    moduleId: 'gender',
    title: 'Gender',
    isClickable: true,
    data: () => ({ gender: user.gender, subGender: user.subGender, hideGender: user.hideGender }),
    isEmpty: () => isEmptyValue(user.gender),
    displayValue: () => formatters.scalar(user.gender),
  },
  {
    moduleId: 'sexuality',
    title: 'Sexuality',
    isClickable: true,
    data: () => user.sexuality || [],
    isEmpty: () => isEmptyValue(user.sexuality),
    displayValue: () => formatters.list(user.sexuality),
  },
  {
    moduleId: 'ethnicities',
    title: 'Ethnicities',
    isClickable: true,
    data: () => user.userEthnicities || [],
    isEmpty: () => isEmptyValue(user.userEthnicities),
    displayValue: () => formatters.list(user.userEthnicities),
  },
  {
    moduleId: 'politics',
    title: 'Political View',
    isClickable: true,
    data: () => ({ politicalView: user.politicalView }),
    isEmpty: () => isEmptyValue(user.politicalView),
    displayValue: () => formatters.scalar(user.politicalView),
  },
  {
    moduleId: 'religion',
    title: 'Religion',
    isClickable: true,
    data: () => ({ religion: user.religion }),
    isEmpty: () => isEmptyValue(user.religion),
    displayValue: () => formatters.scalar(user.religion),
  },
  {
    moduleId: 'zodiacSign',
    title: 'Zodiac Sign',
    isClickable: true,
    data: () => ({ zodiacSign: user.zodiacSign }),
    isEmpty: () => isEmptyValue(user.zodiacSign),
    displayValue: () => formatters.scalar(user.zodiacSign),
  },
  {
    moduleId: 'children',
    title: 'Current Kids',
    isClickable: true,
    data: () => ({ children: user.children }),
    isEmpty: () => isEmptyValue(user.children),
    displayValue: () => formatters.scalar(user.children),
  },
  {
    moduleId: 'familyPlans',
    title: 'Family Plans',
    isClickable: true,
    data: () => ({ familyPlans: user.familyPlans }),
    isEmpty: () => isEmptyValue(user.familyPlans),
    displayValue: () => formatters.scalar(user.familyPlans),
  },
  {
    moduleId: 'pets',
    title: 'Pets',
    isClickable: true,
    data: () => user.pets || [],
    isEmpty: () => isEmptyValue(user.pets),
    displayValue: () => formatters.list(user.pets),
  },
  {
    moduleId: 'exercise',
    title: 'Exercise',
    isClickable: true,
    data: () => ({ exercise: user.exercise }),
    isEmpty: () => isEmptyValue(user.exercise),
    displayValue: () => formatters.scalar(user.exercise),
  },
  {
    moduleId: 'drinkingHabits',
    title: 'Drinking',
    isClickable: true,
    data: () => ({ drinkingHabits: user.drinkingHabits }),
    isEmpty: () => isEmptyValue(user.drinkingHabits),
    displayValue: () => formatters.scalar(user.drinkingHabits),
  },
  {
    moduleId: 'smokingHabits',
    title: 'Smoking',
    isClickable: true,
    data: () => ({ smokingHabits: user.smokingHabits }),
    isEmpty: () => isEmptyValue(user.smokingHabits),
    displayValue: () => formatters.scalar(user.smokingHabits),
  },
  {
    moduleId: 'cannabis',
    title: 'Cannabis',
    isClickable: true,
    data: () => ({ cannabis: user.cannabis }),
    isEmpty: () => isEmptyValue(user.cannabis),
    displayValue: () => formatters.scalar(user.cannabis),
  },
  {
    moduleId: 'dietaryPreferences',
    title: 'Dietary Preferences',
    isClickable: true,
    data: () => user.dietaryPreferences || [],
    isEmpty: () => isEmptyValue(user.dietaryPreferences),
    displayValue: () => formatters.list(user.dietaryPreferences),
  },
  {
    moduleId: 'foodAllergies',
    title: 'Food Allergies',
    isClickable: true,
    data: () => user.foodAllergies || [],
    isEmpty: () => isEmptyValue(user.foodAllergies),
    displayValue: () => formatters.list(user.foodAllergies),
  },
  {
    moduleId: 'loveLanguages',
    title: 'Love Languages',
    isClickable: true,
    data: () => user.loveLanguages || [],
    isEmpty: () => isEmptyValue(user.loveLanguages),
    displayValue: () => formatters.list(user.loveLanguages),
  },
  {
    moduleId: 'firstDatePreferences',
    title: 'First Date Preferences',
    isClickable: true,
    data: () => user.firstDatePreferences || [],
    isEmpty: () => isEmptyValue(user.firstDatePreferences),
    displayValue: () => formatters.list(user.firstDatePreferences),
  },
  {
    moduleId: 'meetingAvailability',
    title: 'Meeting Availability',
    isClickable: true,
    data: () => user.meetingAvailability || [],
    isEmpty: () => isEmptyValue(user.meetingAvailability),
    displayValue: () => (Array.isArray(user.meetingAvailability) && user.meetingAvailability.length > 0 ? 'Set' : NA),
  },
  {
    moduleId: 'firstDateDistance',
    title: 'First Date Distance',
    isClickable: true,
    data: () => ({ firstDateDistance: user.firstDateDistance }),
    isEmpty: () => user.firstDateDistance === null || user.firstDateDistance === undefined,
    displayValue: () =>
      user.firstDateDistance !== null && user.firstDateDistance !== undefined ? `${user.firstDateDistance} miles` : NA,
  },
  {
    moduleId: 'lookingFor',
    title: 'Looking For',
    isClickable: true,
    data: () => ({ lookingFor: user.lookingFor }),
    isEmpty: () => isEmptyValue(user.lookingFor),
    displayValue: () => formatters.scalar(user.lookingFor),
  },
  {
    moduleId: 'relationshipType',
    title: 'Relationship Type',
    isClickable: true,
    data: () => ({ relationshipType: user.relationshipType }),
    isEmpty: () => isEmptyValue(user.relationshipType),
    displayValue: () => formatters.scalar(user.relationshipType),
  },
  {
    moduleId: 'datingExpectations',
    title: 'Dating Expectations',
    isClickable: true,
    data: () => ({ datingExpectations: user.datingExpectations }),
    isEmpty: () => isEmptyValue(user.datingExpectations),
    displayValue: () => formatters.scalar(user.datingExpectations),
  },
  {
    moduleId: 'activeStatus',
    title: 'Active Status',
    isClickable: true,
    data: () => ({ activeStatus: user.activeStatus }),
    isEmpty: () => isEmptyValue(user.activeStatus),
    displayValue: () => formatters.scalar(user.activeStatus),
  },
];

const buildEditProfileData = (definitions) =>
  definitions.reduce((acc, def, index) => {
    acc[def.moduleId] = {
      moduleId: def.moduleId,
      title: def.title,
      order: index + 1,
      isClickable: def.isClickable,
      ...(def.action ? { action: def.action } : {}),
      data: def.data(),
      isEmpty: def.isEmpty(),
      displayValue: def.displayValue(),
    };
    return acc;
  }, {});

export default async ({ userId }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId'],
    sourceDocument: { userId },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  try {
    const [user, prompts] = await Promise.all([
      UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select(USER_PROJECTION).lean(),
      PromptModel.find({ userRef: userId, deleted: false }).sort({ order: 1 }).lean(),
    ]);

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    const promptsWithText = prompts.map((prompt) => ({
      ...prompt,
      promptText: PROMPTS[prompt.promptId] || 'Unknown Prompt',
    }));

    const fieldDefinitions = buildFieldDefinitions({ user, promptsWithText });
    const editProfileData = buildEditProfileData(fieldDefinitions);

    return ResponseUtility.SUCCESS({ data: editProfileData, message: 'Edit profile data retrieved successfully.' });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};