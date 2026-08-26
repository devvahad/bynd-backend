import MatchModel from '../../model/matches/schema.js';
import DateRequestModel from '../../model/matches/dateRequestSchema.js';
import { UnifiedNotificationService } from '../../services/index.js';
import { logger } from '../../services/logger.js';
import {
  MATCH_STATUS, DATE_REQUEST_STATUS, TYPE_OF_NOTIFICATIONS, PLAN_DATE_EXPIRY_HOURS,
} from '../../constants.js';

export const sendExpiringMatchNotifications = async () => {
  try {
    const now = Date.now();

    const matches = await MatchModel.find({ status: MATCH_STATUS.ACTIVE, datePlanned: null, deleted: false })
      .populate('user1Ref', 'firstName')
      .populate('user2Ref', 'firstName')
      .lean();

    let notificationsSent = 0;

    for (const match of matches) {
      const expiryTime = new Date(match.createdOn).getTime() + PLAN_DATE_EXPIRY_HOURS * 3600000;
      const timeUntilExpiry = expiryTime - now;

      if (timeUntilExpiry <= 0) continue;
      if (timeUntilExpiry < 7 * 3600000 || timeUntilExpiry > 9 * 3600000) continue;
      if (match.expiryRemindersSent?.includes('8h')) continue;
      if (!match.user1Ref || !match.user2Ref) continue;

      const users = [
        { id: match.user1Ref._id, partnerName: match.user2Ref?.firstName || 'Your match' },
        { id: match.user2Ref._id, partnerName: match.user1Ref?.firstName || 'Your match' },
      ];

      for (const user of users) {
        try {
          await UnifiedNotificationService({
            userId: user.id,
            title: 'Match Expiring Soon',
            subtitle: `Your match with ${user.partnerName} expires in a few hours — plan a date before it's gone!`,
            type: TYPE_OF_NOTIFICATIONS.MATCH_EXPIRING,
            reference: match._id.toString(),
            payload: { event: 'MATCH_EXPIRING', matchId: match._id.toString(), expiresAt: new Date(expiryTime).toISOString() },
          });
          notificationsSent += 1;
        } catch (notifErr) {
          logger.error(`Failed to send expiring match notification to user ${user.id}: ${notifErr.message}`);
        }
      }

      await MatchModel.updateOne({ _id: match._id }, { $addToSet: { expiryRemindersSent: '8h' } });
    }

    return { success: true, notificationsSent };
  } catch (err) {
    logger.error(`Error in expiring match notifications: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendExpiringDateRequestNotifications = async () => {
  try {
    const now = Date.now();

    const requests = await DateRequestModel.find({ status: DATE_REQUEST_STATUS.PENDING, deleted: false })
      .populate('senderRef', 'firstName')
      .populate('receiverRef', 'firstName')
      .lean();

    let notificationsSent = 0;

    for (const request of requests) {
      const match = await MatchModel.findOne({ _id: request.matchRef, status: MATCH_STATUS.ACTIVE, deleted: false });
      if (!match || !request.senderRef || !request.receiverRef) continue;

      const expiryTime = new Date(match.createdOn).getTime() + PLAN_DATE_EXPIRY_HOURS * 3600000;
      const timeUntilExpiry = expiryTime - now;
      if (timeUntilExpiry <= 0) continue;

      let reminderType = null;
      if (timeUntilExpiry >= 7 * 3600000 && timeUntilExpiry <= 9 * 3600000) {
        reminderType = '8h';
      } else if (timeUntilExpiry >= 0 && timeUntilExpiry <= 2 * 3600000) {
        reminderType = '1h';
      }

      if (!reminderType || request.expiryRemindersSent?.includes(reminderType)) continue;

      try {
        await UnifiedNotificationService({
          userId: request.receiverRef._id,
          title: 'Date Request Expiring',
          subtitle: `Your date request from ${request.senderRef.firstName} is expiring soon — respond before it's gone!`,
          type: TYPE_OF_NOTIFICATIONS.DATE_REQUEST_EXPIRING,
          reference: request._id.toString(),
          payload: {
            event: 'DATE_REQUEST_EXPIRING', requestId: request._id.toString(), expiresIn: reminderType, expiresAt: new Date(expiryTime).toISOString(),
          },
        });
        notificationsSent += 1;
      } catch (notifErr) {
        logger.error(`Failed to send expiring date request notification: ${notifErr.message}`);
      }
      await DateRequestModel.updateOne({ _id: request._id }, { $addToSet: { expiryRemindersSent: reminderType } });
    }

    return { success: true, notificationsSent };
  } catch (err) {
    logger.error(`Error in expiring date request notifications: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const sendExpiringNotifications = async () => {
  const matches = await sendExpiringMatchNotifications();
  const dateRequests = await sendExpiringDateRequestNotifications();
  return { matches, dateRequests };
};

export default sendExpiringNotifications;
