import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, sparse: true },
    password: { type: String },
    profilePicture: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    isVerified: { type: Boolean, default: false },
    verificationCode: { type: Number },
    verificationCodeExpiry: { type: Number },
    verificationTries: { type: Number, default: 0 },

    passwordResetCode: { type: Number },
    passwordResetExpiry: { type: Number },

    googleId: { type: String, sparse: true },
    appleId: { type: String, sparse: true },

    deviceToken: { type: String },
    deviceType: { type: String, enum: ['ios', 'android'] },

    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ appleId: 1 });

const UserModel = model('User', UserSchema);

export default UserModel;