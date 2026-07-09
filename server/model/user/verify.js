import { logger } from '../../services/logger.js';
import UserModel from './index.js';
import { ResponseUtility } from '../../utility/index.js';
import { MAX_VERIFICATION_TRIES } from '../../constants.js';

const UserVerifyModel = async ({ email, code }) => {
  try {
    if (!email || !code) {
      throw ResponseUtility.MISSING_PROPS();
    }

    const normalizedEmail = email.trim().toLowerCase();
    const numericCode = Number(code);

    const user = await UserModel.findOne({ email: normalizedEmail, isDeleted: false });
    if (!user) {
      throw ResponseUtility.NO_USER();
    }

    if (user.isVerified) {
      throw ResponseUtility.EMAIL_ALREADY_VERIFIED();
    }

    if (user.verificationTries >= MAX_VERIFICATION_TRIES) {
      throw ResponseUtility.GENERIC_ERR({
        message: 'Too many incorrect attempts. Please request a new verification code.',
      });
    }

    if (!user.verificationCodeExpiry || Date.now() > user.verificationCodeExpiry) {
      throw ResponseUtility.TOKEN_EXPIRED();
    }

    if (Number.isNaN(numericCode) || user.verificationCode !== numericCode) {
      await UserModel.findByIdAndUpdate(user._id, { $inc: { verificationTries: 1 } });
      throw ResponseUtility.INVALID_VERIFICATION_CODE();
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: user._id,
        isVerified: false,
        verificationCode: numericCode,
      },
      {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
        verificationTries: 0,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw ResponseUtility.INVALID_VERIFICATION_CODE();
    }

    return ResponseUtility.SUCCESS({ message: 'Email verified successfully.' });
  } catch (err) {
    if (err instanceof Error) {
      logger.error('UserVerifyModel:', err);
      throw ResponseUtility.GENERIC_ERR({ message: 'Unable to verify email, try again.' });
    }
    throw err;
  }
};

export default UserVerifyModel;