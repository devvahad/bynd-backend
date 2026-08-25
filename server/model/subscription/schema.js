import mongoose from 'mongoose';
import { SUBSCRIPTION_TYPE, DEVICE_TYPES } from '../../constants.js';

const { Schema, model } = mongoose;

const SubscriptionSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    transactionId: { type: String },
    originalTransactionId: { type: String, default: null },
    response: { type: Object, default: {} },
    productId: { type: String, default: '' },
    device: { type: String, enum: Object.values(DEVICE_TYPES), default: DEVICE_TYPES.ANDROID },
    expireDate: { type: Date, index: true },
    lastPayment: { type: Date },
    type: { type: Number, enum: Object.values(SUBSCRIPTION_TYPE) },
    cancelAutoRenewal: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    deletedOn: { type: Date },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

SubscriptionSchema.index({ userRef: 1, deleted: 1, updatedOn: -1 });
SubscriptionSchema.index({ userRef: 1, type: 1, deleted: 1 });

const SubscriptionModel = model('Subscription', SubscriptionSchema);

export default SubscriptionModel;
