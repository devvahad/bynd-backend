import { resetSessionSwipes } from './missedMatchHelper.js';
import { ResponseUtility } from '../../utility/index.js';

export default async ({ userId }) => {
  if (!userId) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing property userId.' });
  }

  await resetSessionSwipes(userId);

  return ResponseUtility.SUCCESS({
    data: { message: 'Session initialized successfully.', sessionReset: true },
  });
};
