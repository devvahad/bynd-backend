import * as UserModel from '../model/user/index_exports.js';
import { ModelResolver } from './resolvers/index.js';

export default {
  signup: (req, res) => ModelResolver(req, res, UserModel.UsersSignupService),
  verifyOTP: (req, res) => ModelResolver(req, res, UserModel.UsersVerifyOTPService),
  resendOTP: (req, res) => ModelResolver(req, res, UserModel.UsersResendOTPService),
  basics: (req, res) => ModelResolver(req, res, UserModel.UsersBasicsService),
  height: (req, res) => ModelResolver(req, res, UserModel.UsersHeightService),
  gender: (req, res) => ModelResolver(req, res, UserModel.UsersGenderService),
  datePreferences: (req, res) => ModelResolver(req, res, UserModel.UsersDatePreferencesService),
  religionPoliticalView: (req, res) => ModelResolver(req, res, UserModel.UsersReligionPoliticalViewService),
  drinkSmoke: (req, res) => ModelResolver(req, res, UserModel.UsersDrinkSmokeService),
  uploadPhotos: (req, res) => ModelResolver(req, res, UserModel.UsersUploadPhotosService),
  login: (req, res) => ModelResolver(req, res, UserModel.UsersLoginService),
  socialLogin: (req, res) => ModelResolver(req, res, UserModel.UsersSocialLoginService),
  details: (req, res) => ModelResolver(req, res, UserModel.UsersDetailsService),
  update: (req, res) => ModelResolver(req, res, UserModel.UsersUpdateService),
  logout: (req, res) => {
    const payload = { id: req.user._id || req.user.id, authorization: req.headers.authorization };
    UserModel.UsersLogoutService(payload)
      .then((data) => res.status(data.httpStatus ?? 200).json(data))
      .catch((err) => res.status(err.httpStatus ?? 500).json(err));
  },
  deleteAccount: (req, res) => ModelResolver(req, res, UserModel.UsersDeleteService),
  removeUser: (req, res) => ModelResolver(req, res, UserModel.UsersRemoveService),
  report: (req, res) => ModelResolver(req, res, UserModel.UsersReportService),
  updateEmail: (req, res) => ModelResolver(req, res, UserModel.UsersUpdateEmailService),
  notificationPreferences: (req, res) => ModelResolver(req, res, UserModel.UsersNotificationPreferencesService),
  password: (req, res) => {
    const { query: { id, tok } } = req;
    UserModel.UsersPasswordService({ id, tok })
      .then((success) => {
        res.set('Content-Type', 'text/html');
        res.send(success.data);
      })
      .catch(err => res.send(err));
  },
  forgotPassword: (req, res) => {
    const { body: { id, passToken, password } } = req;
    UserModel.UsersForgotPasswordService({ id, passToken, password })
      .then((success) => {
        res.set('Content-Type', 'text/html');
        res.send(success.data);
      })
      .catch(err => res.send(err));
  },
  contactAdmin: (req, res) => ModelResolver(req, res, UserModel.UsersContactAdminService),
};