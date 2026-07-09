import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE } from '../../constants.js';

export default async ({
  id,
  lookingFor,
  drinkingHabits,
  smokingHabits,
  skipLookingFor = false,
  skipDrinkingHabits = false,
  skipSmokingHabits = false,
}) => {
  if (!id) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User ID missing from authentication context.' });
  }

  const resolvedLookingFor = skipLookingFor ? '' : lookingFor;
  const resolvedDrinkingHabits = skipDrinkingHabits ? '' : drinkingHabits;
  const resolvedSmokingHabits = skipSmokingHabits ? '' : smokingHabits;

  if (!skipLookingFor && (!resolvedLookingFor || !resolvedLookingFor.trim())) {
    throw ResponseUtility.MISSING_PROPS({
      message: "Please select what you're looking for or choose skip.",
    });
  }

  if (!skipDrinkingHabits && (!resolvedDrinkingHabits || !resolvedDrinkingHabits.trim())) {
    throw ResponseUtility.MISSING_PROPS({
      message: 'Please select your drinking habits or choose skip.',
    });
  }

  if (!skipSmokingHabits && (!resolvedSmokingHabits || !resolvedSmokingHabits.trim())) {
    throw ResponseUtility.MISSING_PROPS({
      message: 'Please select your smoking habits or choose skip.',
    });
  }

  const { code, message } = await PropsValidationUtility({
    validProps: [
      'lookingFor',
      'drinkingHabits',
      'smokingHabits',
      'skipLookingFor',
      'skipDrinkingHabits',
      'skipSmokingHabits',
    ],
    sourceDocument: {
      lookingFor: resolvedLookingFor,
      drinkingHabits: resolvedDrinkingHabits,
      smokingHabits: resolvedSmokingHabits,
      skipLookingFor,
      skipDrinkingHabits,
      skipSmokingHabits,
    },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const incrementProgress =
    (skipLookingFor || resolvedLookingFor ? 4 : 0) +
    (skipDrinkingHabits || resolvedDrinkingHabits ? 4 : 0) +
    (skipSmokingHabits || resolvedSmokingHabits ? 4 : 0);

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: id, deleted: false },
    {
      $set: {
        lookingFor: resolvedLookingFor,
        drinkingHabits: resolvedDrinkingHabits,
        smokingHabits: resolvedSmokingHabits,
        skipLookingFor,
        skipDrinkingHabits,
        skipSmokingHabits,
        lastUpdatedAt: new Date(),
      },
      $inc: { profileProgress: incrementProgress },
    },
    { new: true, strict: false },
  ).select(
    'lookingFor drinkingHabits smokingHabits skipLookingFor skipDrinkingHabits skipSmokingHabits profileProgress',
  );

  if (!updatedUser) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  return ResponseUtility.SUCCESS({
    message: 'Relationship, drinking, and smoking preferences updated successfully.',
    data: {
      userId: id,
      lookingFor: updatedUser.lookingFor,
      drinkingHabits: updatedUser.drinkingHabits,
      smokingHabits: updatedUser.smokingHabits,
      skipLookingFor: updatedUser.skipLookingFor,
      skipDrinkingHabits: updatedUser.skipDrinkingHabits,
      skipSmokingHabits: updatedUser.skipSmokingHabits,
      profileProgress: updatedUser.profileProgress,
    },
  });
};