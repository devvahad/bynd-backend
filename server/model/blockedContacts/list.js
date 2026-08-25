import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { BlockedContactModel } from './schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

/**
 * Fetch this user's blocked contacts, paginated & searchable.
 */
export default async ({ id, search = '', page = 1, limit = PAGINATION_LIMIT }) => {
  if (!id) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property id.' });
  }

  const user = await UserModel.findOne({ _id: new Types.ObjectId(id), deleted: { $ne: true } });
  if (!user) {
    throw ResponseUtility.NO_USER();
  }

  const query = { userId: new Types.ObjectId(id) };

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { phoneNumber: searchRegex }];
  }

  const skip = (page - 1) * limit;

  const [contacts, totalCount] = await Promise.all([
    BlockedContactModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('name phoneNumber blockedUserRef source createdOn')
      .lean(),
    BlockedContactModel.countDocuments(query),
  ]);

  const formatted = contacts.map((contact) => ({
    _id: contact._id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    hasAccount: !!contact.blockedUserRef,
    blockedOn: contact.createdOn,
    source: contact.source,
  }));

  return ResponseUtility.SUCCESS({
    data: {
      contacts: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + contacts.length < totalCount,
      },
    },
  });
};
