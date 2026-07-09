import { NotificationModel, UserModel } from '../model/index.js';
import { ResponseUtility } from '../utility/index.js';
import { FirebaseNotificationService } from '../services/index.js';
import { PAGINATION_LIMIT } from '../constants.js';

export const BroadcastNotificationController = async (req, res) => {
  try {
    const { title, subtitle, type, picture } = req.body;

    const users = await UserModel.find(
      { isDeleted: false, isActive: true, deviceToken: { $exists: true, $ne: null } },
      { deviceToken: 1, deviceType: 1 },
    );

    const sends = users.map((u) =>
      FirebaseNotificationService({
        deviceId: u.deviceToken,
        device: u.deviceType ?? 'android',
        title,
        subtitle,
        type,
        picture,
      }).catch(() => null)
    );

    const notification = await NotificationModel.create({
      title,
      subtitle,
      type,
      picture,
      isBroadcast: true,
    });

    await Promise.allSettled(sends);

    return res.json(ResponseUtility.SUCCESS({ data: { notification, sentTo: users.length } }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ListNotificationsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? String(PAGINATION_LIMIT), 10);

    const notifications = await NotificationModel.find({
      $or: [{ userId: req.user._id }, { isBroadcast: true }],
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1);

    return res.json(ResponseUtility.SUCCESS_PAGINATION({ data: notifications, page, limit }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};