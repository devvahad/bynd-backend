import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const MissedMatchSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    missedUserRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    popupShown: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false },
    userSegment: { type: String, enum: ['low', 'medium', 'high'] },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

MissedMatchSchema.index({ userRef: 1, missedUserRef: 1, deleted: 1 });
MissedMatchSchema.index({ userRef: 1, createdOn: -1 });

const MissedMatchModel = model('MissedMatch', MissedMatchSchema);

export default MissedMatchModel;
