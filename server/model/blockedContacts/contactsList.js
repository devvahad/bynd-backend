import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { BlockedContactModel, SyncedContactModel } from './schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

/**
 * Fetch the synced-contacts list, excluding any already-blocked numbers.
 */
export default async ({ id, search = '', page = 1, limit = PAGINATION_LIMIT }) => {
  if (!id) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property id.' });
  }

  const user = await UserModel.findOne({ _id: new Types.ObjectId(id), deleted: { $ne: true } });
  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const blockedContacts = await BlockedContactModel.find({ userId: new Types.ObjectId(id) }).select('phoneNumber');
  const blockedPhoneNumbers = blockedContacts.map((bc) => bc.phoneNumber);

  const query = {
    userId: new Types.ObjectId(id),
    phoneNumber: { $nin: blockedPhoneNumbers },
  };

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { phoneNumber: searchRegex }];
  }

  const skip = (page - 1) * limit;

  const [syncedContacts, totalCount, hasSyncedContacts] = await Promise.all([
    SyncedContactModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('name phoneNumber userRef syncedAt')
      .lean(),
    SyncedContactModel.countDocuments(query),
    SyncedContactModel.exists({ userId: new Types.ObjectId(id) }),
  ]);

  const formatted = syncedContacts.map((contact) => ({
    _id: contact._id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    hasAccount: !!contact.userRef,
    syncedAt: contact.syncedAt,
  }));

  return ResponseUtility.SUCCESS({
    data: {
      contacts: formatted,
      hasSynced: !!hasSyncedContacts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + syncedContacts.length < totalCount,
      },
    },
  });
};
