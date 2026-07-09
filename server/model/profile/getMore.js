import { UserModel } from '../index.js';
import PromptModel from '../prompt/index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MAX_PROFILE_PERCENTAGE, PROFILE_COMPLETENESS_RULES, PREMIUM_FEATURE_DEFINITIONS } from '../../constants.js';

const calculateProfilePercentage = (user, promptsCount) => {
  const ctx = { promptsCount };
  const total = PROFILE_COMPLETENESS_RULES.reduce((sum, rule) => (rule.test(user, ctx) ? sum + rule.weight : sum), 0);
  return Math.min(total, MAX_PROFILE_PERCENTAGE);
};

const buildPremiumFeatures = () =>
  PREMIUM_FEATURE_DEFINITIONS.map(({ icon, title }) => ({ icon, title, description: 'Active', enabled: true }));

const buildFreeBenefits = () =>
  PREMIUM_FEATURE_DEFINITIONS.map(({ icon, title, lockedDescription }) => ({
    icon,
    title,
    description: lockedDescription,
    locked: true,
  }));

const buildFeaturesSection = (isPremium) =>
  isPremium
    ? { planType: 'Bynd+', features: buildPremiumFeatures() }
    : {
      upgradeMessage: 'Upgrade to Bynd+ to unlock premium features',
      benefits: buildFreeBenefits(),
      upgradeButton: { text: 'Upgrade Now', action: 'navigate_to_subscription' },
    };

export default async ({ userId }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId'],
    sourceDocument: { userId },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, blocked: false, deleted: false }).lean();

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    const promptsCount = await PromptModel.countDocuments({ userRef: userId, deleted: false });
    const profilePercentage = calculateProfilePercentage(user, promptsCount);

    const responseData = {
      profile: {
        firstName: user.firstName,
        picture: user.photos?.[0]?.url ?? null,
        verified: user.verified || false,
        profilePercentage,
        age: user.age,
      },
      subscription: {
        isPremium: Boolean(user.isPremium),
        subscriptionType: user.isPremium ? 'premium' : 'free',
      },
      features: buildFeaturesSection(user.isPremium),
    };

    return ResponseUtility.SUCCESS({ data: responseData, message: 'Get More data retrieved successfully.' });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};