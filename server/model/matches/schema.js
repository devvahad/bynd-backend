import mongoose from 'mongoose';
import { MATCH_STATUS } from '../../constants.js';

const { Schema, model } = mongoose;

const MatchSchema = new Schema(
  {
    user1Ref: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    user2Ref: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    status: {
      type: String, enum: Object.values(MATCH_STATUS), default: MATCH_STATUS.ACTIVE,
    },
    datePlanned: { type: Date, default: null },
    dateDetails: { type: Schema.Types.Mixed, default: null },
    unmatchedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    unmatchedOn: { type: Date },
    source: { type: String, enum: ['CHAT', 'DATE_REQUEST', null], default: null },
    expiryRemindersSent: { type: [String], default: [] },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

MatchSchema.index({ user1Ref: 1, user2Ref: 1, deleted: 1 }, { unique: true });
MatchSchema.index({ user1Ref: 1, status: 1, deleted: 1, createdOn: -1 });
MatchSchema.index({ user2Ref: 1, status: 1, deleted: 1, createdOn: -1 });

const MatchModel = model('Match', MatchSchema);

export default MatchModel;
