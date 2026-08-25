import { Types } from 'mongoose';
import DateRequestModel from '../matches/dateRequestSchema.js';
import DateFeedbackModel from './schema.js';
import { UserModel } from '../index.js';
import { BlockedContactModel } from '../blockedContacts/schema.js';
import { ResponseUtility } from '../../utility/index.js';
import { DATE_REQUEST_STATUS } from '../../constants.js';

const ACTIVE_STATUSES = [DATE_REQUEST_STATUS.ACCEPTED, DATE_REQUEST_STATUS.COMPLETED, DATE_REQUEST_STATUS.PENDING];
const FEEDBACK_DELAY_HOURS = 3;
const FEEDBACK_EXPIRY_DAYS = 7;

const getDayBounds = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

const formatLocalDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatDateForCalendar = (date) => ({
  weekday: date.toLocaleString('en-US', { weekday: 'short' }),
  day: date.getDate(),
  month: date.toLocaleString('en-US', { month: 'short' }),
  year: date.getFullYear(),
  fullDate: formatLocalDate(date),
  timestamp: date.getTime(),
});

const getOtherUserId = (dateRequest, currentUserId) => {
  const currentUserStr = currentUserId.toString();
  return dateRequest.senderRef._id.toString() === currentUserStr
    ? dateRequest.receiverRef._id.toString()
    : dateRequest.senderRef._id.toString();
};

