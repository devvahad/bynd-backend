import SubscriptionModel from './schema.js';
import { ResponseUtility } from '../../utility/index.js';

export default async ({ id }) => {
  const subscription = await SubscriptionModel.findOne({
    userRef: id,
    deleted: false,
    cancelAutoRenewal: false,
  }).sort({ updatedOn: -1 });

  if (!subscription) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'No active subscription found.' });
  }

  subscription.cancelAutoRenewal = true;
  await subscription.save();

  return ResponseUtility.SUCCESS({
    message: 'Subscription auto-renewal cancelled. Premium access will continue until the end of the current period.',
    data: {
      subscriptionId: subscription._id,
      cancelAutoRenewal: subscription.cancelAutoRenewal,
      expireDate: subscription.expireDate,
    },
  });
};