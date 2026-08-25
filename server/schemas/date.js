import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';
import { DATE_FEEDBACK_RATINGS } from '../constants.js';

const objectId = Joi.string().trim().length(24).hex();

export const DateListSchema = validate(
  Joi.object({
    selectedDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    includeCalendar: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
);

export const DateFeedbackSchema = validate(
  Joi.object({
    requestId: objectId.required(),
    rating: Joi.string().valid(...DATE_FEEDBACK_RATINGS).optional(),
    noShowReported: Joi.boolean().optional(),
  }),
);
