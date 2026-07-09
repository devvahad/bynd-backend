import { logger } from '../../services/logger.js';
import UserModel from './index.js';
import {
  ResponseUtility,
  RandomCodeUtility,
  TimeConversionUtility,
} from '../../utility/index.js';
import { TemplateMailServices } from '../../services/index.js';

export default async ({ email }) => {
  try {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      throw ResponseUtility.MISSING_PROPS();
    }

    const user = await UserModel.findOne({ email: normalizedEmail, isDeleted: false });
    if (!user) {
      throw ResponseUtility.NO_USER();
    }

    if (user.isVerified) {
      throw ResponseUtility.EMAIL_ALREADY_VERIFIED();
    }

    const verificationCode = RandomCodeUtility(6);
    const verificationCodeExpiry = new Date(
      Date.now() + TimeConversionUtility.hoursToMillis(24),
    );
    const displayName = user.name || user.firstName || 'User';

    try {
      await TemplateMailServices.VerificationToken({
        to: normalizedEmail,
        name: displayName,
        code: verificationCode,
      });
    } catch {
      throw ResponseUtility.GENERIC_ERR({ message: 'Unable to send verification email, please try again.' });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id, isDeleted: false, isVerified: false },
      {
        $set: {
          verificationCode,
          verificationCodeExpiry,
          verificationTries: 0,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw ResponseUtility.NO_USER();
    }

    return ResponseUtility.SUCCESS({ message: 'Verification email resent successfully.' });
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logger.error('ResendVerificationService:', err);
    throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong. Please try again.' });
  }
};