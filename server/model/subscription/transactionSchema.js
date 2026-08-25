import mongoose from 'mongoose';
import { SUBSCRIPTION_TYPE, DEVICE_TYPES } from '../../constants.js';

const { Schema, model } = mongoose;

const TransactionSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    subscriptionRef: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    type: { type: Number, enum: Object.values(SUBSCRIPTION_TYPE), required: true },
    device: { type: String, enum: Object.values(DEVICE_TYPES) },
    productId: { type: String },
    transactionId: { type: String },
    originalTransactionId: { type: String, default: null },
    expireAt: { type: Date },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

TransactionSchema.index({ userRef: 1, createdOn: -1 });

const TransactionModel = model('Transaction', TransactionSchema);

export default TransactionModel;
