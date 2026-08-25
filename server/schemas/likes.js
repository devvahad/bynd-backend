import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const objectId = Joi.string().trim().length(24).hex();

export const LikeUserSchema = validate(
  Joi.object({
    likedUserId: objectId.required(),
    likeIdempotencyKey: Joi.string().trim().optional(),
  }),
);

export const PassUserSchema = validate(
  Joi.object({
    passedUserId: objectId.required(),
    passIdempotencyKey: Joi.string().trim().optional(),
  }),
);

export const UnlikeUserSchema = validate(
  Joi.object({
    unlikedUserId: objectId.required(),
  }),
);

export const LikedListSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);

export const LikedByListSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);

export const UndoPassSchema = validate(Joi.object({}));

export const GetUserDetailsSchema = validate(
  Joi.object({
    profileUserId: objectId.required(),
  }),
);
