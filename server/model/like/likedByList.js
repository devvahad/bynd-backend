import { Types } from 'mongoose';
import LikeModel from './schema.js';
import PassModel from './passSchema.js';
import MatchModel from '../matches/schema.js';
import { UserModel } from '../index.js';
import { BlockedContactModel } from '../blockedContacts/schema.js';
import { ResponseUtility, DistanceUtility } from '../../utility/index.js';
import { PAGINATION_LIMIT, PROMPTS } from '../../constants.js';

export default async ({ userId, page = 1, limit = PAGINATION_LIMIT }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || PAGINATION_LIMIT;

  if (!userId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing userId.' });
  }

  const currentUser = await UserModel.findOne({ _id: userId, deleted: false }).select('isPremium location').lean();
  if (!currentUser) {
    throw ResponseUtility.NO_USER();
  }

  const isCurrentUserPremium = currentUser.isPremium || false;
  const currentUserLocation = currentUser.location?.coordinates;

  const [blockedContacts, blockedByOthers] = await Promise.all([
    BlockedContactModel.find({ userId, blockedUserRef: { $ne: null } }).select('blockedUserRef').lean(),
    BlockedContactModel.find({ blockedUserRef: userId }).select('userId').lean(),
  ]);

  const blockedObjectIds = [
    ...blockedContacts.map((doc) => doc.blockedUserRef.toString()),
    ...blockedByOthers.map((doc) => doc.userId.toString()),
  ].map((id) => new Types.ObjectId(id));

  const userMatches = await MatchModel.find({
    $or: [{ user1Ref: userId, deleted: false }, { user2Ref: userId, deleted: false }],
  }).select('user1Ref user2Ref').lean();

  const matchedUserIds = userMatches
    .map((m) => (m.user1Ref.toString() === userId.toString() ? m.user2Ref : m.user1Ref))
    .map((id) => new Types.ObjectId(id));

  const passedUserDocs = await PassModel.find({ userRef: userId, deleted: false }).select('passedUserRef').lean();
  const passedUserIds = passedUserDocs.map((p) => new Types.ObjectId(p.passedUserRef));

  const excludeIds = [...matchedUserIds, ...blockedObjectIds, ...passedUserIds];

  const basePipeline = [
    {
      $match: {
        likedUserRef: new Types.ObjectId(userId),
        deleted: false,
        userRef: { $nin: excludeIds },
      },
    },
    { $lookup: { from: 'users', localField: 'userRef', foreignField: '_id', as: 'likerProfile' } },
    { $unwind: { path: '$likerProfile', preserveNullAndEmptyArrays: false } },
    {
      $match: {
        'likerProfile.deleted': false,
        'likerProfile.blocked': false,
        'likerProfile.incognitoMode': { $ne: true },
        'likerProfile._id': { $nin: blockedObjectIds },
      },
    },
  ];

  const listPipeline = [
    ...basePipeline,
    {
      $lookup: {
        from: 'prompts',
        let: { userId: '$likerProfile._id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$userRef', '$$userId'] }, { $eq: ['$deleted', false] }] } } },
          { $sort: { order: 1 } },
          { $project: { _id: 0, promptId: 1, response: 1, order: 1 } },
        ],
        as: 'prompts',
      },
    },
    {
      $addFields: {
        sortPriority: { $cond: { if: { $eq: ['$likerProfile.isPremium', true] }, then: 1, else: 2 } },
        likeTimestamp: '$createdOn',
      },
    },
    { $sort: { sortPriority: 1, likeTimestamp: -1 } },
    {
      $project: {
        _id: '$likerProfile._id',
        firstName: '$likerProfile.firstName',
        age: '$likerProfile.age',
        isPremium: '$likerProfile.isPremium',
        verified: '$likerProfile.verified',
        photos: '$likerProfile.photos',
        locationCoordinates: '$likerProfile.location.coordinates',
        bio: '$likerProfile.bio',
        prompts: '$prompts',
        likedAt: '$createdOn',
      },
    },
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },
  ];

  const countPipeline = [...basePipeline, { $count: 'total' }];

  const [likedByUsers, countResult] = await Promise.all([
    LikeModel.aggregate(listPipeline),
    LikeModel.aggregate(countPipeline),
  ]);

  const actualCount = countResult[0]?.total || 0;

  const processedUsers = likedByUsers.map((user) => {
    let formattedDistance = null;
    if (currentUserLocation && user.locationCoordinates) {
      const distance = DistanceUtility(currentUserLocation, user.locationCoordinates);
      if (distance !== null) {
        formattedDistance = distance < 10 ? distance.toFixed(1) : Math.round(distance).toLocaleString('en-US');
      }
    }

    const primaryPhoto = user.photos?.length
      ? [...user.photos].sort((a, b) => (a.order || 0) - (b.order || 0))[0]?.url
      : null;

    if (isCurrentUserPremium) {
      const mappedPrompts = (user.prompts || []).map((p) => ({
        promptId: p.promptId, promptText: PROMPTS[p.promptId] || null, response: p.response, order: p.order,
      }));
      return {
        _id: user._id,
        name: user.firstName || 'User',
        age: user.age,
        isPremium: user.isPremium || false,
        verified: user.verified || false,
        bio: user.bio,
        distance: formattedDistance ? `${formattedDistance} miles` : null,
        photo: primaryPhoto,
        prompts: mappedPrompts,
        likedAt: user.likedAt,
        isLocked: false,
      };
    }

    return {
      _id: user._id,
      name: user.firstName || 'User',
      age: user.age || null,
      isPremium: user.isPremium || false,
      verified: user.verified || false,
      distance: formattedDistance ? `${formattedDistance} miles` : null,
      photo: primaryPhoto,
      isLocked: true,
      likedAt: user.likedAt,
    };
  });

  return ResponseUtility.SUCCESS({
    message: 'Users who liked you fetched successfully.',
    data: {
      isCurrentUserPremium,
      likedByUsers: processedUsers,
      count: actualCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: actualCount,
        totalPages: Math.ceil(actualCount / limitNum),
        hasNextPage: pageNum < Math.ceil(actualCount / limitNum),
        hasPreviousPage: pageNum > 1,
      },
    },
  });
};
