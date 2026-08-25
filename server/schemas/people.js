import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

export const PeopleHomeSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),
  }),
);
