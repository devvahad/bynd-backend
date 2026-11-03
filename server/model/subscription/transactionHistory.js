import { Types } from 'mongoose';
import TransactionModel from './transactionSchema.js';
import { ResponseUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT, SUBSCRIPTION_RATE, SUBSCRIPTION_TYPE } from '../../constants.js';

const RATE_BY_TYPE = {
  [SUBSCRIPTION_TYPE.ONE_WEEK]: SUBSCRIPTION_RATE.ONE_WEEK_RATE,
  [SUBSCRIPTION_TYPE.ONE_MONTH]: SUBSCRIPTION_RATE.ONE_MONTH_RATE,
  [SUBSCRIPTION_TYPE.THREE_MONTH]: SUBSCRIPTION_RATE.THREE_MONTH_RATE,
  [SUBSCRIPTION_TYPE.SIX_MONTH]: SUBSCRIPTION_RATE.SIX_MONTH_RATE,
};

export default async ({ id, page = 1, limit = PAGINATION_LIMIT }) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.max(Number(limit) || PAGINATION_LIMIT, 1);

  const [transactions, total] = await Promise.all([
    TransactionModel.find({ userRef: new Types.ObjectId(id), deleted: false })
      .sort({ createdOn: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    TransactionModel.countDocuments({ userRef: new Types.ObjectId(id), deleted: false }),
  ]);

  return ResponseUtility.SUCCESS({
    data: {
      transactions: transactions.map((t) => ({
        id: t._id,
        type: t.type,
        rate: RATE_BY_TYPE[t.type] ?? null,
        device: t.device,
        productId: t.productId,
        expireAt: t.expireAt,
        createdOn: t.createdOn,
      })),
      page: pageNumber,
      limit: pageSize,
      total,
      hasMore: pageNumber * pageSize < total,
    },
  });
};