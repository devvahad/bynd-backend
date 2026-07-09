import { logger } from '../../services/logger.js';
import UserModel from './index.js';
import { TokenUtility, ResponseUtility } from '../../utility/index.js';
import {
  GoogleVerificationService,
  AppleVerificationService,
} from '../../services/index.js';
import UserDetailsModel from './details.js';
import {
  SUCCESS_CODE,
  LOGIN_TOKEN_LIFE,
  DUPLICATE_KEY_ERROR_CODE,
  USER_ROLES,
  SUPPORTED_SOCIAL_PROVIDERS,
} from '../../constants.js';

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const verifyProvider = async (provider, accessToken) => {
  if (provider === 'google') {
    const result = await GoogleVerificationService({ accessToken });
    return result?.data;
  }
  const result = await AppleVerificationService({ accessToken });
  return result?.data?.payload ?? result?.data;
};

const SocialLoginModel = async ({
  accessToken,
  provider,
  deviceToken,
  deviceType,
  fcmToken = '',
  device = '',
}) => {
  try {
    if (!accessToken || !provider) {
      throw ResponseUtility.MISSING_PROPS();
    }

    if (!SUPPORTED_SOCIAL_PROVIDERS.includes(provider)) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Unsupported provider. Use google or apple.' });
    }

    const sanitizedDeviceToken = sanitizeString(deviceToken);
    const sanitizedDeviceType = sanitizeString(deviceType);
    const sanitizedFcmToken = sanitizeString(fcmToken);
    const sanitizedDevice = sanitizeString(device);

    let providerData;
    try {
      providerData = await verifyProvider(provider, accessToken);
    } catch (err) {
      logger.error('SocialLoginService: provider verification failed', err);
      throw ResponseUtility.GENERIC_ERR({ message: 'Invalid or expired access token.' });
    }

    const providerId = providerData?.sub;
    if (!providerId) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Invalid or expired access token.' });
    }

    const email = providerData.email ? providerData.email.trim().toLowerCase() : undefined;
    const name = providerData.name?.trim() || email?.split('@')[0] || 'User';

    const providerQuery = provider === 'google' ? { googleId: providerId } : { appleId: providerId };
    const lookupQuery = { $or: [providerQuery, ...(email ? [{ email }] : [])] };

    let isNew = false;
    let user = await UserModel.findOne(lookupQuery);

    if (user) {
      if (user.blocked) {
        throw ResponseUtility.GENERIC_ERR({ message: 'Your account has been blocked by the admin.' });
      }
      if (user.deleted || user.isDeleted) {
        throw ResponseUtility.GENERIC_ERR({ message: 'Your account has been deleted.' });
      }

      const deviceUpdate = {};
      if (sanitizedDeviceToken) deviceUpdate.deviceToken = sanitizedDeviceToken;
      if (sanitizedDeviceType) deviceUpdate.deviceType = sanitizedDeviceType;
      if (sanitizedFcmToken) deviceUpdate.fcmToken = sanitizedFcmToken;
      if (sanitizedDevice) deviceUpdate.device = sanitizedDevice;

      if (Object.keys(deviceUpdate).length) {
        await UserModel.findByIdAndUpdate(user._id, deviceUpdate).catch((err) => {
          logger.error('SocialLoginService: device update failed', err);
        });
      }
    } else {
      isNew = true;
      try {
        user = await UserModel.create({
          name,
          email,
          verified: true,
          isVerified: true,
          ...providerQuery,
          deviceToken: sanitizedDeviceToken,
          deviceType: sanitizedDeviceType,
          fcmToken: sanitizedFcmToken,
          device: sanitizedDevice,
        });
      } catch (err) {
        if (err?.code !== DUPLICATE_KEY_ERROR_CODE) {
          throw err;
        }
        user = await UserModel.findOne(lookupQuery);
        if (!user) {
          throw err;
        }
        isNew = false;
      }
    }

    const token = TokenUtility.generateToken({
      _id: user._id,
      id: user._id,
      email: user.email,
      tokenLife: LOGIN_TOKEN_LIFE,
      role: USER_ROLES.USER,
    });

    const userDetails = await UserDetailsModel({ userId: user._id });
    if (userDetails.code !== SUCCESS_CODE) {
      throw ResponseUtility.GENERIC_ERR({ message: userDetails.message });
    }

    return ResponseUtility.SUCCESS({
      data: {
        accessToken: token,
        isNew,
        user: userDetails.data,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      logger.error('SocialLoginService:', err);
      throw ResponseUtility.GENERIC_ERR({ message: 'Something went wrong, please try again.' });
    }
    throw err;
  }
};

export default SocialLoginModel;