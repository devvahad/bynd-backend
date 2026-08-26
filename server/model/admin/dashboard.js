import { UserModel } from '../index.js';
import MatchModel from '../matches/schema.js';
import DateRequestModel from '../matches/dateRequestSchema.js';
import ReportModel from '../chat/reportSchema.js';
import SubscriptionModel from '../subscription/schema.js';
import TransactionModel from '../subscription/transactionSchema.js';
import DateFeedbackModel from '../date/schema.js';
import FilterModel from '../filters/schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { SUBSCRIPTION_TYPE, SUBSCRIPTION_RATE, DATE_REQUEST_STATUS } from '../../constants.js';

export default async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const userOverviewAgg = await UserModel.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$deleted', false] }, { $eq: ['$blocked', false] }, { $eq: ['$verified', true] }] },
              1, 0,
            ],
          },
        },
        blockedUsers: {
          $sum: { $cond: [{ $and: [{ $eq: ['$blocked', true] }, { $eq: ['$deleted', false] }] }, 1, 0] },
        },
        deletedUsers: { $sum: { $cond: [{ $eq: ['$deleted', true] }, 1, 0] } },
        pendingVerification: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$verificationImage.status', 'pending'] },
                  { $eq: ['$verifiedByAdmin', false] },
                  { $eq: ['$deleted', false] },
                  { $eq: ['$blocked', false] },
                ],
              },
              1, 0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0 } },
  ]);

  const userGrowthAgg = await UserModel.aggregate([
    {
      $facet: {
        today: [{ $match: { createdOn: { $gte: today } } }, { $count: 'count' }],
        week: [{ $match: { createdOn: { $gte: weekStart } } }, { $count: 'count' }],
        month: [{ $match: { createdOn: { $gte: monthStart } } }, { $count: 'count' }],
      },
    },
  ]);

  const activeUsersToday = await UserModel.countDocuments({ updatedOn: { $gte: today }, deleted: false });

  const matchesToday = await MatchModel.countDocuments({ createdOn: { $gte: today }, deleted: false });

  const datesThisWeek = await DateRequestModel.countDocuments({
    deleted: false, status: DATE_REQUEST_STATUS.ACCEPTED, dateTime: { $gte: weekStart },
  });

  const topDateCategories = await DateRequestModel.aggregate([
    { $match: { deleted: false, status: DATE_REQUEST_STATUS.ACCEPTED } },
    { $group: { _id: '$dateType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  const basicFilterFields = ['distance', 'verifiedOnly', 'religions', 'genders', 'ethnicities', 'datingExpectations'];
  const topBasicFilters = await FilterModel.aggregate([
    {
      $project: {
        filters: basicFilterFields.map((name) => {
          if (name === 'distance') {
            return { name, used: { $cond: [{ $gt: [{ $ifNull: [`$basicFilters.${name}`, 0] }, 0] }, 1, 0] } };
          }
          if (name === 'verifiedOnly') {
            return { name, used: { $cond: [{ $ifNull: [`$basicFilters.${name}`, false] }, 1, 0] } };
          }
          return { name, used: { $cond: [{ $gt: [{ $size: { $ifNull: [`$basicFilters.${name}`, []] } }, 0] }, 1, 0] } };
        }),
      },
    },
    { $unwind: '$filters' },
    { $group: { _id: '$filters.name', count: { $sum: '$filters.used' } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  const advancedFilterFields = ['politicalViews', 'languages', 'education', 'cannabis'];
  const topAdvancedFilters = await FilterModel.aggregate([
    {
      $project: {
        filters: [
          {
            name: 'heightRange',
            used: { $cond: [{ $ne: [{ $ifNull: ['$advancedFilters.heightRange', null] }, null] }, 1, 0] },
          },
          ...advancedFilterFields.map((name) => ({
            name,
            used: { $cond: [{ $gt: [{ $size: { $ifNull: [`$advancedFilters.${name}`, []] } }, 0] }, 1, 0] },
          })),
        ],
      },
    },
    { $unwind: '$filters' },
    { $group: { _id: '$filters.name', count: { $sum: '$filters.used' } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  const totalReports = await ReportModel.countDocuments({ deleted: false });
  const weeklyReports = await ReportModel.countDocuments({ createdOn: { $gte: weekStart } });

  const reportedUserIds = await ReportModel.distinct('reportedUserId', { deleted: false });
  const noShowUserIds = await DateFeedbackModel.distinct('otherUserRef', { deleted: false, noShowReported: true });

  const flaggedUsers = reportedUserIds.length;
  const noShowReportedProfiles = noShowUserIds.length;

  const topFilters = await UserModel.aggregate([
    { $unwind: '$firstDatePreferences' },
    { $group: { _id: '$firstDatePreferences', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  const activeSubscriptions = await SubscriptionModel.countDocuments({ deleted: false, expireDate: { $gte: new Date() } });

  const subscriptionRenewals = await SubscriptionModel.countDocuments({
    deleted: false, lastPayment: { $exists: true }, $expr: { $gt: ['$lastPayment', '$createdOn'] },
  });

  const subscriptionCancellations = await SubscriptionModel.countDocuments({
    $or: [{ cancelAutoRenewal: true }, { deleted: true }],
  });

  // Revenue by transaction (each purchase counted once), not by current subscription state.
  const revenueAgg = await TransactionModel.aggregate([
    { $match: { deleted: false } },
    {
      $project: {
        type: 1,
        amount: {
          $switch: {
            branches: [
              { case: { $eq: ['$type', SUBSCRIPTION_TYPE.ONE_WEEK] }, then: SUBSCRIPTION_RATE.ONE_WEEK_RATE },
              { case: { $eq: ['$type', SUBSCRIPTION_TYPE.ONE_MONTH] }, then: SUBSCRIPTION_RATE.ONE_MONTH_RATE },
              { case: { $eq: ['$type', SUBSCRIPTION_TYPE.THREE_MONTH] }, then: SUBSCRIPTION_RATE.THREE_MONTH_RATE },
              { case: { $eq: ['$type', SUBSCRIPTION_TYPE.SIX_MONTH] }, then: SUBSCRIPTION_RATE.SIX_MONTH_RATE },
            ],
            default: 0,
          },
        },
      },
    },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const revenueBreakdown = {
    oneWeek: 0, oneMonth: 0, threeMonth: 0, sixMonth: 0,
  };

  revenueAgg.forEach((item) => {
    switch (item._id) {
      case SUBSCRIPTION_TYPE.ONE_WEEK: revenueBreakdown.oneWeek = item.total; break;
      case SUBSCRIPTION_TYPE.ONE_MONTH: revenueBreakdown.oneMonth = item.total; break;
      case SUBSCRIPTION_TYPE.THREE_MONTH: revenueBreakdown.threeMonth = item.total; break;
      case SUBSCRIPTION_TYPE.SIX_MONTH: revenueBreakdown.sixMonth = item.total; break;
      default: break;
    }
  });

  const totalRevenue = Object.values(revenueBreakdown).reduce((a, b) => a + b, 0);

  const premiumUsers = await UserModel.countDocuments({ isPremium: true, deleted: false, blocked: false });
  const freeUsers = await UserModel.countDocuments({ isPremium: false, deleted: false, blocked: false });

  return ResponseUtility.SUCCESS({
    data: {
      overview: {
        ...userOverviewAgg[0],
        flaggedUsers,
        noShowReportedProfiles,
      },
      growth: {
        newUsersToday: userGrowthAgg[0]?.today[0]?.count || 0,
        newUsersThisWeek: userGrowthAgg[0]?.week[0]?.count || 0,
        newUsersThisMonth: userGrowthAgg[0]?.month[0]?.count || 0,
        activeUsersToday,
      },
      matches: {
        matchesToday,
        datesThisWeek,
        topDateCategories,
      },
      safety: {
        totalReports,
        weeklyReports,
      },
      behavior: {
        topFilters,
        mostUsedFilters: { basic: topBasicFilters, advanced: topAdvancedFilters },
      },
      monetization: {
        activeSubscriptions: premiumUsers,
        totalRevenue,
        revenueBreakdown,
        freeUsers,
        premiumUsers,
        subscriptionRenewals,
        subscriptionCancellations,
      },
    },
  });
};
