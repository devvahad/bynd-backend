import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

export const AddFaqSchema = validate(
  Joi.object({
    question: Joi.string().trim().min(5).max(500).required(),
    answer: Joi.string().trim().min(5).max(2000).required(),
    order: Joi.number().optional(),
  }),
);

export const UpdateFaqSchema = validate(
  Joi.object({
    id: Joi.string().hex().length(24).required(),
    question: Joi.string().trim().min(5).max(500).optional(),
    answer: Joi.string().trim().min(5).max(2000).optional(),
    order: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
  }),
);

export const DeleteFaqSchema = validate(
  Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
);