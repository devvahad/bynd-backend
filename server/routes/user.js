import { Router } from 'express';
import {
  SignupController,
  LoginController,
  VerifyEmailController,
  ResendVerificationController,
  ForgotPasswordController,
  ResetPasswordController,
  UpdatePasswordController,
  UserDetailsController,
  UpdateUserController,
  ContactAdminController,
} from '../controllers/user.js';
import { SocialLoginController } from '../controllers/socialLogin.js';
import { authenticate } from '../controllers/authentication.js';
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
  UpdateUserSchema,
  SocialLoginSchema,
} from '../schemas/index.js';

const router = Router();

router.post('/signup', SignupSchema, SignupController);
router.post('/login', LoginSchema, LoginController);
router.post('/social-login', SocialLoginSchema, SocialLoginController);
router.get('/verify/:email/:code', VerifyEmailController);
router.post('/resend-verification', ResendVerificationController);
router.post('/forgot-password', ForgotPasswordSchema, ForgotPasswordController);
router.post('/reset-password', ResetPasswordSchema, ResetPasswordController);

router.use(authenticate);
router.get('/me', UserDetailsController);
router.put('/me', UpdateUserSchema, UpdateUserController);
router.put('/password', UpdatePasswordSchema, UpdatePasswordController);
router.post('/contact', ContactAdminController);

export default router;