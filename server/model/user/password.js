import UserModel from './index.js';
import { HashUtility, ResponseUtility } from '../../utility/index.js';

export const ResetPasswordModel = async ({ email, code, newPassword }) => {
  if (!email || !code || !newPassword) {
    throw ResponseUtility.MISSING_PROPS();
  }

  const user = await UserModel.findOne({ email: email.toLowerCase(), deleted: false }).select(
    '_id passwordResetCode passwordResetExpiry',
  );

  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  if (Date.now() > user.passwordResetExpiry) {
    throw ResponseUtility.TOKEN_EXPIRED();
  }

  const codeMatch = await HashUtility.compare({ hash: user.passwordResetCode, text: String(code) });
  if (!codeMatch) {
    throw ResponseUtility.TOKEN_NOT_VERIFIED();
  }

  const password = await HashUtility.generate({ text: newPassword });

  await UserModel.findByIdAndUpdate(user._id, {
    $set: { password },
    $unset: { passwordResetCode: '', passwordResetExpiry: '' },
  });

  return ResponseUtility.SUCCESS({ message: 'Password reset successfully.' });
};

export const UpdatePasswordModel = async ({ userId, oldPassword, newPassword }) => {
  if (!userId || !oldPassword || !newPassword) {
    throw ResponseUtility.MISSING_PROPS();
  }

  const user = await UserModel.findById(userId).select('_id password');

  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const match = await HashUtility.compare({ hash: user.password, text: oldPassword });

  if (!match) {
    throw ResponseUtility.LOGIN_AUTH_FAILED({ message: 'Current password is incorrect.' });
  }

  const password = await HashUtility.generate({ text: newPassword });

  await UserModel.findByIdAndUpdate(userId, { $set: { password }, passwordChangedAt: new Date()});

  return ResponseUtility.SUCCESS({ message: 'Password updated successfully.' });
};