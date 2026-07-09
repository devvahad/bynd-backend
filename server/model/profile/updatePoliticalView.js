import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, POLITICAL_VIEWS } from '../../constants.js';

export default async ({ userId, politicalView, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    const normalizedView = typeof politicalView === 'string' ? politicalView.trim() : politicalView;

    if (!isClearing) {
      if (!normalizedView) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'politicalView is required unless preferNotToSay is true.',
        });
      }

      if (!POLITICAL_VIEWS.includes(normalizedView)) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: `Invalid political view. Allowed: ${POLITICAL_VIEWS.join(', ')}`,
        });
      }
    }

    const update = {
      politicalView: isClearing ? null : normalizedView,
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
      message: isClearing ? 'Political view cleared.' : 'Political view updated.',
      data: { politicalView: user.politicalView },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};