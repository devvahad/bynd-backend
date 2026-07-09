import UserModel from './index.js';
import { HashUtility, TokenUtility, ResponseUtility } from '../../utility/index.js';
import { LOGIN_TOKEN_LIFE, DUMMY_HASH } from '../../constants.js';
import { getTokenVersion, setTokenVersion } from '../../services/tokenVersion.js';
import UserDetailsModel from './details.js';

const UserLoginModel = async ({ email, password, deviceToken, deviceType, fcmToken = '', device = '' }) => {
  if (!email || !password) {
    throw ResponseUtility.MISSING_PROPS({
      message: `Missing property ${email ? 'password' : 'email'}.`,
    });
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
    '_id email password verified isVerified blocked deleted isDeleted',
  );

  if (!user || !user.password) {
    await HashUtility.compare({ hash: DUMMY_HASH, text: password });
    throw ResponseUtility.LOGIN_AUTH_FAILED();
  }

  const match = await HashUtility.compare({ hash: user.password, text: password });

  if (!match) {
    throw ResponseUtility.LOGIN_AUTH_FAILED();
  }

  if (!user.verified && !user.isVerified) {
    throw ResponseUtility.GENERIC_ERR({
      message: 'Your account has not been verified. Please verify your phone number.',
    });
  }

  if (user.blocked) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Your account has been blocked by the admin.' });
  }

  if (user.deleted || user.isDeleted) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Your account has been deleted.' });
  }

  const deviceUpdate = {
    ...(deviceToken && { deviceToken }),
    ...(deviceType && { deviceType }),
    ...(fcmToken && { fcmToken }),
    ...(device && { device }),
  };

  if (Object.keys(deviceUpdate).length) {
    await UserModel.findByIdAndUpdate(user._id, { $set: deviceUpdate });
  }

  const token = TokenUtility.generateToken({
    _id: user._id,
    id: user._id,
    email: user.email,
    tokenLife: LOGIN_TOKEN_LIFE,
    role: 'user',
  });

  const userDetails = await UserDetailsModel({ userId: user._id });

  return ResponseUtility.SUCCESS({
    data: {
      accessToken: token,
      user: userDetails.data,
    },
  });
};

export default UserLoginModel;