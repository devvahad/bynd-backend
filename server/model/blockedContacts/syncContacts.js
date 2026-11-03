import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { SyncedContactModel } from './schema.js';
import { ResponseUtility } from '../../utility/index.js';

const normalizePhone = (phoneNumber) => phoneNumber.replace(/[\s\-()]/g, '');

export default async ({ id, contacts = [] }) => {
  if (!id) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property id.' });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Contacts array is required and cannot be empty.' });
  }

  const user = await UserModel.findOne({ _id: new Types.ObjectId(id), deleted: { $ne: true } });
  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const existingSyncCount = await SyncedContactModel.countDocuments({ userId: new Types.ObjectId(id) });
  if (existingSyncCount > 0) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Contacts have already been synced. You can only sync once.' });
  }

  const validContacts = contacts
    .filter((contact) => contact && contact.name && contact.phoneNumber)
    .map((contact) => ({
      name: contact.name.trim(),
      phoneNumber: normalizePhone(contact.phoneNumber),
    }));

  if (validContacts.length === 0) {
    throw ResponseUtility.GENERIC_ERR({ message: 'No valid contacts to sync.' });
  }

  const phoneNumbers = validContacts.map((c) => c.phoneNumber);
  const existingAccounts = await UserModel.find({
    phoneNumber: { $in: phoneNumbers },
    deleted: { $ne: true },
  }).select('_id phoneNumber');

  const phoneToUserMap = new Map(existingAccounts.map((u) => [u.phoneNumber, u._id]));

  const contactsToInsert = validContacts.map((contact) => ({
    userId: new Types.ObjectId(id),
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    userRef: phoneToUserMap.get(contact.phoneNumber) || null,
    syncedAt: new Date(),
  }));

  let insertedCount = 0;
  try {
    const result = await SyncedContactModel.insertMany(contactsToInsert, { ordered: false });
    insertedCount = result.length;
  } catch (err) {
    if (err.writeErrors) {
      insertedCount = contactsToInsert.length - err.writeErrors.length;
    } else {
      throw ResponseUtility.GENERIC_ERR({ message: err.message || 'Failed to sync contacts.' });
    }
  }

  return ResponseUtility.SUCCESS({
    message: 'Contacts synced successfully.',
    data: {
      syncedCount: insertedCount,
      totalContacts: contacts.length,
      skippedCount: contacts.length - insertedCount,
      existingAccountsFound: existingAccounts.length,
    },
  });
};
