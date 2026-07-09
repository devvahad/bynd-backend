import { logger } from '../../services/logger.js';
import UserModel from './index.js';
import {
  ResponseUtility,
  RandomCodeUtility,
  PropsValidationUtility,
  HashUtility,
} from '../../utility/index.js';
import {
  COOLDOWN_SECONDS,
  MAX_RETRIES,
  RETRY_WINDOW_MINUTES,
  SUCCESS_CODE,
  OTP_VALIDITY_MINUTES,
  OTP_LENGTH,
  OTP_HASH_ITERATIONS,
} from '../../constants.js';
import { AwsSNSService } from '../../services/index.js';

export default async ({ userId }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });
    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const user = await UserModel.findOne({ _id: userId, deleted: false });
    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
    }

    if (user.verified) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Phone number already verified.' });
    }

    if (!user.phoneNumber || !user.phoneCode) {
      throw ResponseUtility.GENERIC_ERR({ message: 'No phone number on file for this user.' });
    }

    const currentTime = new Date();

    if (user.phoneTokenDate) {
      const secondsSinceLast = (currentTime - user.phoneTokenDate) / 1000;
      if (secondsSinceLast < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - secondsSinceLast);
        throw ResponseUtility.GENERIC_ERR({
          message: `Please wait ${remaining} seconds before requesting a new OTP.`,
          data: { remainingTime: remaining },
        });
      }
    }

    const retryWindowStart = new Date(currentTime.getTime() - RETRY_WINDOW_MINUTES * 60 * 1000);
    const withinRetryWindow = user.phoneTokenDate && user.phoneTokenDate >= retryWindowStart;
    const currentRetries = withinRetryWindow ? user.phoneTokenRetries || 0 : 0;

    if (currentRetries >= MAX_RETRIES) {
      throw ResponseUtility.GENERIC_ERR({
        message: `Maximum retry limit reached. Please try again after ${RETRY_WINDOW_MINUTES} minutes.`,
      });
    }

    const newOTP = RandomCodeUtility(OTP_LENGTH).toString();
    const hashedOtp = await HashUtility.generate({ text: newOTP, iterations: OTP_HASH_ITERATIONS });
    const otpExpiry = new Date(currentTime.getTime() + OTP_VALIDITY_MINUTES * 60 * 1000);
    const fullPhoneNumber = `${user.phoneCode}${user.phoneNumber}`;

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, verified: false },
      {
        $set: {
          phoneToken: hashedOtp,
          phoneTokenDate: currentTime,
          phoneTokenExpiry: otpExpiry,
          phoneTokenRetries: currentRetries + 1,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
    }

    let snsResult;
    try {
      snsResult = await AwsSNSService.sendOTP({ phoneNumber: fullPhoneNumber, otp: newOTP });
    } catch {
      snsResult = undefined;
    }

    if (!snsResult?.success) {
      await UserModel.findOneAndUpdate(
        {
          _id: userId,
          phoneToken: hashedOtp,
        },
        {
          $unset: {
            phoneToken: '',
            phoneTokenDate: '',
            phoneTokenExpiry: '',
          },
        },
      );

      throw ResponseUtility.GENERIC_ERR({
        message: 'Unable to send code, try again.',
      });
    }

    return ResponseUtility.SUCCESS({
      data: {
        message: 'OTP resent successfully.',
        retriesRemaining: MAX_RETRIES - updatedUser.phoneTokenRetries,
        expiresIn: OTP_VALIDITY_MINUTES * 60,
      },
    });
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logger.error('ResendOtpService:', err);
    throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong. Please try again.' });
  }
};