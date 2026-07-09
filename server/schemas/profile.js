import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';
import {
  PRONOUNS,
  SEXUALITY_OPTIONS,
  ZODIAC_SIGNS,
  CHILDREN_STATUS,
  FAMILY_PLANS,
  PETS_OPTIONS,
  EXERCISE_HABITS,
  DRINKING_HABITS,
  SMOKING_HABITS,
  CANNABIS,
  DIETARY_PREFERENCES,
  FOOD_ALLERGIES,
  LOVE_LANGUAGES,
  FIRST_DATE_ACTIVITIES,
  LOOKING_FOR,
  RELATIONSHIP_TYPES,
  DATING_EXPECTATIONS,
  ACTIVE_STATUS,
  USER_ETHNICITIES,
  RELIGIONS,
  POLITICAL_VIEWS,
  ALLOWED_GENDERS,
  MEETING_DAYS,
  MEETING_TIME_SLOTS,
  MAX_PROMPT_RESPONSE_LENGTH,
} from '../constants.js';

export const EditNameSchema = validate(
  Joi.object({
    firstName: Joi.string().trim().min(2).max(40).required(),
  }),
);

export const UpdateBioSchema = validate(
  Joi.object({
    bio: Joi.string().trim().max(500).allow('', null).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateDOBSchema = validate(
  Joi.object({
    dob: Joi.date().iso().required(),
  }),
);

export const UpdateInterestsSchema = validate(
  Joi.object({
    interests: Joi.array()
      .items(
        Joi.object({
          category: Joi.string().required(),
          tags: Joi.array().items(Joi.string()).max(3).required(),
        }),
      )
      .optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateLanguagesSchema = validate(
  Joi.object({
    languages: Joi.array().items(Joi.string()).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdatePromptSchema = validate(
  Joi.object({
    action: Joi.string().valid('add', 'update', 'delete', 'reorder').required(),
    promptId: Joi.number().integer().min(1).max(40).optional(),
    response: Joi.string().trim().max(MAX_PROMPT_RESPONSE_LENGTH).optional(),
    order: Joi.number().integer().min(0).max(3).optional(),
  }),
);

export const RemovePhotoSchema = validate(
  Joi.object({
    photoUrl: Joi.string().required(),
  }),
);

export const ReorderPhotosSchema = validate(
  Joi.object({
    photoOrder: Joi.array().items(Joi.string()).min(1).required(),
  }),
);

export const UpdateGenderSchema = validate(
  Joi.object({
    gender: Joi.string().valid(...ALLOWED_GENDERS).required(),
    subGender: Joi.string().trim().max(50).optional().allow('', null),
    hideGender: Joi.boolean().optional(),
  }),
);

export const UpdatePronounsSchema = validate(
  Joi.object({
    pronouns: Joi.array().items(Joi.string().valid(...PRONOUNS)).max(3).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateSexualitySchema = validate(
  Joi.object({
    sexuality: Joi.array().items(Joi.string().valid(...SEXUALITY_OPTIONS)).max(2).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateZodiacSignSchema = validate(
  Joi.object({
    zodiacSign: Joi.string().valid(...ZODIAC_SIGNS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateEthnicitiesSchema = validate(
  Joi.object({
    userEthnicities: Joi.array().items(Joi.string().valid(...USER_ETHNICITIES)).max(3).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateReligionSchema = validate(
  Joi.object({
    religion: Joi.string().valid(...RELIGIONS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdatePoliticalViewSchema = validate(
  Joi.object({
    politicalView: Joi.string().valid(...POLITICAL_VIEWS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateHeightSchema = validate(
  Joi.object({
    heightCm: Joi.number().min(100).max(250).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateWorkSchema = validate(
  Joi.object({
    work: Joi.object({
      jobTitle: Joi.string().trim().max(100).optional().allow('', null),
      industry: Joi.string().trim().max(100).optional().allow('', null),
    }).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateSchoolSchema = validate(
  Joi.object({
    school: Joi.string().trim().max(100).optional().allow('', null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateEducationSchema = validate(
  Joi.object({
    education: Joi.string().trim().optional().allow('', null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateLocationSchema = validate(
  Joi.object({
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).required(),
  }),
);

export const UpdateChildrenSchema = validate(
  Joi.object({
    children: Joi.string().valid(...CHILDREN_STATUS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateFamilyPlansSchema = validate(
  Joi.object({
    familyPlans: Joi.string().valid(...FAMILY_PLANS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdatePetsSchema = validate(
  Joi.object({
    pets: Joi.array().items(Joi.string().valid(...PETS_OPTIONS)).max(3).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateExerciseSchema = validate(
  Joi.object({
    exercise: Joi.string().valid(...EXERCISE_HABITS).required(),
  }),
);

export const UpdateDrinkingHabitsSchema = validate(
  Joi.object({
    drinkingHabits: Joi.string().valid(...DRINKING_HABITS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateSmokingHabitsSchema = validate(
  Joi.object({
    smokingHabits: Joi.string().valid(...SMOKING_HABITS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateCannabisSchema = validate(
  Joi.object({
    cannabis: Joi.string().valid(...CANNABIS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateDietaryPreferencesSchema = validate(
  Joi.object({
    dietaryPreferences: Joi.array().items(Joi.string().valid(...DIETARY_PREFERENCES)).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateFoodAllergiesSchema = validate(
  Joi.object({
    foodAllergies: Joi.array().items(Joi.string().valid(...FOOD_ALLERGIES)).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateActiveStatusSchema = validate(
  Joi.object({
    activeStatus: Joi.string().valid(...ACTIVE_STATUS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateLoveLanguagesSchema = validate(
  Joi.object({
    loveLanguages: Joi.array().items(Joi.string().valid(...LOVE_LANGUAGES)).max(2).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateFirstDatePreferencesSchema = validate(
  Joi.object({
    firstDatePreferences: Joi.array()
      .items(Joi.string().valid(...FIRST_DATE_ACTIVITIES))
      .max(3)
      .optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateLookingForSchema = validate(
  Joi.object({
    lookingFor: Joi.string().valid(...LOOKING_FOR).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateRelationshipTypeSchema = validate(
  Joi.object({
    relationshipType: Joi.string().valid(...RELATIONSHIP_TYPES).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateDatingExpectationsSchema = validate(
  Joi.object({
    datingExpectations: Joi.string().valid(...DATING_EXPECTATIONS).optional().allow(null),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateFirstDateDistanceSchema = validate(
  Joi.object({
    firstDateDistance: Joi.number().integer().min(1).max(100).optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);

export const UpdateMeetingAvailabilitySchema = validate(
  Joi.object({
    meetingAvailability: Joi.array()
      .items(
        Joi.object({
          day: Joi.string().valid(...MEETING_DAYS).required(),
          timeSlots: Joi.array().items(Joi.string().valid(...MEETING_TIME_SLOTS)).min(1).required(),
        }),
      )
      .optional(),
    preferNotToSay: Joi.boolean().optional(),
  }),
);