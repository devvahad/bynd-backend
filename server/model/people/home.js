import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import FilterModel from '../filters/schema.js';
import LikeModel from '../like/schema.js';
import PassModel from '../like/passSchema.js';
import MatchModel from '../matches/schema.js';
import { BlockedContactModel } from '../blockedContacts/schema.js';
import { ResponseUtility, PropsValidationUtility, DistanceUtility } from '../../utility/index.js';
import {
  SUCCESS_CODE, PROMPTS, NO_PROFILES_FOUND, PROFILE_FETCH_SUCCESS,
  MIN_HEIGHT_CM, MAX_HEIGHT_CM, MATCH_STATUS, OPEN_TO_EVERYONE,
} from '../../constants.js';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const applyPremiumBoost = (premiumUsers) => [...premiumUsers, ...premiumUsers];

const buildFilterQuery = (baseQuery, filters, loggedInUser) => {
  if (!filters || !filters.isFilterActive) return baseQuery;

  const query = { ...baseQuery };
  const basic = filters.basicFilters || {};
  const advanced = filters.advancedFilters || {};
  const expandDistance = basic.expandDistance === true;
  const expandAge = basic.expandAge === true;

  const applyInFilter = (values, userFieldName) => {
    if (Array.isArray(values) && values.length > 0 && !values.includes(OPEN_TO_EVERYONE)) {
      query[userFieldName] = { $in: values };
    }
  };

  if (!expandDistance && loggedInUser.location?.coordinates?.length === 2 && basic.distance) {
    const maxDistanceInMeters = basic.distance * 1609.34;
    query.location = {
      $geoWithin: { $centerSphere: [loggedInUser.location.coordinates, maxDistanceInMeters / 6378137] },
    };
  }

  if (basic.ageRange) {
    query.age = expandAge
      ? { $gte: 18, $lte: 90 }
      : { $gte: basic.ageRange.min, $lte: basic.ageRange.max };
  }

  if (basic.verifiedOnly === true) {
    query.verifiedByAdmin = true;
  }

  applyInFilter(basic.religions, 'religion');
  applyInFilter(basic.genders, 'gender');
  applyInFilter(basic.ethnicities, 'userEthnicities');
  applyInFilter(basic.datingExpectations, 'lookingFor');

  const expandHeight = advanced.expandHeight === true;
  if (advanced.heightRange) {
    query.heightCm = expandHeight
      ? { $gte: MIN_HEIGHT_CM, $lte: MAX_HEIGHT_CM }
      : { $gte: advanced.heightRange.min, $lte: advanced.heightRange.max };
  }

  applyInFilter(advanced.politicalViews, 'politicalView');
  applyInFilter(advanced.drinkingHabits, 'drinkingHabits');
  applyInFilter(advanced.smokingHabits, 'smokingHabits');
  applyInFilter(advanced.children, 'children');
  applyInFilter(advanced.familyPlans, 'familyPlans');
  applyInFilter(advanced.education, 'education');
  applyInFilter(advanced.exercise, 'exercise');
  applyInFilter(advanced.relationshipType, 'relationshipType');
  applyInFilter(advanced.cannabis, 'cannabis');
  applyInFilter(advanced.languages, 'languages');

  return query;
};

const formatProfile = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  age: user.age,
  dob: user.dob,
  hideGender: user.hideGender || false,
  gender: user.gender,
  verifiedByAdmin: user.verifiedByAdmin,
  subGender: user.subGender,
  heightLabel: user.heightLabel,
  photos: user.photos || [],
  lookingFor: user.lookingFor,
  relationshipType: user.relationshipType,
  drinkingHabits: user.drinkingHabits,
  likesCount: user.likesCount,
  location: user.location,
  city: user.city,
  country: user.country,
  state: user.state,
  prompts: user.prompts || [],
  smokingHabits: user.smokingHabits,
  religion: user.religion,
  politicalView: user.politicalView,
  firstDatePreferences: user.firstDatePreferences || [],
  bio: user.bio || null,
  interests: user.interests || [],
  children: user.children || null,
  familyPlans: user.familyPlans || null,
  pets: user.pets || [],
  exercise: user.exercise || null,
  languages: user.languages || [],
  education: user.education || null,
  work: user.work || null,
  school: user.school || null,
  sexuality: user.sexuality || [],
  pronouns: user.pronouns || [],
  loveLanguages: user.loveLanguages || [],
  datingExpectations: user.datingExpectations || null,
  zodiacSign: user.zodiacSign || null,
  userEthnicities: user.userEthnicities || [],
  cannabis: user.cannabis || null,
  dietaryPreferences: user.dietaryPreferences || [],
  foodAllergies: user.foodAllergies || [],
  createdOn: user.createdOn,
  updatedOn: user.updatedOn,
});

