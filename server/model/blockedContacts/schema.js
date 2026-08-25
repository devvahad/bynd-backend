import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Manually (or sync-derived) blocked contact entries.
 * Separate from in-app chat blocking (USER_CHAT_ACTION.BLOCK), which
 * operates on User <-> User relationships rather than raw phone contacts.
 */
const BlockedContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, required: true, ref: 'User', index: true,
    },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    // If the blocked contact has an account on the platform.
    blockedUserRef: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Whether this entry came from a manual block or a contact-sync import.
    source: { type: String, enum: ['MANUAL', 'SYNC'], default: 'MANUAL' },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

BlockedContactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
BlockedContactSchema.index({ userId: 1, createdOn: -1 });
BlockedContactSchema.index({ blockedUserRef: 1 });

export const BlockedContactModel = model('BlockedContact', BlockedContactSchema);

/**
 * Contacts synced from a user's phone (one-time sync), used to derive
 * "hasAccount" hints and to power the blocked-contacts picker.
 */
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
