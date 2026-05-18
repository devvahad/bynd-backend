import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AdminSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    isSuperAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true },
);

AdminSchema.index({ email: 1 });

const AdminModel = model('Admin', AdminSchema);

export default AdminModel;