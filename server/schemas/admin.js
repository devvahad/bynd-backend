import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

export const AdminLoginSchema = validate(
  Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),
);

export const AdminSignupSchema = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(64).required(),
    isSuperAdmin: Joi.boolean().optional(),
  }),
);

export const EditUserSchema = validate(
  Joi.object({
    userId: Joi.string().hex().length(24).required(),
    isActive: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
    name: Joi.string().trim().optional(),
  }),
);