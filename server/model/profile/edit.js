import { UserModel } from '../index.js';
import { ResponseUtility } from '../../utility/index.js';

const ALLOWED_FIELDS = new Set([
  'firstName',
  'age',
  'dob',
  'heightLabel',
  'gender',
  'subGender',
  'datePreferences',
  'userEthnicities',
  'religion',
  'politicalView',
  'lookingFor',
  'drinkingHabits',
  'smokingHabits',
  'firstDatePreferences',
  'children',
  'familyPlans',
  'education',
  'exercise',
  'relationshipType',
  'languages',
  'address',
  'city',
  'state',
  'country',
]);

export default async ({ userId, updateData }) => {
  try {
    const filteredUpdate = Object.fromEntries(
      Object.entries(updateData).filter(
        ([key, value]) =>
          ALLOWED_FIELDS.has(key) && value !== undefined,
      ),
    );

    if (!Object.keys(filteredUpdate).length) {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: 'No valid fields to update.',
      });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: userId,
        deleted: false,
        blocked: false,
      },
      {
        $set: filteredUpdate,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      throw ResponseUtility.GENERIC_ERR({
        code: 404,
        message: 'User not found.',
      });
    }

    return ResponseUtility.SUCCESS({
      data: {
        message: 'Profile updated successfully.',
        updatedFields: Object.keys(filteredUpdate),
      },
    });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({
      message: err.message,
      error: err,
    });
  }
};