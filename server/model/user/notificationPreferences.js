import UserModel from './index.js';
import { ResponseUtility } from '../../utility/index.js';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_CHANNELS } from '../../constants.js';

const getCapabilities = (user) => ({
  canReceivePush: !!(user.device && user.fcmToken),
  canReceiveEmail: !!user.email,
  canReceiveSMS: !!user.phoneNumber,
});

const GetNotificationPreferences = async ({ id }) => {
  const user = await UserModel.findOne({ _id: id, blocked: false, deleted: false }).select(
    'notificationPreferences email phoneNumber device fcmToken',
  );

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  const capabilities = getCapabilities(user);

  return ResponseUtility.SUCCESS({
    data: {
      preferences: user.notificationPreferences || {},
      capabilities,
      contactInfo: {
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        pushEnabled: capabilities.canReceivePush,
      },
    },
  });
};

const UpdateNotificationPreference = async ({ id, category, channel, enabled }) => {
  const validCategories = Object.values(NOTIFICATION_CATEGORIES);
  const validChannels = Object.values(NOTIFICATION_CHANNELS);

  if (!validCategories.includes(category)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
    });
  }

  if (!validChannels.includes(channel)) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
    });
  }

  if (typeof enabled !== 'boolean') {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'enabled must be a boolean value.' });
  }

  const user = await UserModel.findOne({ _id: id, blocked: false, deleted: false }).select(
    'email phoneNumber device fcmToken',
  );

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  if (channel === NOTIFICATION_CHANNELS.EMAIL && !user.email) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Email notifications require an email address.' });
  }

  if (channel === NOTIFICATION_CHANNELS.SMS && !user.phoneNumber) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'SMS notifications require a phone number.' });
  }

  if (channel === NOTIFICATION_CHANNELS.PUSH && (!user.device || !user.fcmToken)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Push notifications require device permissions.' });
  }

  const updateObject = { [`notificationPreferences.${category}.${channel}`]: enabled, updatedOn: new Date() };

  if (category === NOTIFICATION_CATEGORIES.FIRST_DATE_REMINDERS && channel === NOTIFICATION_CHANNELS.EMAIL) {
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.DATE_CONFIRMATIONS}.email`] = enabled;
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.DATE_CANCELLATIONS}.email`] = enabled;
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.MESSAGES}.email`] = enabled;
  }

  if (category === NOTIFICATION_CATEGORIES.NEW_DATE_REQUESTS && channel === NOTIFICATION_CHANNELS.EMAIL) {
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.DATE_RESCHEDULES}.email`] = enabled;
  }

  if (category === NOTIFICATION_CATEGORIES.FIRST_DATE_REMINDERS && channel === NOTIFICATION_CHANNELS.PUSH) {
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.DATE_CONFIRMATIONS}.push`] = enabled;
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.DATE_CANCELLATIONS}.push`] = enabled;
  }

  if (category === NOTIFICATION_CATEGORIES.NEW_DATE_REQUESTS && channel === NOTIFICATION_CHANNELS.PUSH) {
    updateObject[`notificationPreferences.${NOTIFICATION_CATEGORIES.DATE_RESCHEDULES}.push`] = enabled;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(id, { $set: updateObject }, { new: true }).select(
    'notificationPreferences',
  );

  return ResponseUtility.SUCCESS({
    message: 'Notification preference updated successfully.',
    data: { category, channel, enabled, allPreferences: updatedUser.notificationPreferences },
  });
};

const setAllChannels = async ({ id, value }) => {
  const user = await UserModel.findOne({ _id: id, blocked: false, deleted: false }).select(
    'email phoneNumber device fcmToken',
  );

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  const capabilities = getCapabilities(user);
  const updateObject = { updatedOn: new Date() };

  Object.values(NOTIFICATION_CATEGORIES).forEach((category) => {
    updateObject[`notificationPreferences.${category}.push`] = value && capabilities.canReceivePush;
    updateObject[`notificationPreferences.${category}.email`] = value && capabilities.canReceiveEmail;
    updateObject[`notificationPreferences.${category}.sms`] = value && capabilities.canReceiveSMS;
  });

  const updatedUser = await UserModel.findByIdAndUpdate(id, { $set: updateObject }, { new: true }).select(
    'notificationPreferences',
  );

  return updatedUser;
};

const EnableAllNotifications = async ({ id }) => {
  const updatedUser = await setAllChannels({ id, value: true });
  return ResponseUtility.SUCCESS({
    message: 'All available notifications have been enabled.',
    data: { preferences: updatedUser.notificationPreferences },
  });
};

const DisableAllNotifications = async ({ id }) => {
  const updatedUser = await setAllChannels({ id, value: false });
  return ResponseUtility.SUCCESS({
    message: 'All notifications have been disabled.',
    data: { preferences: updatedUser.notificationPreferences },
  });
};

const setChannel = async ({ id, channel, value }) => {
  const validChannels = Object.values(NOTIFICATION_CHANNELS);

  if (!validChannels.includes(channel)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid notification channel.' });
  }

  const user = await UserModel.findOne({ _id: id, blocked: false, deleted: false }).select(
    'email phoneNumber device fcmToken',
  );

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  if (value) {
    if (channel === NOTIFICATION_CHANNELS.EMAIL && !user.email) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Email notifications require an email address.' });
    }
    if (channel === NOTIFICATION_CHANNELS.SMS && !user.phoneNumber) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'SMS notifications require a phone number.' });
    }
    if (channel === NOTIFICATION_CHANNELS.PUSH && (!user.device || !user.fcmToken)) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Push notifications require device permissions.' });
    }
  }

  const updateObject = { updatedOn: new Date() };
  Object.values(NOTIFICATION_CATEGORIES).forEach((category) => {
    updateObject[`notificationPreferences.${category}.${channel}`] = value;
  });

  await UserModel.findByIdAndUpdate(id, { $set: updateObject });

  return channel;
};

const EnableAllByChannel = async ({ id, channel }) => {
  const resolvedChannel = await setChannel({ id, channel, value: true });
  return ResponseUtility.SUCCESS({ message: `All ${resolvedChannel} notifications enabled.` });
};

const DisableAllByChannel = async ({ id, channel }) => {
  const resolvedChannel = await setChannel({ id, channel, value: false });
  return ResponseUtility.SUCCESS({ message: `All ${resolvedChannel} notifications disabled.` });
};

const ACTION_HANDLERS = new Map([
  ['GET', GetNotificationPreferences],
  ['UPDATE', UpdateNotificationPreference],
  ['ENABLE_ALL', EnableAllNotifications],
  ['DISABLE_ALL', DisableAllNotifications],
  ['ENABLE_ALL_BY_CHANNEL', EnableAllByChannel],
  ['DISABLE_ALL_BY_CHANNEL', DisableAllByChannel],
]);

export default async ({ id, action, category, channel, enabled }) => {
  const handler = ACTION_HANDLERS.get(action);

  if (!handler) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid notification preference action.' });
  }

  return handler({ id, category, channel, enabled });
};