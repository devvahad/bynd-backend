import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, PRONOUNS } from '../../constants.js';

export default async ({ userId, pronouns, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId'],
    sourceDocument: { userId },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false }).lean(false);

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  if (preferNotToSay === true) {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { pronouns: [], updatedOn: new Date() } }
    );
    return ResponseUtility.SUCCESS({ message: 'Pronouns cleared.', data: { pronouns: [] } });
  }

  if (!Array.isArray(pronouns)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Pronouns must be an array.' });
  }

  if (pronouns.length > 3) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Max 3 pronouns allowed.' });
  }

  const invalid = pronouns.filter((p) => !PRONOUNS.includes(p));

  if (invalid.length) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid pronouns: ${invalid.join(', ')}` });
  }

  await UserModel.updateOne(
    { _id: userId },
    { $set: { pronouns, updatedOn: new Date() } }
  );

  return ResponseUtility.SUCCESS({
    message: 'Pronouns updated successfully.',
    data: { pronouns },
  });
};