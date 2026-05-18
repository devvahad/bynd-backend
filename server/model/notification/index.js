import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, trim: true, required: true },
    subtitle: { type: String, trim: true },
    type: { type: Number },
    reference: { type: Schema.Types.ObjectId },
    picture: { type: String },
    isBroadcast: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, isDeleted: 1 });

const NotificationModel = model('Notification', NotificationSchema);

export default NotificationModel;