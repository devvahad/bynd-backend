import UserModel from './index.js';
import {
  ResponseUtility,
  PropsValidationUtility,
  TokenUtility,
  HashUtility,
} from '../../utility/index.js';
import { SUCCESS_CODE, MAX_OTP_RETRIES, tokenLife } from '../../constants.js';
import UserDetailsModel from './details.js';

const verifyOtp = async ({ userId, otp, device = '', fcmToken = '' }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId', 'otp'],
    sourceDocument: { userId, otp },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: userId, deleted: false }).lean();

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  if (user.verified) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Phone number already verified.' });
  }

  if (!user.phoneToken || !user.phoneTokenExpiry) {
    throw ResponseUtility.GENERIC_ERR({ message: 'No OTP request found. Please request a new one.' });
  }

  if (new Date() > new Date(user.phoneTokenExpiry)) {
    throw ResponseUtility.GENERIC_ERR({ message: 'OTP has expired. Please request a new one.' });
  }

  if ((user.phoneTokenRetries ?? 0) >= MAX_OTP_RETRIES) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Maximum OTP attempts exceeded. Please request a new one.' });
  }

  const isOtpValid = await HashUtility.compare({ hash: user.phoneToken, text: String(otp) });

  if (!isOtpValid) {
    await UserModel.updateOne(
      { _id: userId },
      { $inc: { phoneTokenRetries: 1 } },
    );

    throw ResponseUtility.GENERIC_ERR({ message: 'Invalid OTP. Please try again.' });
  }

  const now = new Date();

  const updateResult = await UserModel.updateOne(
    { _id: userId, verified: false },
    {
      $set: {
        verified: true,
        phoneToken: null,
        phoneTokenDate: null,
        phoneTokenExpiry: null,
        phoneTokenRetries: 0,
        updatedOn: now,
        ...(device && { device }),
        ...(fcmToken && { fcmToken }),
      },
    },
  );

  if (!updateResult.modifiedCount) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Unable to verify phone number. Please try again.' });
  }

  const token = TokenUtility.generateToken({
    _id: user._id,
    id: user._id,
    phoneNumber: user.phoneNumber,
    tokenLife,
    role: 'user',
  });

  const userDetails = await UserDetailsModel({ userId: user._id });

  if (userDetails.code !== SUCCESS_CODE) {
    throw ResponseUtility.GENERIC_ERR({ message: userDetails.message });
  }

  return ResponseUtility.SUCCESS({
    data: {
      accessToken: token,
      user: userDetails.data,
      message: 'Phone number verified successfully.',
    },
  });
};

export default async ({ userId, otp, device = '', fcmToken = '' }) => {
  try {
    return await verifyOtp({ userId, otp, device, fcmToken });
  } catch (error) {
    if (error?.code && error?.message) {
      throw error;
    }

    throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong while verifying OTP.' });
  }
};