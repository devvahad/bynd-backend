import { UserModel } from '../index.js';
import SubscriptionModel from './schema.js';
import SubscriptionConfigModel from './configSchema.js';
import validateiOSReceipt, { extractiOSTransactionDetails } from './appleReceiptValidation.js';
import { ResponseUtility } from '../../utility/index.js';
import { AndroidSubscriptionService } from '../../services/index.js';
import { DEVICE_TYPES } from '../../constants.js';

export default async ({
  id, receiptId, device = DEVICE_TYPES.ANDROID, purchaseToken, packageName = 'com.app.twyned',
}) => {
  const user = await UserModel.findOne({ _id: id, deleted: false, blocked: false });
  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, httpStatus: 404, message: 'User not found or account is blocked' });
  }

  const latestSubscription = await SubscriptionModel.findOne({ userRef: id, deleted: false }).sort({ updatedOn: -1 });

  if (!latestSubscription) {
    return ResponseUtility.SUCCESS({
      message: 'Nothing to restore',
      data: { hasSubscription: false, status: 'NO_SUBSCRIPTION' },
    });
  }

  const credsInfo = await SubscriptionConfigModel.findOne();
  let iapValidation;
  let expireDate;
  let isActive = false;
  let { productId } = latestSubscription;
  const now = new Date();

  if (device === DEVICE_TYPES.IOS || latestSubscription.device === DEVICE_TYPES.IOS) {
    const iosReceiptId = receiptId || latestSubscription.transactionId;

    if (!iosReceiptId) {
      throw ResponseUtility.GENERIC_ERR({ message: 'iOS receipt ID is required for restoration' });
    }
    if (!credsInfo?.ios) {
      throw ResponseUtility.GENERIC_ERR({ message: 'iOS shared secret not configured' });
    }

    iapValidation = await validateiOSReceipt(iosReceiptId, credsInfo.ios);

    if (iapValidation.status !== 0) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid iOS receipt. Unable to restore subscription.' });
    }

    const transactionDetails = extractiOSTransactionDetails(iapValidation, productId);
    if (!transactionDetails) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid iOS receipt. Unable to restore subscription.' });
    }

    ({ expireDate, productId } = transactionDetails);
    isActive = expireDate > now;

    await SubscriptionModel.findByIdAndUpdate(latestSubscription._id, {
      transactionId: iosReceiptId,
      response: iapValidation,
      productId,
      device: DEVICE_TYPES.IOS,
      expireDate,
      cancelAutoRenewal: iapValidation.pending_renewal_info?.[0]?.auto_renew_status === '0',
    });
  } else if (device === DEVICE_TYPES.ANDROID || latestSubscription.device === DEVICE_TYPES.ANDROID) {
    const androidToken = purchaseToken || latestSubscription.transactionId;

    if (!androidToken || !latestSubscription.productId) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Purchase token and product ID are required for Android restoration' });
    }
    if (!credsInfo?.android) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Android credentials not configured' });
    }

    const receipt = { packageName, token: androidToken, subscriptionId: latestSubscription.productId };
    const response = await AndroidSubscriptionService(receipt, credsInfo.android);

    if (response.status !== 200) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid Android subscription. Unable to restore subscription.' });
    }

    iapValidation = response.data;
    expireDate = new Date(Number(response.data.expiryTimeMillis));
    isActive = expireDate > now;

    await SubscriptionModel.findByIdAndUpdate(latestSubscription._id, {
      transactionId: androidToken,
      response: iapValidation,
      productId: latestSubscription.productId,
      device: DEVICE_TYPES.ANDROID,
      expireDate,
      cancelAutoRenewal: !response.data.autoRenewing,
    });
  }

  await UserModel.findByIdAndUpdate(id, { $set: { isPremium: isActive, subscriptionExpired: !isActive } });

  const subscriptionData = {
    hasSubscription: true,
    isActive,
    subscriptionType: latestSubscription.type,
    expireDate,
    lastPayment: latestSubscription.lastPayment,
    cancelAutoRenewal: latestSubscription.cancelAutoRenewal,
    device: latestSubscription.device,
    productId,
  };

  if (isActive) {
    return ResponseUtility.SUCCESS({
      message: 'Subscription restored successfully',
      data: { ...subscriptionData, status: 'ACTIVE', message: 'Your subscription is currently active' },
    });
  }

  return ResponseUtility.SUCCESS({
    message: 'Subscription found but not active',
    data: {
      ...subscriptionData,
      status: 'EXPIRED_OR_CANCELED',
      message: 'Your subscription has expired or been canceled. Please renew from the app store or play store, or view other plans.',
    },
  });
};
