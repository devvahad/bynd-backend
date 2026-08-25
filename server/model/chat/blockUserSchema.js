import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const BlockUserSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    blockedBy: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

BlockUserSchema.index({ userRef: 1, blockedBy: 1 }, { unique: true });

const BlockUserModel = model('BlockUser', BlockUserSchema);

export default BlockUserModel;
