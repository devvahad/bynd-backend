import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const stringArray = Joi.array().items(Joi.string().trim()).optional();

export const BasicFiltersSchema = validate(
  Joi.object({
    basicFilters: Joi.object({
      distance: Joi.number().min(0).max(30).optional(),
      ageRange: Joi.object({
        min: Joi.number().min(18).max(90).optional(),
        max: Joi.number().min(18).max(90).optional(),
      }).optional(),
      verifiedOnly: Joi.boolean().optional(),
      religions: stringArray,
      genders: stringArray,
      ethnicities: stringArray,
      datingExpectations: stringArray,
      expandDistance: Joi.boolean().optional(),
      expandAge: Joi.boolean().optional(),
    }).optional(),
  }),
);

export const AdvancedFiltersSchema = validate(
  Joi.object({
    advancedFilters: Joi.object({
      heightRange: Joi.alternatives().try(
        Joi.string(),
        Joi.object({
          min: Joi.number().optional(),
          max: Joi.number().optional(),
          minFeet: Joi.number().optional(),
          minInches: Joi.number().optional(),
          maxFeet: Joi.number().optional(),
          maxInches: Joi.number().optional(),
        }),
      ).optional(),
      expandHeight: Joi.boolean().optional(),
      politicalViews: stringArray,
      drinkingHabits: stringArray,
      smokingHabits: stringArray,
      children: stringArray,
      familyPlans: stringArray,
      education: stringArray,
      exercise: stringArray,
      relationshipType: stringArray,
      languages: stringArray,
    }).optional(),
  }),
);

export const GetSavedFiltersSchema = validate(Joi.object({}));
export const ResetFiltersSchema = validate(Joi.object({}));
