import AdminModel from './index.js';
import { HashUtility, ResponseUtility } from '../../utility/index.js';

export default async ({ email, code, newPassword }) => {
  if (!email || !code || !newPassword) {
    throw ResponseUtility.MISSING_PROPS({ message: 'email, code, and newPassword are required.' });
  }

  const admin = await AdminModel.findOne({ email: email.toLowerCase(), isDeleted: false }).select(
    '_id passwordResetCode passwordResetExpiry',
  );

  if (!admin) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Admin not found.' });
  }

  if (!admin.passwordResetCode || Date.now() > admin.passwordResetExpiry) {
    throw ResponseUtility.TOKEN_EXPIRED();
  }

  const codeMatch = await HashUtility.compare({ hash: admin.passwordResetCode, text: String(code) });
  if (!codeMatch) {
    throw ResponseUtility.TOKEN_NOT_VERIFIED();
  }

  const password = await HashUtility.generate({ text: newPassword });

  await AdminModel.findByIdAndUpdate(admin._id, {
    $set: { password },
    $unset: { passwordResetCode: '', passwordResetExpiry: '' },
  });

  return ResponseUtility.SUCCESS({ message: 'Password has been reset successfully.' });
};
