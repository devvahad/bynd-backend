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
