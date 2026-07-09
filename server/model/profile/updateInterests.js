import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, INTEREST_CATEGORIES, MAX_TAGS_PER_CATEGORY, MAX_TOTAL_TAGS } from '../../constants.js';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export default async ({ userId, interests, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedInterests = [];

    if (!isClearing) {
      if (!Array.isArray(interests)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Interests must be an array.' });
      }

      if (interests.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one interest is required unless preferNotToSay is true.',
        });
      }

      const seenCategories = new Set();
      let totalTagCount = 0;

      for (const item of interests) {
        if (!item || typeof item !== 'object') {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Each interest entry must be an object.' });
        }

        const { category, tags } = item;

        if (typeof category !== 'string' || !category || !hasOwn(INTEREST_CATEGORIES, category)) {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Invalid category: ${category}` });
        }

        if (seenCategories.has(category)) {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Duplicate category: ${category}` });
        }
        seenCategories.add(category);

        if (!Array.isArray(tags)) {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Tags must be an array for category: ${category}` });
        }

        const uniqueTags = [...new Set(tags)];

        if (uniqueTags.length === 0) {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: `At least one tag is required for category: ${category}` });
        }

        if (uniqueTags.length > MAX_TAGS_PER_CATEGORY) {
          throw ResponseUtility.GENERIC_ERR({
            code: 400,
            message: `Max ${MAX_TAGS_PER_CATEGORY} tags per category: ${category}`,
          });
        }

        const validTags = INTEREST_CATEGORIES[category];
        const invalidTag = uniqueTags.find((t) => !validTags.includes(t));
        if (invalidTag) {
          throw ResponseUtility.GENERIC_ERR({
            code: 400,
            message: `"${invalidTag}" is not a valid tag for "${category}".`,
          });
        }

        totalTagCount += uniqueTags.length;
        normalizedInterests.push({ category, tags: uniqueTags });
      }

      if (totalTagCount > MAX_TOTAL_TAGS) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Maximum ${MAX_TOTAL_TAGS} interests total.` });
      }
    }

    const update = {
      interests: isClearing ? [] : normalizedInterests,
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
      message: isClearing ? 'Interests cleared.' : 'Interests updated successfully.',
      data: { interests: user.interests },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};