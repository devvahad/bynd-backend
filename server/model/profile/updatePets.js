import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, PETS_OPTIONS, MAX_PETS } from '../../constants.js';

export default async ({ userId, pets, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedPets = [];

    if (!isClearing) {
      if (!Array.isArray(pets)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Pets must be an array.' });
      }

      if (pets.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one pet option is required unless preferNotToSay is true.',
        });
      }

      normalizedPets = [...new Set(pets)];

      if (normalizedPets.length > MAX_PETS) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Max ${MAX_PETS} pets allowed.` });
      }

      const invalid = normalizedPets.filter((p) => !PETS_OPTIONS.includes(p));
      if (invalid.length) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid pets: ${invalid.join(', ')}` });
      }
    }

    const update = {
      pets: isClearing ? [] : normalizedPets,
      updatedOn: new Date(),
    };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, deleted: false, blocked: false },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    return ResponseUtility.SUCCESS({
      message: isClearing ? 'Pets cleared.' : 'Pets updated.',
      data: { pets: user.pets },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};