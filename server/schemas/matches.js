import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const objectId = Joi.string().trim().length(24).hex();

const locationSchema = Joi.object({
  name: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  placeId: Joi.string().trim().optional(),
  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
});

export const PlanADateListSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
);

export const GetMatchDetailsSchema = validate(
  Joi.object({ matchId: objectId.required() }),
);

export const GetAvailableDateSlotsSchema = validate(
  Joi.object({
    matchedUserId: objectId.required(),
    selectedDate: Joi.date().iso().optional(),
  }),
);

export const SendDateRequestSchema = validate(
  Joi.object({
    matchId: objectId.required(),
    dateType: Joi.string().trim().required(),
    dateTime: Joi.date().iso().required(),
    location: locationSchema.required(),
    message: Joi.string().trim().max(200).allow('').optional(),
    requestIdempotencyKey: Joi.string().trim().optional(),
  }),
);

export const SearchLocationsSchema = validate(
  Joi.object({
    input: Joi.string().trim().min(1).required(),
    userLat: Joi.number().optional(),
    userLng: Joi.number().optional(),
  }),
);

export const GetLocationDetailsSchema = validate(
  Joi.object({ placeId: Joi.string().trim().required() }),
);

export const ValidateLocationDistanceSchema = validate(
  Joi.object({
    matchUserId: objectId.required(),
    locationLat: Joi.number().required(),
    locationLng: Joi.number().required(),
  }),
);

export const GetDateRequestsListSchema = validate(
  Joi.object({
    filter: Joi.string().valid('their_turn', 'your_turn').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
);

export const PreviewDateRequestSchema = validate(
  Joi.object({
    matchId: objectId.required(),
    dateType: Joi.string().trim().required(),
    dateTime: Joi.date().iso().required(),
    location: locationSchema.required(),
    message: Joi.string().trim().max(200).allow('').optional(),
  }),
);

export const GetDateRequestDetailsSchema = validate(
  Joi.object({ requestId: objectId.required() }),
);

export const EditDateRequestSchema = validate(
  Joi.object({
    requestId: objectId.required(),
    dateType: Joi.string().trim().optional(),
    dateTime: Joi.date().iso().optional(),
    location: Joi.object({
      name: Joi.string().trim().required(),
      address: Joi.string().trim().required(),
      placeId: Joi.string().trim().optional(),
      coordinates: Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() }).optional(),
    }).optional(),
    message: Joi.string().trim().max(200).allow('', null).optional(),
  }),
);

export const CancelDateRequestSchema = validate(
  Joi.object({ requestId: objectId.required() }),
);

export const AcceptDateRequestSchema = validate(
  Joi.object({ requestId: objectId.required() }),
);

export const RejectDateRequestSchema = validate(
  Joi.object({ requestId: objectId.required(), declineReason: Joi.string().trim().max(200).optional() }),
);

export const GetConfirmedDatesSchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
);

export const ProposeNewRequestSchema = validate(
  Joi.object({
    requestId: objectId.required(),
    dateType: Joi.string().trim().required(),
    dateTime: Joi.date().iso().optional(),
    location: locationSchema.optional(),
    message: Joi.string().trim().max(200).allow('').optional(),
    proposalIdempotencyKey: Joi.string().trim().optional(),
  }),
);
