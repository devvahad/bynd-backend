import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, FAMILY_PLANS } from '../../constants.js';

export default async ({ userId, familyPlans, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedPlan = typeof familyPlans === 'string' ? familyPlans.trim() : familyPlans;

    if (!isClearing) {
      if (!normalizedPlan) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'familyPlans is required unless preferNotToSay is true.',
        });
      }

      if (!FAMILY_PLANS.includes(normalizedPlan)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid family plans. Allowed: ${FAMILY_PLANS.join(', ')}`,
        });
      }
    }

    const update = {
      familyPlans: isClearing ? null : normalizedPlan,
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
      message: isClearing ? 'Family plans cleared.' : 'Family plans updated.',
      data: { familyPlans: user.familyPlans },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};