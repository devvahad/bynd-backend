import { UserModel } from '../index.js';
import SubscriptionModel from './schema.js';
import SubscriptionConfigModel from './configSchema.js';
import TransactionModel from './transactionSchema.js';
import validateiOSReceipt, { extractiOSTransactionDetails, APPLE_RECEIPT_STATUS_MESSAGES } from './appleReceiptValidation.js';
import { ResponseUtility } from '../../utility/index.js';
import { AndroidSubscriptionService } from '../../services/index.js';
import { SUBSCRIPTION_TYPE, DEVICE_TYPES } from '../../constants.js';

export default async ({
  id,
  receiptId,
  device = DEVICE_TYPES.ANDROID,
  purchaseToken,
  subscriptionType = SUBSCRIPTION_TYPE.ONE_MONTH,
  packageName = 'com.app.twyned',
  productId,
}) => {
  if (!id || !device || !subscriptionType || !packageName || !productId) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Missing required parameters' });
  }

  if (device === DEVICE_TYPES.ANDROID && !purchaseToken) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Purchase token is required for Android' });
  }
  if (device === DEVICE_TYPES.IOS && !receiptId) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Receipt ID is required for iOS' });
  }

  const activeSubscription = await SubscriptionModel.findOne({
    userRef: id, deleted: false, expireDate: { $gt: new Date() },
  }).sort({ updatedOn: -1 });

  if (activeSubscription) {
    throw ResponseUtility.GENERIC_ERR({ code: 409, httpStatus: 409, message: 'You already have an active subscription.' });
  }

  const credsInfo = await SubscriptionConfigModel.findOne();
  if (!credsInfo) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Subscription configuration not found' });
  }

  let iapValidation;
  let expireDate;
  let transactionId;
  let originalTransactionId;
  let updateQuery = {};

  if (device === DEVICE_TYPES.IOS) {
    if (!credsInfo.ios) {
      throw ResponseUtility.GENERIC_ERR({ message: 'iOS shared secret not configured' });
    }

    iapValidation = await validateiOSReceipt(receiptId, credsInfo.ios);

    if (iapValidation.status !== 0) {
      const errorMessage = APPLE_RECEIPT_STATUS_MESSAGES[iapValidation.status]
        || `Receipt validation failed with status: ${iapValidation.status}`;
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: errorMessage });
    }

    const transactionDetails = extractiOSTransactionDetails(iapValidation, productId);
    if (!transactionDetails) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: `No valid transaction found for product: ${productId}` });
    }

    ({ expireDate, transactionId, originalTransactionId } = transactionDetails);

    if (originalTransactionId) {
      const existingOwnership = await SubscriptionModel.findOne({
        userRef: { $ne: id },
        device: DEVICE_TYPES.IOS,
        deleted: false,
        $or: [{ originalTransactionId }, { transactionId: originalTransactionId }],
      });

      if (existingOwnership) {
        throw ResponseUtility.GENERIC_ERR({ code: 409, httpStatus: 409, message: 'This App Store subscription is already linked to another account.' });
      }
    }
  } else if (device === DEVICE_TYPES.ANDROID) {
    if (!credsInfo.android) {
      throw ResponseUtility.GENERIC_ERR({ message: 'Android credentials not configured' });
    }

    const receipt = { packageName, token: purchaseToken, subscriptionId: productId };
    const response = await AndroidSubscriptionService(receipt, credsInfo.android);

    if (response.status !== 200) {
      throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid subscription or verification failed.' });
    }

    iapValidation = response.data;

    if (response.data.lineItems && response.data.lineItems.length > 0) {
      expireDate = new Date(response.data.lineItems[0].expiryTime);
    } else {
      expireDate = new Date(Number(response.data.expiryTimeMillis));
    }
    transactionId = purchaseToken;
    updateQuery = { purchaseToken };
  } else {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: "Invalid device type. Must be 'ios' or 'android'" });
  }

  if (!expireDate || expireDate <= new Date()) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'This subscription has already expired' });
  }

  if (Object.keys(updateQuery).length > 0) {
    await UserModel.updateOne({ _id: id }, updateQuery);
  }

  const existingSubscription = await SubscriptionModel.findOne({
    userRef: id, type: subscriptionType, deleted: false,
  }).sort({ updatedOn: -1 });

  let subscriptionDoc;
  const commonFields = {
    transactionId: device === DEVICE_TYPES.IOS ? transactionId : purchaseToken,
    originalTransactionId: device === DEVICE_TYPES.IOS ? originalTransactionId : null,
    response: iapValidation,
    productId,
    device,
    expireDate,
    lastPayment: new Date(),
    cancelAutoRenewal: false,
    deleted: false,
  };

  if (existingSubscription) {
    subscriptionDoc = await SubscriptionModel.findOneAndUpdate(
      { _id: existingSubscription._id },
      commonFields,
      { new: true },
    );
  } else {
    subscriptionDoc = await SubscriptionModel.create({ ...commonFields, userRef: id, type: subscriptionType });
  }

  await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    { isPremium: true, subscriptionExpired: false },
  );

  await TransactionModel.create({
    userRef: id,
    subscriptionRef: subscriptionDoc._id,
    type: subscriptionType,
    expireAt: expireDate,
    device,
    productId,
    transactionId: device === DEVICE_TYPES.IOS ? transactionId : purchaseToken,
    originalTransactionId: device === DEVICE_TYPES.IOS ? originalTransactionId : null,
  });

  return ResponseUtility.SUCCESS({
    message: 'Subscription purchased successfully',
    data: {
      subscriptionId: subscriptionDoc._id,
      expireDate,
      type: subscriptionType,
      device,
      environment: iapValidation.environment,
    },
  });
};
