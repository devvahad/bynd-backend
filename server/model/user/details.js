import UserModel from './index.js';
import { ResponseUtility } from '../../utility/index.js';

const EXCLUDED_FIELDS = '-password -verificationCode -verificationCodeExpiry -passwordResetCode -passwordResetExpiry';

const UserDetailsModel = async ({ userId }) => {
  if (!userId) {
    throw ResponseUtility.MISSING_PROPS();
  }

  const user = await UserModel.findOne({ _id: userId, isDeleted: false })
    .select(EXCLUDED_FIELDS)
    .lean();

  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  return ResponseUtility.SUCCESS({ data: user });
};

export default UserDetailsModel;