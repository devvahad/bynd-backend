import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const MessageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    to: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    content: { type: String },
    messageType: { type: String, default: 'text' },
    sentAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    deleted: { type: Boolean, default: false },
    deletedOn: { type: Date },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

MessageSchema.index({ from: 1, to: 1, sentAt: -1 });
MessageSchema.index({ to: 1, readAt: 1 });

const MessageModel = model('Message', MessageSchema);

export default MessageModel;
