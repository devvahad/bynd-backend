import { logger } from '../../services/logger.js';
import UserModel from './index.js';
import {
  ResponseUtility,
  RandomCodeUtility,
  PropsValidationUtility,
  HashUtility,
} from '../../utility/index.js';
import { AwsSNSService } from '../../services/index.js';
import { SUCCESS_CODE, OTP_VALIDITY_MINUTES, OTP_LENGTH, OTP_HASH_ITERATIONS, DUPLICATE_KEY_ERROR_CODE } from '../../constants.js';

export default async ({ phoneNumber, phoneCode, device = '' }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['phoneNumber', 'phoneCode'],
      sourceDocument: { phoneNumber, phoneCode },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const normalizedPhoneNumber = phoneNumber.trim();
    const normalizedPhoneCode = phoneCode.trim();
    const normalizedDevice = typeof device === 'string' ? device.trim() : '';

    const phoneExists = await UserModel.exists({
      phoneNumber: normalizedPhoneNumber,
      phoneCode: normalizedPhoneCode,
      deleted: false,
    });

    if (phoneExists) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Phone number is already registered.' });
    }

    const otp = RandomCodeUtility(OTP_LENGTH).toString();
    const hashedOtp = await HashUtility.generate({ text: otp, iterations: OTP_HASH_ITERATIONS });

    const now = new Date();
    const otpExpiry = new Date(now.getTime() + OTP_VALIDITY_MINUTES * 60 * 1000);

    let userObject;
    try {
      userObject = await UserModel.create({
        device: normalizedDevice,
        phoneNumber: normalizedPhoneNumber,
        phoneCode: normalizedPhoneCode,
        phoneToken: hashedOtp,
        phoneTokenDate: now,
        phoneTokenExpiry: otpExpiry,
        phoneTokenRetries: 0,
        verified: false,
        createdOn: now,
      });
    } catch (err) {
      if (err?.code === DUPLICATE_KEY_ERROR_CODE) {
        throw ResponseUtility.GENERIC_ERR({ message: 'Phone number is already registered.' });
      }
      throw err;
    }

    const fullPhoneNumber = `${normalizedPhoneCode}${normalizedPhoneNumber}`;

    let snsResult;
    try {
      snsResult = await AwsSNSService.sendOTP({ phoneNumber: fullPhoneNumber, otp });
    } catch {
      snsResult = { success: false };
    }

    if (!snsResult?.success) {
      await UserModel.deleteOne({ _id: userObject._id }).catch(() => {});
      throw ResponseUtility.GENERIC_ERR({ message: 'Unable to send code, try again.' });
    }

    return ResponseUtility.SUCCESS({
      data: {
        userId: userObject._id,
        message: 'OTP sent successfully to your phone number.',
        expiresIn: OTP_VALIDITY_MINUTES * 60,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      logger.error('SignupService:', err);
      throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong, please try again.' });
    }
    throw err;
  }
};