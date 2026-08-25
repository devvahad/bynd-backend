import mongoose from 'mongoose';
import { DATE_FEEDBACK_RATINGS } from '../../constants.js';

const { Schema, model } = mongoose;

const DateFeedbackSchema = new Schema(
  {
    dateRequestRef: {
      type: Schema.Types.ObjectId, ref: 'DateRequest', required: true, index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    otherUserRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    rating: { type: String, enum: [...DATE_FEEDBACK_RATINGS, null], default: null },
    noShowReported: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    deletedOn: { type: Date },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

DateFeedbackSchema.index({ dateRequestRef: 1, submittedBy: 1 }, { unique: true });

const DateFeedbackModel = model('DateFeedback', DateFeedbackSchema);

export default DateFeedbackModel;
