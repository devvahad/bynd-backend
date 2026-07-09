import UserModel from './index.js';
import { ResponseUtility, RandomCodeUtility, TimeConversionUtility, HashUtility } from '../../utility/index.js';
import { TemplateMailServices } from '../../services/index.js';
import { OTP_HASH_ITERATIONS } from '../../constants.js';

const RESET_CODE_LENGTH = 6;
const RESET_CODE_EXPIRY_HOURS = 1;

const ForgotPasswordModel = async ({ email }) => {
  if (!email) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property email.' });
  }

  const user = await UserModel.findOne({
    email: email.toLowerCase(),
    // isDeleted: false,
    deleted: false,
  }).select('_id name firstName').lean();

  if (!user) {
    return ResponseUtility.SUCCESS({
      message: 'If that email is registered, a reset code has been sent.',
    });
  }

  const code = RandomCodeUtility(RESET_CODE_LENGTH);
  const hashedCode = await HashUtility.generate({ text: String(code), iterations: OTP_HASH_ITERATIONS });
  const expiry = Date.now() + TimeConversionUtility.hoursToMillis(RESET_CODE_EXPIRY_HOURS);

  await UserModel.findByIdAndUpdate(user._id, {
    passwordResetCode: hashedCode,
    passwordResetExpiry: expiry,
  });

  const displayName = user.name || user.firstName || 'User';

  await TemplateMailServices.ChangePasswordToken({
    to: email,
    name: displayName,
    code,
  });

  return ResponseUtility.SUCCESS({ message: 'Password reset code sent to your email.' });
};

export default ForgotPasswordModel;