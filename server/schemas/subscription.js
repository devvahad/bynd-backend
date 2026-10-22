import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

export const SubscriptionBuySchema = validate(
  Joi.object({
    receiptId: Joi.string().trim().optional(),
    device: Joi.string().valid('ios', 'android').default('android'),
    purchaseToken: Joi.string().trim().optional(),
    subscriptionType: Joi.number().valid(1, 2, 3, 4).optional(),
    packageName: Joi.string().trim().optional(),
    productId: Joi.string().trim().required(),
  }),
);

export const SubscriptionDetailSchema = validate(Joi.object({}));

export const SubscriptionRestoreSchema = validate(
  Joi.object({
    receiptId: Joi.string().trim().optional(),
    device: Joi.string().valid('ios', 'android').default('android'),
    purchaseToken: Joi.string().trim().optional(),
    packageName: Joi.string().trim().optional(),
  }),
);

export const SubscriptionCancelSchema = validate(Joi.object({}));

export const SubscriptionTransactionHistorySchema = validate(
  Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
);

export const SubscriptionGetPlansSchema = validate(Joi.object({}));
