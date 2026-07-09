import { logger } from './logger.js';
import admin from 'firebase-admin';
import { ResponseUtility } from '../utility/index.js';

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

const REQUIRED_ENV_VARS = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const VALID_DEVICES = new Set(['ios', 'android']);
const INVALID_TOKEN_ERROR_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);

function assertEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

let messaging;

function getMessaging() {
  if (messaging) return messaging;

  assertEnv();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  messaging = admin.messaging();
  return messaging;
}

function buildMessage({ deviceId, device, title, subtitle, reference, type, picture, payload, sound }) {
  const data = {
    ...(subtitle && { subtitle }),
    ...(reference !== undefined && { reference: String(reference) }),
    ...(type !== undefined && { type: String(type) }),
    ...(picture && { picture }),
    ...(payload && { payload: JSON.stringify(payload) }),
  };

  const normalizedDevice = device.toLowerCase();

  return {
    token: deviceId,
    data,
    notification: {
      title,
      ...(subtitle && { body: subtitle }),
      ...(picture && { imageUrl: picture }),
    },
    ...(normalizedDevice === 'ios'
      ? {
        apns: {
          payload: { aps: { sound, badge: 1, 'mutable-content': 1 } },
          ...(picture && { fcmOptions: { imageUrl: picture } }),
        },
      }
      : {
        android: {
          priority: 'high',
          notification: { sound, ...(picture && { imageUrl: picture }) },
        },
      }),
  };
}

async function FirebaseNotificationService({
  deviceId,
  device,
  title,
  subtitle,
  reference,
  type,
  picture,
  payload,
  sound = 'default',
}) {
  if (!deviceId || !title || !device) {
    throw ResponseUtility.MISSING_PROPS({ message: 'deviceId, device and title are required.' });
  }

  if (!VALID_DEVICES.has(device.toLowerCase())) {
    throw ResponseUtility.MISSING_PROPS({ message: 'device must be either "ios" or "android".' });
  }

  const message = buildMessage({ deviceId, device, title, subtitle, reference, type, picture, payload, sound });

  try {
    const client = getMessaging();
    const response = await client.send(message);
    return ResponseUtility.SUCCESS({ message: 'Notification sent.', data: response });
  } catch (error) {
    logger.error('FirebaseNotificationService send error', { deviceId, error: error.message });

    if (INVALID_TOKEN_ERROR_CODES.has(error.code)) {
      throw ResponseUtility.GENERIC_ERR({
        message: 'Device token is invalid or no longer registered.',
        error,
        code: 'INVALID_DEVICE_TOKEN',
      });
    }

    throw ResponseUtility.GENERIC_ERR({ message: 'Error sending push notification.', error });
  }
}

export default FirebaseNotificationService;