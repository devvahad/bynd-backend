import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({ userId, firstName }) => {
  try {

    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    if (typeof firstName !== 'string') {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: 'First name is required.',
      });
    }

    const normalizedFirstName = firstName.trim().replace(/\s+/g, ' ');

    if (
      normalizedFirstName.length < 2 ||
      normalizedFirstName.length > 40
    ) {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: 'First name must be between 2 and 40 characters.',
      });
    }

    const user = await UserModel.findOneAndUpdate(
      {
        _id: userId,
        blocked: false,
        deleted: false,
      },
      {
        $set: {
          firstName: normalizedFirstName,
          updatedOn: new Date(),
        },
      },
      {
        new: true,
        projection: {
          firstName: 1,
        },
      }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({
        code: 404,
        message: 'User not found.',
      });
    }

    return ResponseUtility.SUCCESS({
      data: {
        firstName: user.firstName,
      },
      message: 'Name updated successfully.',
    });
  } catch (error) {
    throw (
      error?.code
        ? error
        : ResponseUtility.GENERIC_ERR({
            message: error.message,
            error,
          })
    );
  }
};