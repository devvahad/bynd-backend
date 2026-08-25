import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const contactItem = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  phoneNumber: Joi.string().trim().min(4).max(20).required(),
});

export const AddBlockedContactSchema = validate(
  Joi.object({
    name: Joi.string().trim().min(1).max(120).required(),
    phoneNumber: Joi.string().trim().min(4).max(20).required(),
  }),
);

export const ListBlockedContactsSchema = validate(
  Joi.object({
    search: Joi.string().trim().allow('').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);

export const UnblockContactSchema = validate(
  Joi.object({
    blockedContactId: Joi.string().trim().required(),
  }),
);

export const SyncContactsSchema = validate(
  Joi.object({
    contacts: Joi.array().items(contactItem).min(1).required(),
  }),
);

export const ContactsListSchema = validate(
  Joi.object({
    search: Joi.string().trim().allow('').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);
