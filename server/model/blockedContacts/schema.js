import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const BlockedContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, required: true, ref: 'User', index: true,
    },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    blockedUserRef: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['MANUAL', 'SYNC'], default: 'MANUAL' },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

BlockedContactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
BlockedContactSchema.index({ userId: 1, createdOn: -1 });
BlockedContactSchema.index({ blockedUserRef: 1 });

export const BlockedContactModel = model('BlockedContact', BlockedContactSchema);

const SyncedContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, required: true, ref: 'User', index: true,
    },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    userRef: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

SyncedContactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
SyncedContactSchema.index({ userId: 1, name: 1 });

export const SyncedContactModel = model('SyncedContact', SyncedContactSchema);

export default BlockedContactModel;
