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

const objectId = Joi.string().trim().length(24).hex();

export const AdminUserDetailsSchema = validate(
  Joi.object({ userId: objectId.required() }),
);

export const AdminBlockUserSchema = validate(
  Joi.object({ userId: objectId.required(), action: Joi.string().valid('block', 'unblock').required() }),
);

export const AdminDeleteUserSchema = validate(
  Joi.object({ userId: objectId.required() }),
);

export const AdminGetVerificationDetailsSchema = validate(
  Joi.object({ userId: objectId.required() }),
);

export const AdminReviewVerificationSchema = validate(
  Joi.object({ userId: objectId.required(), action: Joi.string().valid('approve', 'reject').required() }),
);

export const AdminReportsSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().trim().allow('').optional(),
    status: Joi.string().valid('pending', 'reviewed', '').optional(),
    source: Joi.string().valid('PROFILE', 'CHAT', '').optional(),
    category: Joi.string().trim().allow('').optional(),
    subOption: Joi.string().trim().allow('').optional(),
  }),
);

export const AdminReviewReportSchema = validate(
  Joi.object({ reportId: objectId.required() }),
);

export const AdminSendForgotPasswordEmailSchema = validate(
  Joi.object({ email: Joi.string().email().required() }),
);

export const AdminResetPasswordSchema = validate(
  Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().trim().required(),
    newPassword: Joi.string().min(8).max(64).required(),
  }),
);

export const NoShowUsersListSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().trim().allow('').optional(),
  }),
);