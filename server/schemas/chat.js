import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const objectId = Joi.string().trim().length(24).hex();

export const ChatUserListSchema = validate(
  Joi.object({
    text: Joi.string().trim().allow('').optional(),
    filterType: Joi.number().valid(1, 2, 3).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);

export const ChatMessageListSchema = validate(
  Joi.object({
    userRef: objectId.required(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);

export const ChatActionSchema = validate(
  Joi.object({
    userRef: objectId.required(),
    action: Joi.number().valid(1, 2, 3).required(),
    comment: Joi.object({
      category: Joi.string().trim().optional(),
      subOption: Joi.string().trim().allow(null, '').optional(),
    }).optional(),
  }),
);