export default async ({
  id, page = 1, limit = 10, lat, lng,
}) => {
  const { code, message } = PropsValidationUtility({ validProps: ['id'], sourceDocument: { id } });
  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const loggedInUser = await UserModel.findOne({ _id: id, deleted: false, blocked: false });
  if (!loggedInUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found or account is blocked.' });
  }

  const [blockedContacts, blockedByOthers, likedDocs, passedDocs] = await Promise.all([
    BlockedContactModel.find({ userId: id, blockedUserRef: { $ne: null } }).select('blockedUserRef').lean(),
    BlockedContactModel.find({ blockedUserRef: id }).select('userId').lean(),
    LikeModel.find({ userRef: id, deleted: false }).select('likedUserRef').lean(),
    PassModel.find({ userRef: id, deleted: false }).select('passedUserRef').lean(),
  ]);

  const blockedContactUserIds = blockedContacts.map((doc) => doc.blockedUserRef.toString());
  const blockedByUserIds = blockedByOthers.map((doc) => doc.userId.toString());
  const likedUserIds = likedDocs.map((doc) => doc.likedUserRef.toString());
  const passedUserIds = passedDocs.map((doc) => doc.passedUserRef.toString());

  if (lat && lng) {
    await UserModel.updateOne({ _id: id }, { $set: { location: { type: 'Point', coordinates: [lng, lat] } } });
    loggedInUser.location = { type: 'Point', coordinates: [lng, lat] };
  }
  const currentUserLocation = loggedInUser.location?.coordinates;

  const datePlannedMatches = await MatchModel.find({
    status: MATCH_STATUS.DATE_PLANNED, deleted: false, $or: [{ user1Ref: id }, { user2Ref: id }],
  }).lean();

  const datePlannedUserIds = datePlannedMatches.map(
    (match) => (match.user1Ref.toString() === id ? match.user2Ref.toString() : match.user1Ref.toString()),
  );

  const userFilters = await FilterModel.findOne({ userId: id }).lean();

  const expandedSearch = userFilters?.basicFilters?.expandAge === true
    || userFilters?.basicFilters?.expandDistance === true
    || userFilters?.advancedFilters?.expandHeight === true;

  const removedList = (loggedInUser.removedUsers || []).map(String);
  const removedByList = (loggedInUser.removedBy || []).map(String);
  const reportedList = (loggedInUser.reportedUsers || []).map(String);
  const reportedByList = (loggedInUser.reportedBy || []).map(String);

  const exclusionList = Array.from(new Set([
    ...likedUserIds, ...passedUserIds, ...removedList, ...removedByList,
    ...reportedList, ...reportedByList, ...datePlannedUserIds,
    ...blockedContactUserIds, ...blockedByUserIds, id,
  ]));

  const exclusionObjectIds = exclusionList.map((uid) => new Types.ObjectId(uid));

  let query = {
    _id: { $nin: exclusionObjectIds },
    deleted: false,
    blocked: false,
    incognitoMode: { $ne: true },
    firstName: { $exists: true, $ne: null },
    'photos.0': { $exists: true },
    removedBy: { $ne: id },
    reportedBy: { $ne: id },
  };

  query = buildFilterQuery(query, userFilters, loggedInUser);

  const promptMap = Object.entries(PROMPTS).map(([key, value]) => ({ k: Number(key), v: value }));

  const allProfiles = await UserModel.aggregate([
    { $match: query },
    {
      $project: {
        firstName: 1, age: 1, hideGender: 1, dob: 1, gender: 1, country: 1, state: 1, city: 1,
        subGender: 1, heightLabel: 1, photos: 1, datePreferences: 1, userEthnicities: 1, lookingFor: 1,
        relationshipType: 1, drinkingHabits: 1, smokingHabits: 1, religion: 1, politicalView: 1,
        firstDatePreferences: 1, isPremium: 1, verifiedByAdmin: 1, verified: 1, location: 1, bio: 1,
        interests: 1, dietaryPreferences: 1, children: 1, familyPlans: 1, pets: 1, exercise: 1,
        languages: 1, education: 1, work: 1, school: 1, sexuality: 1, pronouns: 1, loveLanguages: 1,
        datingExpectations: 1, zodiacSign: 1, cannabis: 1, foodAllergies: 1, createdOn: 1, updatedOn: 1,
      },
    },
    {
      $lookup: {
        from: 'likes', localField: '_id', foreignField: 'likedUserRef', as: 'likesData',
        pipeline: [{ $match: { deleted: false } }],
      },
    },
    { $addFields: { likesCount: { $size: '$likesData' } } },
    { $project: { likesData: 0 } },
    {
      $lookup: {
        from: 'prompts',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$userRef', '$$userId'] }, deleted: false } },
          {
            $addFields: {
              promptText: {
                $let: {
                  vars: { map: promptMap },
                  in: { $arrayElemAt: [{ $filter: { input: '$$map', as: 'm', cond: { $eq: ['$$m.k', '$promptId'] } } }, 0] },
                },
              },
            },
          },
          { $addFields: { promptText: '$promptText.v' } },
          { $project: { promptId: 1, promptText: 1, response: 1, order: 1, _id: 0 } },
          { $sort: { order: 1 } },
        ],
        as: 'prompts',
      },
    },
  ]);

  if (!allProfiles.length) {
    let noResultsMessage = NO_PROFILES_FOUND;
    if (expandedSearch) {
      noResultsMessage = 'We expanded your search, but no profiles were found. Try adjusting your filters.';
    } else if (userFilters?.isFilterActive) {
      noResultsMessage = 'No profiles match your filters.';
    }
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: noResultsMessage, error: { expandedSearch } });
  }

  const isPremium = (u) => u.isPremium === true;
  const premiumUsers = allProfiles.filter(isPremium);
  const normalUsers = allProfiles.filter((u) => !isPremium(u));

  const merged = [...shuffleArray(applyPremiumBoost(premiumUsers)), ...shuffleArray(normalUsers)];

  const seen = new Set();
  const finalProfilesList = [];
  merged.forEach((user) => {
    const userId = user._id.toString();
    if (!seen.has(userId)) {
      seen.add(userId);
      finalProfilesList.push(user);
    }
  });

  const formattedProfiles = finalProfilesList.map((user) => {
    const profile = formatProfile(user);
    const distance = currentUserLocation && user.location?.coordinates
      ? DistanceUtility(currentUserLocation, user.location.coordinates)
      : null;
    return { ...profile, distance: distance ? `${distance} miles` : null };
  });

  const startIndex = (page - 1) * limit;
  const paginatedProfiles = formattedProfiles.slice(startIndex, startIndex + limit);
  const totalProfiles = formattedProfiles.length;
  const totalPages = Math.ceil(totalProfiles / limit);

  return ResponseUtility.SUCCESS({
    data: {
      profiles: paginatedProfiles,
      pagination: {
        currentPage: page, totalPages, totalProfiles, pageSize: limit,
        hasNextPage: page < totalPages, hasPreviousPage: page > 1,
      },
      filterInfo: { isFilterActive: userFilters?.isFilterActive || false, expandedSearch },
      message: expandedSearch
        ? 'Showing expanded results. Some profiles may not match all filters.'
        : PROFILE_FETCH_SUCCESS,
    },
  });
};
