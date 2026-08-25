import NotificationModel from '../model/notification/index.js';
import { UserModel } from '../model/index.js';
import FirebaseNotificationService from './firebaseNotification.js';
import { logger } from './logger.js';

const UnifiedNotificationService = async ({
  userId,
  title,
  subtitle,
  type,
  reference,
  picture,
  payload,
  saveToDb = true,
}) => {
  if (!userId || !title) return null;

  const tasks = [];

  if (saveToDb) {
    tasks.push(
      NotificationModel.create({
        userId, title, subtitle, type, reference, picture,
      }).catch((err) => logger.error(`UnifiedNotificationService: failed to save notification: ${err.message}`)),
    );
  }

  tasks.push(
    (async () => {
      const user = await UserModel.findById(userId).select('deviceToken deviceType');
      if (!user?.deviceToken || !user?.deviceType) return;

      await FirebaseNotificationService({
        deviceId: user.deviceToken,
        device: user.deviceType,
        title,
        subtitle,
        type,
        reference,
        picture,
        payload,
      }).catch((err) => logger.warn(`UnifiedNotificationService: push failed for user ${userId}: ${err.message}`));
    })(),
  );

  const results = await Promise.allSettled(tasks);
  return results;
};

export default UnifiedNotificationService;
