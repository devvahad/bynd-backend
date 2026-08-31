import AdminModel from './index.js';
import { ResponseUtility, RandomCodeUtility, TimeConversionUtility, HashUtility } from '../../utility/index.js';
import { TemplateMailServices } from '../../services/index.js';
import { OTP_HASH_ITERATIONS } from '../../constants.js';

const RESET_CODE_LENGTH = 6;
const RESET_CODE_EXPIRY_HOURS = 1;

export default async ({ email }) => {
  if (!email) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property email.' });
  }

  const admin = await AdminModel.findOne({ email: email.toLowerCase(), isDeleted: false }).select('_id name').lean();

  if (!admin) {
    return ResponseUtility.SUCCESS({ message: 'If that email is registered, a reset code has been sent.' });
  }

  const code = RandomCodeUtility(RESET_CODE_LENGTH);
  const hashedCode = await HashUtility.generate({ text: String(code), iterations: OTP_HASH_ITERATIONS });
  const expiry = Date.now() + TimeConversionUtility.hoursToMillis(RESET_CODE_EXPIRY_HOURS);

  await AdminModel.findByIdAndUpdate(admin._id, {
    passwordResetCode: hashedCode,
    passwordResetExpiry: expiry,
  });

  await TemplateMailServices.ChangePasswordToken({
    to: email,
    name: admin.name || 'Admin',
    code,
  });

  return ResponseUtility.SUCCESS({ message: 'Password reset code sent to your email.' });
};
