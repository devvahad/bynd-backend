import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { BlockedContactModel } from './schema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { DUPLICATE_KEY_ERROR_CODE, SUCCESS_CODE } from '../../constants.js';

const normalizePhone = (phoneNumber) => phoneNumber.replace(/[\s\-()]/g, '');

export default async ({ id, name, phoneNumber }) => {
  const { code, message } = PropsValidationUtility({
    validProps: ['id', 'name', 'phoneNumber'],
    sourceDocument: { id, name, phoneNumber },
  });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: new Types.ObjectId(id), deleted: { $ne: true } });
  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const normalizedPhone = normalizePhone(phoneNumber);

  const alreadyBlocked = await BlockedContactModel.findOne({ userId: id, phoneNumber: normalizedPhone });
  if (alreadyBlocked) {
    throw ResponseUtility.GENERIC_ERR({ message: 'This contact is already blocked.' });
  }

  const existingAccount = await UserModel.findOne({
    phoneNumber: normalizedPhone,
    deleted: { $ne: true },
  }).select('_id');

  try {
    const blockedContact = await BlockedContactModel.create({
      userId: id,
      name: name.trim(),
      phoneNumber: normalizedPhone,
      blockedUserRef: existingAccount ? existingAccount._id : null,
      source: 'MANUAL',
    });

    return ResponseUtility.SUCCESS({
      message: 'Contact blocked successfully.',
      data: {
        _id: blockedContact._id,
        name: blockedContact.name,
        phoneNumber: blockedContact.phoneNumber,
        hasAccount: !!existingAccount,
      },
    });
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      throw ResponseUtility.GENERIC_ERR({ message: 'This contact is already blocked.' });
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message || 'Failed to block contact.', error: err.message });
  }
};
