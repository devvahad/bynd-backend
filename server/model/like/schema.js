import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const LikeSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    likedUserRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    likeIdempotencyKey: {
      type: String, required: true, unique: true, index: true,
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

LikeSchema.index({ userRef: 1, likedUserRef: 1, deleted: 1 }, { unique: true });
LikeSchema.index({ likedUserRef: 1, userRef: 1, deleted: 1 });
LikeSchema.index({ userRef: 1, deleted: 1, createdOn: -1 });

const LikeModel = model('Like', LikeSchema);

export default LikeModel;
