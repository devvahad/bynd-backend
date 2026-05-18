import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const FaqSchema = new Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

FaqSchema.index({ isDeleted: 1, isActive: 1 });

const FaqModel = model('Faq', FaqSchema);

export default FaqModel;