import Joi from 'joi';
import validate from './commonSchemaMiddleware.js';

const password = Joi.string().min(8).max(64).required();
const email = Joi.string().email().required();

export const SignupSchema = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email,
    password,
    phone: Joi.string().trim().optional(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const LoginSchema = validate(
  Joi.object({
    email,
    password,
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const ForgotPasswordSchema = validate(
  Joi.object({ email }),
);

export const ResetPasswordSchema = validate(
  Joi.object({
    email,
    code: Joi.number().required(),
    newPassword: password,
  }),
);

export const UpdatePasswordSchema = validate(
  Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: password,
  }),
);

export const UpdateUserSchema = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(80).optional(),
    phone: Joi.string().trim().optional(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const SocialLoginSchema = validate(
  Joi.object({
    accessToken: Joi.string().required(),
    provider: Joi.string().valid('google', 'apple').required(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ios', 'android').optional(),
  }),
);

export const PhoneSignupSchema = validate(
  Joi.object({
    phoneNumber: Joi.string().min(7).max(13).required(),
    phoneCode: Joi.string().required(),
    device: Joi.string().optional(),
  }),
);

export const VerifyOTPSchema = validate(
  Joi.object({
    userId: Joi.string().hex().length(24).required(),
    otp: Joi.string().length(5).required(),
    device: Joi.string().optional(),
    fcmToken: Joi.string().optional(),
  }),
);

export const ResendOTPSchema = validate(
  Joi.object({
    userId: Joi.string().hex().length(24).required(),
  }),
);

export const BasicsSchema = validate(
  Joi.object({
    firstName: Joi.string().trim().min(2).max(40).required(),
    dob: Joi.date().required(),
  }),
);

export const HeightSchema = validate(
  Joi.object({
    heightLabel: Joi.string().optional(),
    heightSkipped: Joi.boolean().optional(),
  }),
);

export const GenderSchema = validate(
  Joi.object({
    gender: Joi.string().valid('man', 'woman', 'non-binary').required(),
    subGender: Joi.string().optional().allow(null, ''),
    subGenderSkipped: Joi.boolean().optional(),
  }),
);

export const DatePreferencesSchema = validate(
  Joi.object({
    datePreferences: Joi.array().items(Joi.string()).optional(),
    ethnicityPreferences: Joi.array().items(Joi.string()).optional(),
    skipDatingPreference: Joi.boolean().optional(),
    skipEthnicityPreference: Joi.boolean().optional(),
  }),
);

export const ReligionPoliticalSchema = validate(
  Joi.object({
    religion: Joi.string().optional().allow(''),
    politicalView: Joi.string().optional().allow(''),
    religionSkipped: Joi.boolean().optional(),
    politicalViewSkipped: Joi.boolean().optional(),
  }),
);

export const DrinkSmokeSchema = validate(
  Joi.object({
    lookingFor: Joi.string().optional().allow(''),
    drinkingHabits: Joi.string().optional().allow(''),
    smokingHabits: Joi.string().optional().allow(''),
    skipLookingFor: Joi.boolean().optional(),
    skipDrinkingHabits: Joi.boolean().optional(),
    skipSmokingHabits: Joi.boolean().optional(),
  }),
);