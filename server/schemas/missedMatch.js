import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const objectId = Joi.string().trim().length(24).hex();

export const FindOutWhoSchema = validate(
  Joi.object({ missedMatchId: objectId.required() }),
);

export const PassAfterMissedMatchSchema = validate(
  Joi.object({ missedUserId: objectId.required() }),
);

export const InitSessionSchema = validate(Joi.object({}));
