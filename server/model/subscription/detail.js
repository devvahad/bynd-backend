import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { ResponseUtility } from '../../utility/index.js';
import { SUBSCRIPTION_TYPE, SUBSCRIPTION_RATE } from '../../constants.js';

export default async ({ id }) => {
  const user = await UserModel.findOne({ _id: id, deleted: false, blocked: false });
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found.' });
  }

  const isActive = user.isPremium === true;

  const [detail] = await UserModel.aggregate([
    { $match: { $expr: { $and: [{ $eq: ['$_id', new Types.ObjectId(id)] }, { $eq: ['$deleted', false] }] } } },
    {
      $lookup: {
        from: 'subscriptions',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$userRef', '$$userId'] }, { $eq: [{ $ifNull: ['$deleted', false] }, false] }] } } },
          { $sort: { updatedOn: -1 } },
          { $limit: 1 },
        ],
        as: 'subscription',
      },
    },
    { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        cancelAutoRenewal: { $ifNull: ['$subscription.cancelAutoRenewal', false] },
        isCancelled: { $ifNull: ['$subscription.cancelAutoRenewal', false] },
        status: { $cond: [{ $eq: [isActive, true] }, 'Active', 'Expired'] },
        currentPlan: { $cond: { if: { $eq: ['$subscription', null] }, then: null, else: '$subscription.type' } },
        rate: {
          $cond: [
            { $eq: [{ $ifNull: ['$subscription', []] }, []] },
            null,
            {
              $switch: {
                branches: [
                  { case: { $eq: ['$subscription.type', SUBSCRIPTION_TYPE.ONE_WEEK] }, then: SUBSCRIPTION_RATE.ONE_WEEK_RATE },
                  { case: { $eq: ['$subscription.type', SUBSCRIPTION_TYPE.ONE_MONTH] }, then: SUBSCRIPTION_RATE.ONE_MONTH_RATE },
                  { case: { $eq: ['$subscription.type', SUBSCRIPTION_TYPE.THREE_MONTH] }, then: SUBSCRIPTION_RATE.THREE_MONTH_RATE },
                  { case: { $eq: ['$subscription.type', SUBSCRIPTION_TYPE.SIX_MONTH] }, then: SUBSCRIPTION_RATE.SIX_MONTH_RATE },
                ],
                default: null,
              },
            },
          ],
        },
        lastPayment: { $cond: { if: { $ne: ['$subscription.lastPayment', null] }, then: '$subscription.lastPayment', else: '$$REMOVE' } },
        renewal: {
          $cond: {
            if: { $eq: [{ $ifNull: ['$subscription', []] }, []] },
            then: null,
            else: {
              $cond: {
                if: { $eq: ['$subscription.cancelAutoRenewal', false] },
                then: '$subscription.expireDate',
                else: 'Cancelled',
              },
            },
          },
        },
      },
    },
  ]);

  if (!detail) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'Subscription not found' });
  }

  return ResponseUtility.SUCCESS({ message: 'Subscription details fetched successfully', data: detail });
};
