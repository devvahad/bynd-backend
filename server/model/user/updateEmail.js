import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async ({ id, email }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['email'],
    sourceDocument: { email },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Please provide a valid email address.' });
  }

  const existingUser = await UserModel.findOne({ email: normalizedEmail, deleted: false, _id: { $ne: id } });
  if (existingUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'This email is already in use.' });
  }

  const user = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    { $set: { email: normalizedEmail, lastUpdatedAt: new Date() } },
    { new: true },
  ).select('email');

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  return ResponseUtility.SUCCESS({ message: 'Email updated successfully.', data: { email: user.email } });
};