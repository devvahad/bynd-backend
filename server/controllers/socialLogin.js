import { UserModel } from '../model/index.js';
import {
  TokenUtility,
  ResponseUtility,
} from '../utility/index.js';
import { GoogleVerificationService, AppleVerificationService } from '../services/index.js';

export const SocialLoginController = async (req, res) => {
  try {
    const { accessToken, provider, deviceToken, deviceType } = req.body;

    let providerData;
    if (provider === 'google') {
      const result = await GoogleVerificationService({ accessToken });
      providerData = result.data;
    } else if (provider === 'apple') {
      const result = await AppleVerificationService({ accessToken });
      providerData = result.data?.payload ?? result.data;
    } else {
      return res.json(ResponseUtility.GENERIC_ERR({ message: 'Unsupported provider.' }));
    }

    const email = providerData.email;
    const name = providerData.name ?? providerData.email?.split('@')[0] ?? 'User';
    const providerId = providerData.sub;

    const query = provider === 'google'
      ? { $or: [{ googleId: providerId }, { email }] }
      : { $or: [{ appleId: providerId }, { email }] };

    let user = await UserModel.findOne({ ...query, isDeleted: false });

    if (!user) {
      user = await UserModel.create({
        name,
        email,
        isVerified: true,
        ...(provider === 'google' ? { googleId: providerId } : { appleId: providerId }),
        deviceToken,
        deviceType,
      });
    } else if (deviceToken) {
      await UserModel.findByIdAndUpdate(user._id, { deviceToken, deviceType });
    }

    const token = TokenUtility.generateToken({ _id: user._id, email: user.email, role: 'user' });
    return res.json(ResponseUtility.SUCCESS({ data: { token, isNew: !user.createdAt, user } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};