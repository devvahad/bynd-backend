import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

export const AddAppDetailSchema = validate(
  Joi.object({
    title: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(1000).optional(),
    version: Joi.string().trim().optional(),
    contactEmail: Joi.string().email().optional(),
    privacyPolicyUrl: Joi.string().uri().optional(),
    termsUrl: Joi.string().uri().optional(),
  }),
);

export const UpdateAppDetailSchema = validate(
  Joi.object({
    id: Joi.string().hex().length(24).required(),
    title: Joi.string().trim().min(2).max(100).optional(),
    description: Joi.string().trim().max(1000).optional(),
    version: Joi.string().trim().optional(),
    contactEmail: Joi.string().email().optional(),
    privacyPolicyUrl: Joi.string().uri().optional(),
    termsUrl: Joi.string().uri().optional(),
  }),
);