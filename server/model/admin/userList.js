import { ResponseUtility } from '../../utility/index.js';
import { UserModel } from '../index.js';
import {
  PAGINATION_LIMIT,
  MAX_LIMIT,
  MAX_SEARCH_TEXT_LENGTH
} from '../../constants.js';

const SENSITIVE_FIELDS = [
  'password',
  'device',
  'fcmToken',
  'emailToken',
  'emailTokenDate',
  'socialId',
  'socialToken',
  'socialIdentifier',
  'changePassToken',
  'changePassTokenDate',
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default async ({ text = '', page = 1, limit = PAGINATION_LIMIT }) => {
  try {
    const normalizedPage = toPositiveInt(page, 1);
    const normalizedLimit = Math.min(toPositiveInt(limit, PAGINATION_LIMIT), MAX_LIMIT);

    const matchQuery = { deleted: false };

    if (typeof text === 'string' && text.trim()) {
      const escapedText = escapeRegExp(text.trim().slice(0, MAX_SEARCH_TEXT_LENGTH));
      const searchRegex = new RegExp(escapedText, 'i');
      matchQuery.$or = [{ email: searchRegex }, { name: searchRegex }];
    }

    const [result] = await UserModel.aggregate([
      { $match: matchQuery },
      { $sort: { createdOn: -1 } },
      {
        $facet: {
          list: [
            { $skip: (normalizedPage - 1) * normalizedLimit },
            { $limit: normalizedLimit },
            { $unset: SENSITIVE_FIELDS },
          ],
          total: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          list: 1,
          total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
        },
      },
    ]);

    const list = result?.list || [];
    const total = result?.total || 0;

    return ResponseUtility.SUCCESS({
      data: {
        list,
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        size: list.length,
        hasMore: normalizedPage * normalizedLimit < total,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};