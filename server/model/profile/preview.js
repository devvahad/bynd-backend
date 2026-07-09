import { UserModel } from '../index.js';
import PromptModel from '../prompt/index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, PROMPTS, NA, USER_PROJECTION } from '../../constants.js';

const formatters = {
  scalar: (value) => (value === null || value === undefined || value === '' ? NA : value),
  list: (values) => (Array.isArray(values) && values.length > 0 ? values.join(', ') : NA),
};

const formatLocation = (user) => (user.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : NA);

const formatWork = (user) =>
  user.work && user.work.jobTitle
    ? `${user.work.jobTitle}${user.work.industry ? ` at ${user.work.industry}` : ''}`
    : NA;

const formatSexuality = (user) => {
  if (Array.isArray(user.sexuality) && user.sexuality.length > 0) {
    return user.sexuality.join(', ');
  }
  if (Array.isArray(user.datePreferences) && user.datePreferences.length > 0) {
    return user.datePreferences.join(', ');
  }
  return NA;
};

const buildSection = (title, fields) => ({ title, fields });

const buildBasicDetails = (user) =>
  buildSection('The Basics', [
    { label: 'Location', value: formatLocation(user) },
    { label: 'Languages Spoken', value: formatters.list(user.languages) },
    { label: 'Height', value: formatters.scalar(user.heightLabel) },
    { label: 'Work', value: formatWork(user) },
    { label: 'School', value: formatters.scalar(user.school) },
    { label: 'Education', value: formatters.scalar(user.education) },
  ]);

const buildIdentityDetails = (user) =>
  buildSection('More About Me', [
    { label: 'Pronouns', value: formatters.list(user.pronouns) },
    { label: 'Gender', value: formatters.scalar(user.gender) },
    { label: 'Sexuality', value: formatSexuality(user) },
    { label: 'Ethnicity', value: formatters.list(user.userEthnicities) },
    { label: 'Politics', value: formatters.scalar(user.politicalView) },
    { label: 'Religion', value: formatters.scalar(user.religion) },
    { label: 'Zodiac Sign', value: formatters.scalar(user.zodiacSign) },
  ]);

const buildLifestyleDetails = (user) =>
  buildSection('Lifestyle', [
    { label: 'Current Kids', value: formatters.scalar(user.children) },
    { label: 'Family Plans', value: formatters.scalar(user.familyPlans) },
    { label: 'Pets', value: formatters.list(user.pets) },
    { label: 'Exercise', value: formatters.scalar(user.exercise) },
    { label: 'Drinking', value: formatters.scalar(user.drinkingHabits) },
    { label: 'Smoking', value: formatters.scalar(user.smokingHabits) },
    { label: 'Cannabis', value: formatters.scalar(user.cannabis) },
    { label: 'Dietary Preferences', value: formatters.list(user.dietaryPreferences) },
    { label: 'Food Allergies', value: formatters.list(user.foodAllergies) },
  ]);

const buildRelationshipPreferences = (user) =>
  buildSection('Relationship Preferences', [
    { label: 'First Date Preferences', value: formatters.list(user.firstDatePreferences) },
    { label: 'Availability', value: formatters.scalar(user.meetingAvailability) },
    { label: 'First Date Distance', value: user.firstDateDistance || NA },
    { label: 'Relationship Type', value: user.lookingFor || user.relationshipType || NA },
    { label: 'Dating Expectations', value: formatters.scalar(user.datingExpectations) },
    { label: 'Love Languages', value: formatters.list(user.loveLanguages) },
  ]);

const buildPrompts = (userPrompts) =>
  userPrompts.map((prompt) => ({
    promptId: prompt.promptId,
    promptText: PROMPTS[prompt.promptId],
    response: prompt.response,
    order: prompt.order,
  }));

export default async ({ userId }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId'],
    sourceDocument: { userId },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  try {
    const [user, userPrompts] = await Promise.all([
      UserModel.findOne({ _id: userId, blocked: false, deleted: false }).select(USER_PROJECTION).lean(),
      PromptModel.find({ userRef: userId, deleted: false }).select('promptId response order').sort({ order: 1 }).lean(),
    ]);

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    const prompts = buildPrompts(userPrompts);
    const photos = Array.isArray(user.photos) && user.photos.length > 0 ? [...user.photos].sort((a, b) => a.order - b.order) : [];

    const profilePreview = {
      header: {
        firstName: user.firstName || NA,
        age: user.age || NA,
        location: formatLocation(user),
        verified: user.verified || false,
      },
      photos: {
        title: 'Photos',
        data: photos,
        isEmpty: photos.length === 0,
      },
      prompts: {
        title: 'Prompts',
        data: prompts,
        isEmpty: prompts.length === 0,
      },
      interests: {
        title: 'Interests',
        data: user.interests || [],
        isEmpty: !user.interests || user.interests.length === 0,
      },
      bio: {
        title: 'Bio',
        data: formatters.scalar(user.bio),
        isEmpty: !user.bio,
      },
      basicDetails: buildBasicDetails(user),
      identityDetails: buildIdentityDetails(user),
      lifestyleDetails: buildLifestyleDetails(user),
      relationshipPreferences: buildRelationshipPreferences(user),
    };

    return ResponseUtility.SUCCESS({ data: profilePreview, message: 'Profile preview retrieved successfully.' });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};