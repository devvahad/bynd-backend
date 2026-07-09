import UserLoginModel from '../../model/user/login.js';
import UserVerifyModel from '../../model/user/verify.js';
import ResendVerificationModel from '../../model/user/resendVerification.js';
import ForgotPasswordModel from '../../model/user/forgotPassword.js';
import { ResetPasswordModel, UpdatePasswordModel } from '../../model/user/password.js';
import UserDetailsModel from '../../model/user/details.js';
import UpdateUserModel from '../../model/user/update.js';
import ContactAdminModel from '../../model/user/contactAdmin.js';
import SocialLoginModel from '../../model/user/socialLogin.js';
import { UserModel } from '../../model/index.js';

export const LoginResolver = (req, res) =>
  UserLoginModel(req.body)
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const VerifyResolver = (req, res) =>
  UserVerifyModel({ email: req.params.email, code: req.params.code })
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const ResendVerificationResolver = (req, res) =>
  ResendVerificationModel(req.body)
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const ForgotPasswordResolver = (req, res) =>
  ForgotPasswordModel(req.body)
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const ResetPasswordResolver = (req, res) =>
  ResetPasswordModel(req.body)
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const UpdatePasswordResolver = (req, res) =>
  UpdatePasswordModel({ userId: req.user._id, ...req.body })
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const UserDetailsResolver = (req, res) =>
  UserDetailsModel({ userId: req.user._id })
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const UpdateUserResolver = (req, res) =>
  UpdateUserModel({ userId: req.user._id, ...req.body })
    .then((d) => res.json(d))
    .catch((e) => res.json(e));

export const ContactAdminResolver = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).select('name firstName email');
    const name = user?.name || user?.firstName || 'User';
    const email = user?.email || req.user.email || '';

    ContactAdminModel({
      userId,
      email,
      name,
      ...req.body,
    })
      .then((d) => res.json(d))
      .catch((e) => res.json(e));
  } catch (err) {
    return res.json({ code: 500, message: err.message });
  }
};

export const SocialLoginResolver = (req, res) =>
  SocialLoginModel(req.body)
    .then((d) => res.json(d))
    .catch((e) => res.json(e));