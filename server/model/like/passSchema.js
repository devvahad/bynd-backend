import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const PassSchema = new Schema(
  {
    // user who is passing
    userRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    // user who is being passed
    passedUserRef: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    passIdempotencyKey: {
      type: String, required: true, unique: true, index: true,
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

PassSchema.index({ userRef: 1, passedUserRef: 1, deleted: 1 }, { unique: true });
PassSchema.index({ userRef: 1, deleted: 1, createdOn: -1 });

const PassModel = model('Pass', PassSchema);

export default PassModel;
