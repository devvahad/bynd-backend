import mongoose from 'mongoose';
import { MAX_PROMPT_RESPONSE_LENGTH } from '../../constants.js';

const { Schema, model } = mongoose;

const PromptSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    promptId: {
      type: Number,
      required: true,
      min: 1,
      max: 40,
    },
    response: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_PROMPT_RESPONSE_LENGTH,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    createdOn: { type: Date },
    updatedOn: { type: Date },
  },
  { timestamps: true },
);

PromptSchema.index({ userRef: 1, promptId: 1, deleted: 1 }, { unique: true });
PromptSchema.index({ userRef: 1, deleted: 1, order: 1 });

const PromptModel = model('Prompt', PromptSchema);

export default PromptModel;
