import { logger } from '../../services/logger.js';
import UserModel from './index.js';
import {
  ResponseUtility,
  RandomCodeUtility,
  PropsValidationUtility,
  TokenUtility,
  HashUtility,
} from '../../utility/index.js';
import {
  HOST,
  APP_NAME,
  SUCCESS_CODE,
  DUPLICATE_KEY_ERROR_CODE,
  OTP_HASH_ITERATIONS,
  VERIFICATION_TOKEN_EXPIRY_HOURS,
  tokenLife,
} from '../../constants.js';
import { TemplateMailServices } from '../../services/index.js';
import UserDetailsModel from './details.js';

export default async ({
  name,
  email,
  password,
  device = '',
  fcmToken = '',
}) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['name', 'email', 'password'],
      sourceDocument: { name, email, password },
    });
    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const emailExists = await UserModel.findOne({ email: normalizedEmail });
    if (emailExists) {
      throw ResponseUtility.GENERIC_ERR({ message: `Email ${normalizedEmail} is already registered.` });
    }

    const hashedPassword = await HashUtility.generate({ text: password, iterations: OTP_HASH_ITERATIONS });
    const emailToken = RandomCodeUtility(10);

    const userObject = new UserModel({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      device,
      fcmToken,
      verificationCode: emailToken,
      verificationCodeExpiry: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      createdOn: new Date(),
    });

    try {
      await userObject.save();
    } catch (saveErr) {
      if (saveErr?.code === DUPLICATE_KEY_ERROR_CODE) {
        throw ResponseUtility.GENERIC_ERR({ message: `Email ${normalizedEmail} is already registered.` });
      }
      throw saveErr;
    }

    try {
      await TemplateMailServices.VerificationToken({
        to: normalizedEmail,
        name: normalizedName,
        code: emailToken,
      });
    } catch (mailErr) {
      logger.error('SignupService: failed to send verification email', mailErr);
    }

    const token = TokenUtility.generateToken({
      _id: userObject._id,
      id: userObject._id,
      email: normalizedEmail,
      tokenLife,
      role: 'user',
    });

    const user = await UserDetailsModel({ userId: userObject._id });
    if (user.code !== SUCCESS_CODE) {
      throw ResponseUtility.GENERIC_ERR({ message: user.message });
    }

    return ResponseUtility.SUCCESS({
      data: { accessToken: token, user: user.data },
    });
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logger.error('SignupService:', err);
    throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong. Please try again.' });
  }
};