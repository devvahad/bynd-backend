import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const password = Joi.string().min(8).max(64).required();
const email = Joi.string().email().required();

export const SignupSchema = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email,
    password,
    phone: Joi.string().trim().optional(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const LoginSchema = validate(
  Joi.object({
    email,
    password,
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const ForgotPasswordSchema = validate(
  Joi.object({ email }),
);

export const ResetPasswordSchema = validate(
  Joi.object({
    email,
    code: Joi.number().required(),
    newPassword: password,
  }),
);

export const UpdatePasswordSchema = validate(
  Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: password,
  }),
);

export const UpdateUserSchema = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(80).optional(),
    phone: Joi.string().trim().optional(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const SocialLoginSchema = validate(
  Joi.object({
    accessToken: Joi.string().required(),
    provider: Joi.string().valid('google', 'apple').required(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);