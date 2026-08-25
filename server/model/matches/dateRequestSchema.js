import mongoose from 'mongoose';
import { DATE_REQUEST_STATUS, FIRST_DATE_ACTIVITIES } from '../../constants.js';

const { Schema, model } = mongoose;

const DateRequestSchema = new Schema(
  {
    matchRef: {
      type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true,
    },
    senderRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    receiverRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    dateType: { type: String, enum: FIRST_DATE_ACTIVITIES, required: true },
    dateTime: { type: Date, required: true, index: true },
    location: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      placeId: { type: String, default: null },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    message: { type: String, maxlength: 200, default: null },
    status: {
      type: String, enum: Object.values(DATE_REQUEST_STATUS), default: DATE_REQUEST_STATUS.PENDING, index: true,
    },
    requestIdempotencyKey: { type: String, unique: true, required: true },
    responseMessage: { type: String, default: null },
    respondedAt: { type: Date, default: null },
    // Counter-proposal fields.
    originalRequestRef: { type: Schema.Types.ObjectId, ref: 'DateRequest', default: null },
    isCounterProposal: { type: Boolean, default: false },
    remindersSent: { type: [String], default: [] },
    expiryRemindersSent: { type: [String], default: [] },
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

DateRequestSchema.index({ matchRef: 1, status: 1 });
DateRequestSchema.index({ senderRef: 1, dateTime: 1 });
DateRequestSchema.index({ receiverRef: 1, status: 1 });
DateRequestSchema.index({ dateTime: 1, status: 1 });
DateRequestSchema.index({ 'location.coordinates': '2dsphere' });

const DateRequestModel = model('DateRequest', DateRequestSchema);

export default DateRequestModel;
