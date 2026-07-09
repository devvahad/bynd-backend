import { ResponseUtility } from '../../utility/index.js';
import { Types } from 'mongoose';
import { UserModel } from '../index.js';
import { TYPE_OF_NOTIFICATIONS } from '../../constants.js';
import { FirebaseNotificationService } from '../../services/index.js';

export default async ({ message, userIds = [] }) => {
  if (!message) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property message' });
  }

  if (!Array.isArray(userIds)) {
    throw ResponseUtility.MISSING_PROPS({ message: 'userIds must be an array' });
  }

  let objectIds = [];
  if (userIds.length) {
    const invalidIds = userIds.filter(id => !Types.ObjectId.isValid(id));
    if (invalidIds.length) {
      throw ResponseUtility.MISSING_PROPS({ message: `Invalid userIds: ${invalidIds.join(', ')}` });
    }
    objectIds = userIds.map(id => new Types.ObjectId(id));
  }

  try {
    const lookupQuery = {
      deleted: false,
      blocked: false,
      fcmToken: { $nin: ['', null] },
      device: { $nin: ['', null] },
    };

    if (objectIds.length) {
      lookupQuery._id = { $in: objectIds };
    }

    const userList = await UserModel.find(lookupQuery, { fcmToken: 1 }).lean();
    const deviceTokens = userList.map(user => user.fcmToken);

    if (!deviceTokens.length) {
      throw ResponseUtility.GENERIC_ERR({ message: 'No valid users present for notifications' });
    }

    await FirebaseNotificationService({
      deviceTokens,
      payload: {
        type: TYPE_OF_NOTIFICATIONS.ADMIN,
      },
      body: message,
    });

    return ResponseUtility.SUCCESS({ message: 'All Notifications were sent successfully' });
  } catch (err) {
    if (err?.message === 'No valid users present for notifications') {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ error: err, message: err.message });
  }
};
