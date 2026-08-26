import DateFeedbackModel from '../date/schema.js';
import { ResponseUtility } from '../../utility/index.js';

export default async ({ page = 1, limit = 10, search = '' }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const searchMatch = search
    ? {
      $or: [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
      ],
    }
    : {};

  const aggregation = [
    { $match: { deleted: false, noShowReported: true } },
    {
      $group: {
        _id: '$otherUserRef',
        totalReports: { $sum: 1 },
        lastReportedAt: { $max: '$createdOn' },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.deleted': false, ...searchMatch } },
    {
      $project: {
        _id: 0,
        userId: '$user._id',
        name: '$user.firstName',
        verifiedByAdmin: '$user.verifiedByAdmin',
        email: '$user.email',
        profilePic: { $arrayElemAt: ['$user.photos.url', 0] },
        isBlocked: '$user.blocked',
        isDeleted: '$user.deleted',
        totalReports: 1,
        lastReportedAt: 1,
      },
    },
    { $sort: { totalReports: -1, lastReportedAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limitNum }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await DateFeedbackModel.aggregate(aggregation);
  const data = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return ResponseUtility.SUCCESS({
    message: 'No-show users list fetched successfully.',
    data: {
      list: data, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum),
    },
  });
};