export default async ({
  userId, selectedDate, includeCalendar = true, page = 1, limit = 20,
}) => {
  if (!userId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing userId.' });
  }

  const currentUser = await UserModel.findOne({ _id: userId, deleted: false, blocked: false })
    .select('_id firstName photos').lean();

  if (!currentUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  const [blockedContacts, blockedByOthers] = await Promise.all([
    BlockedContactModel.find({ userId, blockedUserRef: { $ne: null } }).select('blockedUserRef').lean(),
    BlockedContactModel.find({ blockedUserRef: userId }).select('userId').lean(),
  ]);
  const blockedObjectIds = [
    ...blockedContacts.map((b) => b.blockedUserRef.toString()),
    ...blockedByOthers.map((b) => b.userId.toString()),
  ].map((id) => new Types.ObjectId(id));

  const currentUserPhoto = currentUser.photos?.find((p) => p.order === 0)?.url || null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);
  endDate.setHours(23, 59, 59, 999);

  const oneDayBefore = new Date(today);
  oneDayBefore.setDate(today.getDate() - 1);
  oneDayBefore.setHours(0, 0, 0, 0);

  const baseUserFilter = {
    $and: [
      { $or: [{ senderRef: userId }, { receiverRef: userId }] },
      { senderRef: { $nin: blockedObjectIds } },
      { receiverRef: { $nin: blockedObjectIds } },
    ],
    status: { $in: ACTIVE_STATUSES },
    deleted: false,
  };

  const hasPastDate = await DateRequestModel.exists({
    ...baseUserFilter, dateTime: { $gte: oneDayBefore, $lt: today },
  });

  const startDate = hasPastDate ? oneDayBefore : today;

  let queryDate = today;
  if (selectedDate) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);

    if (queryDate < startDate || queryDate > endDate) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Selected date is out of valid range.' });
    }
  }

  const { startOfDay, endOfDay } = getDayBounds(queryDate);

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  let calendarData = [];
  if (includeCalendar) {
    const calendarDates = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      calendarDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    calendarData = await Promise.all(calendarDates.map(async (date) => {
      const { startOfDay: dayStart, endOfDay: dayEnd } = getDayBounds(date);
      const count = await DateRequestModel.countDocuments({ ...baseUserFilter, dateTime: { $gte: dayStart, $lte: dayEnd } });
      return {
        ...formatDateForCalendar(date),
        dateCount: count,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
        isSelected: date.toDateString() === queryDate.toDateString(),
      };
    }));
  }

  const totalDatesCount = await DateRequestModel.countDocuments({ ...baseUserFilter, dateTime: { $gte: startOfDay, $lte: endOfDay } });

  const dateRequests = await DateRequestModel.find({ ...baseUserFilter, dateTime: { $gte: startOfDay, $lte: endOfDay } })
    .sort({ dateTime: 1 })
    .skip(skip)
    .limit(safeLimit)
    .populate('senderRef', '_id firstName age photos')
    .populate('receiverRef', '_id firstName age photos')
    .lean();

  const feedbacks = await DateFeedbackModel.find({
    submittedBy: userId, dateRequestRef: { $in: dateRequests.map((d) => d._id) },
  }).select('dateRequestRef').lean();
  const feedbackSet = new Set(feedbacks.map((f) => f.dateRequestRef.toString()));

  const now = new Date();

  const datesList = dateRequests.map((dateRequest) => {
    const dateStartTime = new Date(dateRequest.dateTime);
    const feedbackEligibleAt = new Date(dateStartTime.getTime() + FEEDBACK_DELAY_HOURS * 60 * 60 * 1000);
    const feedbackExpiresAt = new Date(dateStartTime.getTime() + FEEDBACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const feedbackExists = feedbackSet.has(dateRequest._id.toString());

    const canShowFeedback = dateRequest.status === DATE_REQUEST_STATUS.ACCEPTED
      && now >= feedbackEligibleAt && now <= feedbackExpiresAt && !feedbackExists;

    const otherUserId = getOtherUserId(dateRequest, userId);
    const otherUser = dateRequest.senderRef._id.toString() === otherUserId ? dateRequest.senderRef : dateRequest.receiverRef;
    const otherUserPhoto = otherUser.photos?.find((p) => p.order === 0)?.url || null;

    const dateTime = new Date(dateRequest.dateTime);
    const timeString = dateTime.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const isSender = dateRequest.senderRef._id.toString() === userId.toString();

    const chatStartTime = new Date(dateRequest.dateTime);
    chatStartTime.setHours(chatStartTime.getHours() - 24);
    const chatEndTime = new Date(dateRequest.dateTime);
    chatEndTime.setHours(chatEndTime.getHours() + 24);
    const canChat = now >= chatStartTime && now <= chatEndTime && dateRequest.status === DATE_REQUEST_STATUS.ACCEPTED;

    return {
      _id: dateRequest._id,
      matchRef: dateRequest.matchRef,
      otherUser: {
        _id: otherUser._id, name: otherUser.firstName, age: otherUser.age, photo: otherUserPhoto,
      },
      currentUser: { _id: currentUser._id, name: currentUser.firstName, photo: currentUserPhoto },
      displayNames: `${otherUser.firstName} & ${currentUser.firstName}`,
      dateType: dateRequest.dateType,
      dateTime: dateRequest.dateTime,
      time: timeString,
      weekday: dateTime.toLocaleString('en-US', { weekday: 'long' }),
      location: {
        name: dateRequest.location.name,
        address: dateRequest.location.address,
        displayText: `First date at ${dateRequest.location.name}`,
        coordinates: dateRequest.location.coordinates,
      },
      message: dateRequest.message || null,
      status: dateRequest.status,
      isSender,
      isReceiver: !isSender,
      chat: {
        enabled: canChat,
        startsAt: chatStartTime,
        endsAt: chatEndTime,
        reason: canChat ? null : (now < chatStartTime ? 'CHAT_NOT_STARTED' : 'CHAT_EXPIRED'),
      },
      feedback: { canShow: canShowFeedback, eligibleAt: feedbackEligibleAt, expiresAt: feedbackExpiresAt },
      createdOn: dateRequest.createdOn,
      respondedAt: dateRequest.respondedAt,
    };
  });

  return ResponseUtility.SUCCESS({
    message: 'Dates list fetched successfully.',
    data: {
      calendar: calendarData,
      selectedDate: { ...formatDateForCalendar(queryDate), isToday: queryDate.toDateString() === today.toDateString() },
      dates: datesList,
      summary: {
        totalDates: datesList.length,
        dateRange: { start: formatLocalDate(startDate), end: formatLocalDate(endDate) },
        hasPastDate: !!hasPastDate,
      },
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalDatesCount,
        totalPages: Math.ceil(totalDatesCount / safeLimit),
        hasNextPage: skip + datesList.length < totalDatesCount,
        hasPrevPage: safePage > 1,
      },
    },
  });
};
