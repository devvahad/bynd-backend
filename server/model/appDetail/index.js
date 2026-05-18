import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AppDetailSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    version: { type: String, trim: true },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    privacyPolicyUrl: { type: String },
    termsUrl: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const AppDetailModel = model('AppDetail', AppDetailSchema);

export default AppDetailModel;