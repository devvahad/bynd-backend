import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

export const BroadcastSchema = validate(
  Joi.object({
    title: Joi.string().trim().min(2).max(200).required(),
    subtitle: Joi.string().trim().max(500).optional(),
    type: Joi.number().optional(),
    picture: Joi.string().uri().optional(),
  }),
);