import FaqModel from '../../model/faq/index.js';
import NotificationModel from '../../model/notification/index.js';
import { UserModel } from '../../model/index.js';
import { ResponseUtility, SchemaMapperUtility } from '../../utility/index.js';
import { FirebaseNotificationService } from '../../services/index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

export const AddFaqResolver = async (req, res) => {
  try {
    const { question, answer, order } = req.body;

    if (!question || !answer) {
      return res.json(
        ResponseUtility.MISSING_PROPS({
          message: `Missing property ${question ? 'answer' : 'question'}.`,
        }),
      );
    }

    const faq = await FaqModel.create({ question, answer, order });
    return res.json(ResponseUtility.SUCCESS({ data: faq }));
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ListFaqResolver = async (req, res) => {
  try {
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? String(DEFAULT_PAGE_LIMIT), 10);
    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      FaqModel.find({ isDeleted: false, isActive: true }, { __v: 0 })
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit + 1),
      FaqModel.countDocuments({ isDeleted: false, isActive: true }),
    ]);

    return res.json(
      ResponseUtility.SUCCESS({
        data: { list, total, page, limit, size: list.length, hasMore: list.length === limit },
      }),
    );
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UpdateFaqResolver = async (req, res) => {
  try {
    const { id, ...rest } = req.body;

    if (!id) {
      return res.json(ResponseUtility.MISSING_PROPS({ message: 'Missing property id.' }));
    }
    if (!rest.question && !rest.answer && rest.order === undefined && rest.isActive === undefined) {
      return res.json(
        ResponseUtility.MISSING_PROPS({ message: 'Provide at least one field to update.' }),
      );
    }

    const updates = await SchemaMapperUtility(rest);
    const faq = await FaqModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updates,
      { new: true },
    );

    if (!faq) {
      return res.json(ResponseUtility.NO_USER({ message: 'FAQ not found.' }));
    }

    return res.json(ResponseUtility.SUCCESS({ data: faq }));
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const DeleteFaqResolver = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.json(ResponseUtility.MISSING_PROPS({ message: 'Missing property id.' }));
    }

    await FaqModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true });
    return res.json(ResponseUtility.SUCCESS({ message: 'FAQ deleted successfully.' }));
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ListNotificationResolver = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? String(DEFAULT_PAGE_LIMIT), 10);
    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      NotificationModel.find({ userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1),
      NotificationModel.countDocuments({ userId, isDeleted: false }),
    ]);

    await NotificationModel.updateMany(
      { userId, isRead: false, isDeleted: false },
      { isRead: true },
    );

    return res.json(
      ResponseUtility.SUCCESS({
        data: { list, total, page, limit, size: list.length, hasMore: list.length === limit },
      }),
    );
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const BroadcastResolver = async (req, res) => {
  try {
    const { title, subtitle, type, picture, userIds = [] } = req.body;

    if (!title) {
      return res.json(ResponseUtility.MISSING_PROPS({ message: 'Missing property title.' }));
    }

    const query = {
      isDeleted: false,
      blocked: false,
      deviceToken: { $nin: [null, ''] },
      deviceType: { $exists: true },
    };

    if (userIds.length) {
      query._id = { $in: userIds };
    }

    const users = await UserModel.find(query).select('_id deviceToken deviceType');

    if (!users.length) {
      return res.json(
        ResponseUtility.GENERIC_ERR({ message: 'No eligible users found for notification.' }),
      );
    }

    const [notifDocs] = await Promise.all([
      NotificationModel.insertMany(
        users.map((u) => ({
          userId: u._id,
          title,
          subtitle,
          type,
          picture,
          isBroadcast: true,
        })),
      ),
      Promise.allSettled(
        users.map((u) =>
          FirebaseNotificationService({
            deviceId: u.deviceToken,
            device: u.deviceType,
            title,
            subtitle,
            type,
            picture,
          }),
        ),
      ),
    ]);

    return res.json(
      ResponseUtility.SUCCESS({
        message: 'Broadcast sent successfully.',
        data: { sent: notifDocs.length },
      }),
    );
  } catch (err) {
    return res.json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};