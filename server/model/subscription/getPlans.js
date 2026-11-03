import { ResponseUtility } from '../../utility/index.js';
import { SUBSCRIPTION_TYPE, SUBSCRIPTION_RATE } from '../../constants.js';

const PLAN_LABELS = {
  [SUBSCRIPTION_TYPE.ONE_WEEK]: { label: '1 Week', rate: SUBSCRIPTION_RATE.ONE_WEEK_RATE },
  [SUBSCRIPTION_TYPE.ONE_MONTH]: { label: '1 Month', rate: SUBSCRIPTION_RATE.ONE_MONTH_RATE },
  [SUBSCRIPTION_TYPE.THREE_MONTH]: { label: '3 Months', rate: SUBSCRIPTION_RATE.THREE_MONTH_RATE },
  [SUBSCRIPTION_TYPE.SIX_MONTH]: { label: '6 Months', rate: SUBSCRIPTION_RATE.SIX_MONTH_RATE },
};

export default async () => ResponseUtility.SUCCESS({
  data: {
    plans: Object.entries(PLAN_LABELS).map(([type, { label, rate }]) => ({
      type: Number(type),
      label,
      rate,
    })),
  },
});