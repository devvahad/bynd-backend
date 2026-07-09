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
  firstDatePreferences: (req, res) => ModelResolver(req, res, UserModel.UsersFirstDatePreferencesService),
  // verify: (req, res) => {
  // 	const { query: { iphoneNumber, phoneToken } } = req;
  // 	UserModel.UsersVerifyService({ id, emailToken })
  // 		.then((sucess) => {
  // 			res.set('Content-Type', 'text/html');
  // 			res.send(sucess);
  // 		})
  // 		.catch(err => res.send(err));
  // },
  // resendVerification:
  // (req, res) => ModelResolver(req, res, UserModel.UsersResendVerificationService),
  login: (req, res) => ModelResolver(req, res, UserModel.UsersLoginService),
  socialLogin: (req, res) => ModelResolver(req, res, UserModel.UsersSocialLoginService),
  details: (req, res) => ModelResolver(req, res, UserModel.UsersDetailsService),
  update: (req, res) => ModelResolver(req, res, UserModel.UsersUpdateService),
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