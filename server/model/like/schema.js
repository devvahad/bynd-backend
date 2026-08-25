import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const LikeSchema = new Schema(
  {
    // user who is liking
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    // user who is being liked
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

// A user can only like another user once (excluding soft-deleted entries).
LikeSchema.index({ userRef: 1, likedUserRef: 1, deleted: 1 }, { unique: true });
// Efficient lookup for mutual-like (match) checks.
LikeSchema.index({ likedUserRef: 1, userRef: 1, deleted: 1 });
LikeSchema.index({ userRef: 1, deleted: 1, createdOn: -1 });

const LikeModel = model('Like', LikeSchema);

export default LikeModel;
