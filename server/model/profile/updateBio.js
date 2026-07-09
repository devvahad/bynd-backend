import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MAX_BIO_LENGTH } from '../../constants.js';

const normalizeBio = (bio) => (typeof bio === 'string' ? bio.trim() : '');

export default async ({ userId, bio, preferNotToSay }) => {
  const { code, message } = await PropsValidationUtility({ validProps: ['userId'], sourceDocument: { userId } });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const trimmedBio = normalizeBio(bio);

  if (preferNotToSay !== true && trimmedBio.length > MAX_BIO_LENGTH) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Bio cannot exceed ${MAX_BIO_LENGTH} characters.` });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, blocked: false, deleted: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.bio = preferNotToSay === true || trimmedBio.length === 0 ? null : trimmedBio;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({
      message: preferNotToSay === true ? 'Bio removed successfully.' : 'Bio updated successfully.',
      data: { bio: user.bio, characterCount: user.bio ? user.bio.length : 0 },
    });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};