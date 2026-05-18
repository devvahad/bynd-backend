import { getQueue, QUEUES } from '../index.js';
import { EmailServices } from '../../services/index.js';
import { FirebaseNotificationService } from '../../services/index.js';
import { logger } from '../../services/logger.js';

export const registerProcessors = () => {

  const emailQueue = getQueue(QUEUES.EMAIL);
  emailQueue.process(async (job) => {
    const { to, subject, text } = job.data;
    await EmailServices({ to, subject, text });
    logger.info(`Email sent to ${to}`);
  });

  const notifQueue = getQueue(QUEUES.NOTIFICATION);
  notifQueue.process(async (job) => {
    const { deviceId, device, title, subtitle, type } = job.data;
    await FirebaseNotificationService({ deviceId, device, title, subtitle, type });
    logger.info(`Notification sent to device ${deviceId}`);
  });

  logger.info('Queue processors registered.');
};