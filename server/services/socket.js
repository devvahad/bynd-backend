import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { UserModel } from '../model/index.js';
import MessageModel from '../model/chat/messageSchema.js';
import BlockUserModel from '../model/chat/blockUserSchema.js';
import MatchModel from '../model/matches/schema.js';
import DateRequestModel from '../model/matches/dateRequestSchema.js';
import { redis } from './redis.js';
import { TokenUtility } from '../utility/index.js';
import { UnifiedNotificationService } from './unifiedNotification.js';
import { logger } from './logger.js';
import { MATCH_STATUS, DATE_REQUEST_STATUS, TYPE_OF_NOTIFICATIONS } from '../constants.js';

let io;
const activeChats = new Map();

/** Chat is disabled if either side has reported/removed the other. */
const isChatDisabledBetweenUsers = async (userAId, userBId) => {
  const [userA, userB] = await Promise.all([
    UserModel.findById(userAId).select('reportedUsers reportedBy'),
    UserModel.findById(userBId).select('reportedUsers reportedBy'),
  ]);

  if (!userA || !userB) return true;

  const aReported = userA.reportedUsers?.map(String) || [];
  const aReportedBy = userA.reportedBy?.map(String) || [];
  const bReported = userB.reportedUsers?.map(String) || [];
  const bReportedBy = userB.reportedBy?.map(String) || [];

  return aReported.includes(userBId.toString())
    || aReportedBy.includes(userBId.toString())
    || bReported.includes(userAId.toString())
    || bReportedBy.includes(userAId.toString());
};

const authorizeSocket = (socket) => {
  const authHeader = socket.handshake.headers.authorization || socket.handshake.auth?.token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  const decoded = TokenUtility.verifyTokenSafe(token);
  if (!decoded?.data?.id) {
    throw new Error('Authentication error.');
  }
  return decoded.data;
};

const markUserOnline = async (id) => {
  await UserModel.findByIdAndUpdate(id, { isOnline: true });
};

const markUserOffline = async (id) => {
  await UserModel.findByIdAndUpdate(id, { isOnline: false, lastSeen: new Date() });
};

