import mongoose from 'mongoose';
import { HashUtility } from '../../utility/index.js';

const { Schema, model } = mongoose;

const PhotoSchema = new Schema(
  {
    url: { type: String },
    order: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    firstName: { type: String, trim: true, minlength: 2, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },

    phoneCode: { type: String },
    phoneNumber: { type: String, minlength: 7, maxlength: 13 },
    phoneToken: { type: String },
    phoneTokenDate: { type: Date },
    phoneTokenExpiry: { type: Date },
    phoneTokenRetries: { type: Number, default: 0 },

    verified: { type: Boolean, default: false },
    // isVerified: { type: Boolean, default: false },
    verificationCode: { type: Number },
    verificationCodeExpiry: { type: Number },
    verificationTries: { type: Number, default: 0 },

    password: { type: String },
    passwordResetCode: { type: String },
    passwordResetExpiry: { type: Number },
    changePassToken: { type: String },
    changePassTokenDate: { type: Date },
    passwordChangedAt: { type: Date },

    dob: { type: Date },
    age: { type: Number },
    about: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    nationality: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    gender: { type: String, enum: ['man', 'woman', 'non-binary'] },
    subGender: { type: String, trim: true },
    subGenderSkipped: { type: Boolean, default: false },
    hideGender: { type: Boolean, default: false },
    sexuality: { type: [String], default: [] },
    pronouns: { type: [String], default: [] },

    heightLabel: { type: String },
    heightCm: { type: Number },
    heightSkipped: { type: Boolean, default: false },

    datePreferences: { type: [{ type: String, enum: ['man', 'woman', 'non-binary'] }], default: [] },
    ethnicityPreferences: { type: [String], default: [] },
    skipDatingPreference: { type: Boolean, default: false },
    skipEthnicityPreference: { type: Boolean, default: false },

    lookingFor: {
      type: String,
      enum: [
        'A long-term relationship',
        'Short-term, open to long',
        'Casual dating',
        'Marriage',
        'Still figuring it out',
      ],
    },
    skipLookingFor: { type: Boolean, default: false },

    drinkingHabits: {
      type: String,
      enum: ['Yes', 'Sometimes', 'Rarely', 'Never', 'Sober'],
    },
    skipDrinkingHabits: { type: Boolean, default: false },

    smokingHabits: {
      type: String,
      enum: ['Yes', 'Occasionally', 'Never', 'Trying to quit'],
    },
    skipSmokingHabits: { type: Boolean, default: false },

    cannabis: { type: String },
    exercise: { type: String },
    dietaryPreferences: { type: [String], default: [] },
    foodAllergies: { type: [String], default: [] },

    religion: { type: String, trim: true },
    religionSkipped: { type: Boolean, default: false },

    politicalView: { type: String, trim: true },
    politicalViewSkipped: { type: Boolean, default: false },

    zodiacSign: { type: String },
    userEthnicities: { type: [String], default: [] },

    children: { type: String },
    familyPlans: { type: String },
    pets: { type: [String], default: [] },
    loveLanguages: { type: [String], default: [] },
    activeStatus: { type: String },
    relationshipType: { type: String },
    datingExpectations: { type: String },

    interests: { type: [{}], default: [] },

    work: {
      jobTitle: { type: String },
      industry: { type: String },
    },
    school: { type: String },
    education: { type: String },
    languages: { type: [String], default: [] },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    city: { type: String },
    state: { type: String },
    country: { type: String },

    firstDatePreferences: { type: [String], default: [] },
    firstDateDistance: { type: Number },
    meetingAvailability: { type: [{}], default: [] },

    photos: { type: [PhotoSchema], default: [] },
    photosSkipped: { type: Boolean, default: false },

    profileProgress: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },

    googleId: { type: String, sparse: true },
    appleId: { type: String, sparse: true },
    socialId: { type: String },
    socialToken: { type: String },
    socialIdentifier: { type: String },

    deviceToken: { type: String },
    deviceType: { type: String, enum: ['ios', 'android'] },
    fcmToken: { type: String },
    device: { type: String },

    deleted: { type: Boolean, default: false },
    // isDeleted: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },

    createdOn: { type: Date },
    updatedOn: { type: Date },
    deletedOn: { type: Date },
    lastUpdatedAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ appleId: 1 });
UserSchema.index({ phoneNumber: 1, phoneCode: 1 });
UserSchema.index({ deleted: 1, verified: 1 });
UserSchema.index({ location: '2dsphere' });

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await HashUtility.generate({ text: this.password });
    next();
  } catch (error) {
    next(error);
  }
});

const UserModel = model('User', UserSchema);

export default UserModel;