import { Router } from 'express';
import UserControllers from '../controllers/user.js';

import {
  LoginResolver,
  VerifyResolver,
  ResendVerificationResolver,
  ForgotPasswordResolver,
  ResetPasswordResolver,
  UpdatePasswordResolver,
  UserDetailsResolver,
  UpdateUserResolver,
  ContactAdminResolver,
  SocialLoginResolver,
  PictureResolver,
} from '../controllers/resolvers/index.js';

import { authenticate } from '../controllers/authentication.js';
import { MultipartService } from '../services/index.js';
import { authLimiter, otpLimiter } from '../utility/limiter.js';

import {
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
  UpdateUserSchema,
  SocialLoginSchema,
  PhoneSignupSchema,
  VerifyOTPSchema,
  ResendOTPSchema,
  BasicsSchema,
  HeightSchema,
  GenderSchema,
  DatePreferencesSchema,
  ReligionPoliticalSchema,
  DrinkSmokeSchema,
} from '../schemas/index.js';

const router = Router();

router.post('/signup', authLimiter, PhoneSignupSchema, UserControllers.signup);
router.post('/verify-otp', otpLimiter, VerifyOTPSchema, UserControllers.verifyOTP);
router.post('/resend-otp', otpLimiter, ResendOTPSchema, UserControllers.resendOTP);

router.post('/login', authLimiter, LoginSchema, LoginResolver);
router.post('/social-login', authLimiter, SocialLoginSchema, SocialLoginResolver);
router.get('/verify/:email/:code', authLimiter, VerifyResolver);
router.post('/resend-verification', authLimiter, ResendVerificationResolver);
router.post('/forgot-password', authLimiter, ForgotPasswordSchema, ForgotPasswordResolver);
router.post('/reset-password', authLimiter, ResetPasswordSchema, ResetPasswordResolver);

router.use(authenticate);

router.post('/basics', BasicsSchema, UserControllers.basics);
router.post('/height', HeightSchema, UserControllers.height);
router.post('/gender', GenderSchema, UserControllers.gender);
router.post('/date-preferences', DatePreferencesSchema, UserControllers.datePreferences);
router.post('/religion-political', ReligionPoliticalSchema, UserControllers.religionPoliticalView);
router.post('/drink-smoke', DrinkSmokeSchema, UserControllers.drinkSmoke);
router.post('/photos', MultipartService, UserControllers.uploadPhotos);

router.get('/me', UserDetailsResolver);
router.put('/me', UpdateUserSchema, UpdateUserResolver);
router.put('/password', UpdatePasswordSchema, UpdatePasswordResolver);
router.post('/contact', ContactAdminResolver);
router.post('/picture', MultipartService, PictureResolver);

export default router;