export const StartSocket = async (server) => {
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  await Promise.all([pubClient.connect?.(), subClient.connect?.()]);

  io = new SocketIOServer(server, { cors: { origin: '*' } });
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      socket.userId = authorizeSocket(socket).id;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', async (socket) => {
    const { userId } = socket;
    if (!userId) return;

    try {
      await markUserOnline(userId);
      socket.join(userId);
      logger.info(`${userId} connected with socketId ${socket.id}`);

      const undelivered = await MessageModel.find(
        { to: userId, $or: [{ deliveredAt: { $exists: false } }, { deliveredAt: null }] },
        null,
        { sort: { sentAt: 1 } },
      );

      for (const msg of undelivered) {
        socket.emit('receive-message', msg);
        const now = new Date();
        // eslint-disable-next-line no-await-in-loop
        await MessageModel.findByIdAndUpdate(msg._id, { $set: { deliveredAt: now } });
        io.to(msg.from.toString()).emit('message-status', { messageId: msg._id, status: 'delivered', deliveredAt: now });
      }
    } catch (err) {
      logger.error(`Socket connection setup failed: ${err.message}`);
    }

    socket.on('join-chat', async ({ chatWith }) => {
      try {
        if (!chatWith) return;

        const chatDisabled = await isChatDisabledBetweenUsers(userId, chatWith);
        if (chatDisabled) {
          socket.emit('chat-error', { message: 'Chat is no longer available.' });
          return;
        }

        activeChats.set(userId, chatWith);

        const now = new Date();
        const updatedMessages = await MessageModel.updateMany(
          {
            from: chatWith, to: userId, deliveredAt: { $ne: null }, readAt: null,
          },
          { $set: { readAt: now } },
        );

        if (updatedMessages.modifiedCount > 0) {
          const unreadCount = await MessageModel.countDocuments({ from: chatWith, to: userId, readAt: null });
          io.to(userId.toString()).emit('recent-chat-update', { userId: chatWith, unreadCount });

          const readMessages = await MessageModel.find({ from: chatWith, to: userId, readAt: now });
          readMessages.forEach((msg) => {
            io.to(chatWith.toString()).emit('message-status', { messageId: msg._id, status: 'read', readAt: msg.readAt });
          });
        }
      } catch (err) {
        logger.error(`join-chat error: ${err.message}`);
      }
    });

    socket.on('leave-chat', () => {
      activeChats.delete(userId);
    });

    socket.on('send-message', async (data) => {
      try {
        const { to, message, messageType = 'text', replyTo } = data || {};

        if (!to || messageType !== 'text' || !message || typeof message !== 'string') return;

        const chatDisabled = await isChatDisabledBetweenUsers(userId, to);
        if (chatDisabled) {
          socket.emit('chat-error', { message: 'You can no longer chat with this user.' });
          return;
        }

        const blockExists = await BlockUserModel.findOne({
          $or: [{ blockedBy: userId, userRef: to }, { blockedBy: to, userRef: userId }],
        });
        if (blockExists) {
          socket.emit('chat-error', { message: 'Chat is blocked.' });
          return;
        }

        const content = message.trim();

        const matchCheck = await MatchModel.findOne({
          $or: [{ user1Ref: userId, user2Ref: to }, { user1Ref: to, user2Ref: userId }],
          deleted: false,
        });

        if (!matchCheck || matchCheck.deleted) {
          socket.emit('chat-error', { message: 'Chat is no longer available.' });
          return;
        }
        if (matchCheck.status !== MATCH_STATUS.DATE_PLANNED) {
          socket.emit('chat-error', { message: 'Chat is available only when a date is planned.' });
          return;
        }

        const dateRequest = await DateRequestModel.findOne({
          matchRef: matchCheck._id, status: DATE_REQUEST_STATUS.ACCEPTED, deleted: false,
        });
        if (!dateRequest) {
          socket.emit('chat-error', { message: 'Chat is not available for this date.' });
          return;
        }

        const dateTime = new Date(dateRequest.dateTime);
        const chatStartTime = new Date(dateTime);
        chatStartTime.setHours(chatStartTime.getHours() - 24);
        const chatEndTime = new Date(dateTime);
        chatEndTime.setHours(chatEndTime.getHours() + 24);

        const now = new Date();
        if (now < chatStartTime || now > chatEndTime) {
          socket.emit('chat-error', { message: 'Chat is only available 24 hours before and after the date.' });
          return;
        }

        const recipient = await UserModel.findOne({ _id: to });
        if (!recipient) return;

        const newMessage = await MessageModel.create({
          from: userId, to, content, messageType, sentAt: now, replyTo: replyTo || null,
        });

        const sender = await UserModel.findOne({ _id: userId }, { firstName: 1, photos: 1 });
        if (sender) {
          UnifiedNotificationService({
            userId: to,
            title: 'New Message',
            subtitle: `${sender.firstName} sent you a message.`,
            type: TYPE_OF_NOTIFICATIONS.MESSAGE,
            reference: newMessage._id.toString(),
            payload: { event: 'NEW_MESSAGE', sourceRef: userId },
          }).catch(() => {});
        }

        const updates = {};
        if (recipient.isOnline) {
          updates.deliveredAt = new Date();
          const activeWith = activeChats.get(to);
          if (activeWith && activeWith.toString() === userId.toString()) {
            updates.readAt = new Date();
          } else if (sender) {
            const unreadCount = await MessageModel.countDocuments({ from: userId, to, readAt: null });
            io.to(to.toString()).emit('recent-chat-update', {
              userId,
              firstName: sender.firstName || '',
              picture: sender.photos?.length ? sender.photos[0] : null,
              lastMessage: content,
              lastMessageId: newMessage._id,
              messageType,
              lastMessageTime: new Date(),
              lastMessageFrom: userId,
              unreadCount,
              isSeen: false,
              isDelivered: true,
            });
          }
        }

        if (Object.keys(updates).length > 0) {
          await MessageModel.findByIdAndUpdate(newMessage._id, { $set: updates });
        }

        const populatedMessage = await MessageModel.findById(newMessage._id)
          .select('content from messageType replyTo sentAt deliveredAt readAt')
          .populate({ path: 'replyTo', select: 'content from messageType' })
          .lean();

        const response = {
          ...populatedMessage,
          replyToMessage: populatedMessage.replyTo || null,
          isSeen: !!populatedMessage.readAt,
          isDelivered: !!populatedMessage.deliveredAt,
          lastMessageTime: populatedMessage.readAt || populatedMessage.deliveredAt || populatedMessage.sentAt,
        };
        delete response.replyTo;

        io.to(to.toString()).emit('receive-message', response);
        io.to(userId.toString()).emit('receive-message', response);

        if (updates.deliveredAt) {
          io.to(userId.toString()).emit('message-status', { messageId: newMessage._id, status: 'delivered', deliveredAt: updates.deliveredAt });
        }
        if (updates.readAt) {
          io.to(userId.toString()).emit('message-status', { messageId: newMessage._id, status: 'read', readAt: updates.readAt });
        }
      } catch (err) {
        logger.error(`send-message error: ${err.message}`);
      }
    });

    socket.on('disconnect', async () => {
      try {
        await markUserOffline(userId);
      } catch (err) {
        logger.error(`disconnect handler error: ${err.message}`);
      } finally {
        activeChats.delete(userId);
      }
    });
  });

  return io;
};

export default { StartSocket };
