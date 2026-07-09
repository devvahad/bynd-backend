import { logger } from '../../services/logger.js';
import mongoose from 'mongoose';
import UserModel from './index.js';
import { ResponseUtility, SchemaMapperUtility } from '../../utility/index.js';

const EXCLUDED_FIELDS =
  '-password -verificationCode -verificationCodeExpiry -passwordResetCode -passwordResetExpiry';

const UpdateUserModel = async ({ userId, name, phone, deviceToken, deviceType, profilePicture }) => {
  try {
    if (!userId) {
      throw ResponseUtility.MISSING_PROPS();
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw ResponseUtility.NO_USER();
    }

    const updates = await SchemaMapperUtility({
      name,
      phone,
      deviceToken,
      deviceType,
      profilePicture,
    });

    let user;
    if (updates && Object.keys(updates).length) {
      user = await UserModel.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
        context: 'query',
      }).select(EXCLUDED_FIELDS);
    } else {
      user = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
    }

    if (!user) {
      throw ResponseUtility.NO_USER();
    }

    return ResponseUtility.SUCCESS({ data: user });
  } catch (err) {
    if (err instanceof Error) {
      logger.error('UpdateUserModel:', err);
      throw ResponseUtility.GENERIC_ERR({ message: 'Unable to update profile, try again.' });
    }
    throw err;
  }
};

export default UpdateUserModel;