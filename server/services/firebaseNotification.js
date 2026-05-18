import admin from 'firebase-admin';
import ResponseUtility from '../utility/response.js';

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const messaging = admin.messaging();

const FirebaseNotificationService = ({
  deviceId,
  device,
  title,
  subtitle,
  reference,
  type,
  picture,
  payload,
  sound = 'default',
}) =>
  new Promise(async (resolve, reject) => {
    if (!deviceId || !title || !device) {
      return reject(
        ResponseUtility.MISSING_PROPS({ message: 'deviceId, device and title are required.' }),
      );
    }

    const data = {
      ...(subtitle && { subtitle }),
      ...(reference && { reference: String(reference) }),
      ...(type !== undefined && { type: String(type) }),
      ...(picture && { picture }),
      ...(payload && { payload: JSON.stringify(payload) }),
    };

    const message = {
      token: deviceId,
      data,
      notification: { title, body: subtitle ?? '' },
      ...(device.toLowerCase() === 'ios'
        ? { apns: { payload: { aps: { sound, badge: 1 } } } }
        : { android: { priority: 'high', notification: { sound } } }),
    };

    try {
      const response = await messaging.send(message);
      return resolve(ResponseUtility.SUCCESS({ message: 'Notification sent.', data: response }));
    } catch (err) {
      return reject(
        ResponseUtility.GENERIC_ERR({ message: 'Error sending push notification.', error: err }),
      );
    }
  });

export default FirebaseNotificationService;