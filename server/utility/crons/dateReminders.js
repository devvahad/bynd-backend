import DateRequestModel from '../../model/matches/dateRequestSchema.js';
import { UnifiedNotificationService } from '../../services/index.js';
import { logger } from '../../services/logger.js';
import { DATE_REQUEST_STATUS, TYPE_OF_NOTIFICATIONS } from '../../constants.js';

const formatTime = (dateTime, timezone) => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone || 'UTC',
}).format(dateTime);

const REMINDER_MESSAGES = {
  '24h': (partnerName) => `Your date with ${partnerName} is tomorrow!`,
  '12h': (partnerName, time) => `Your date with ${partnerName} is in 12 hours, at ${time}.`,
  '6h': (partnerName, time) => `Your date with ${partnerName} is in 6 hours, at ${time}.`,
  '1h': (partnerName) => `Your date with ${partnerName} is in 1 hour — time to get ready!`,
};

export const sendDateReminders = async () => {
  try {
    const now = new Date();

    const windows = {
      '24h': { start: new Date(now.getTime() + 23 * 3600000), end: new Date(now.getTime() + 25 * 3600000) },
      '12h': { start: new Date(now.getTime() + 11 * 3600000), end: new Date(now.getTime() + 13 * 3600000) },
      '6h': { start: new Date(now.getTime() + 5 * 3600000), end: new Date(now.getTime() + 7 * 3600000) },
      '1h': { start: new Date(now.getTime() + 55 * 60000), end: new Date(now.getTime() + 65 * 60000) },
    };

    const dateRequests = await DateRequestModel.find({
      status: DATE_REQUEST_STATUS.ACCEPTED,
      deleted: false,
      dateTime: { $gte: windows['1h'].start, $lte: windows['24h'].end },
    })
      .populate('senderRef', 'firstName timezone')
      .populate('receiverRef', 'firstName timezone')
      .lean();

    let remindersSent = 0;

    for (const request of dateRequests) {
      const dateTime = new Date(request.dateTime);

      let reminderType = null;
      for (const [type, window] of Object.entries(windows)) {
        if (dateTime >= window.start && dateTime <= window.end) {
          reminderType = type;
          break;
        }
      }

      if (!reminderType || request.remindersSent?.includes(reminderType)) continue;
      if (!request.senderRef || !request.receiverRef) continue;

      const users = [
        { id: request.senderRef._id, partnerName: request.receiverRef.firstName, timezone: request.senderRef.timezone },
        { id: request.receiverRef._id, partnerName: request.senderRef.firstName, timezone: request.receiverRef.timezone },
      ];

      for (const user of users) {
        try {
          const formattedTime = formatTime(dateTime, user.timezone);
          const body = REMINDER_MESSAGES[reminderType](user.partnerName, formattedTime);

          // eslint-disable-next-line no-await-in-loop
          await UnifiedNotificationService({
            userId: user.id,
            title: 'Date Reminder',
            subtitle: body,
            type: TYPE_OF_NOTIFICATIONS.DATE_REMINDER,
            reference: request._id.toString(),
            payload: {
              event: 'DATE_REMINDER',
              requestId: request._id.toString(),
              dateTime: dateTime.toISOString(),
              location: request.location.name,
              reminderType,
            },
          });
          remindersSent += 1;
        } catch (notifErr) {
          logger.error(`Failed to send ${reminderType} reminder to user ${user.id}: ${notifErr.message}`);
        }
      }

      // eslint-disable-next-line no-await-in-loop
      await DateRequestModel.updateOne({ _id: request._id }, { $addToSet: { remindersSent: reminderType } });
    }

    return { success: true, remindersSent };
  } catch (err) {
    logger.error(`Error in date reminder job: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export default sendDateReminders;
