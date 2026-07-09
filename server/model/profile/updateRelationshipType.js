import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, RELATIONSHIP_TYPES } from '../../constants.js';

export default async ({ userId, relationshipType, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedType = typeof relationshipType === 'string' ? relationshipType.trim() : relationshipType;

    if (!isClearing) {
      if (!normalizedType) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'relationshipType is required unless preferNotToSay is true.',
        });
      }

      if (!RELATIONSHIP_TYPES.includes(normalizedType)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid relationship type. Allowed: ${RELATIONSHIP_TYPES.join(', ')}`,
        });
      }
    }

    const update = {
      relationshipType: isClearing ? null : normalizedType,
      updatedOn: new Date(),
    };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'Relationship type cleared.' : 'Relationship type updated.',
      data: { relationshipType: user.relationshipType },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};