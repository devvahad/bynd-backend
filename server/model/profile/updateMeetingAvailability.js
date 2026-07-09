import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MEETING_DAYS, MEETING_TIME_SLOTS } from '../../constants.js';

export default async ({ userId, meetingAvailability, preferNotToSay }) => {
  try {
    const { code, message } = await PropsValidationUtility({
      validProps: ['userId'],
      sourceDocument: { userId },
    });

    if (code !== SUCCESS_CODE) {
      throw ResponseUtility.MISSING_PROPS({ message });
    }

    const isClearing = preferNotToSay === true;
    let normalizedAvailability = [];

    if (!isClearing) {
      if (!Array.isArray(meetingAvailability)) {
        throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Meeting availability must be an array.' });
      }

      if (meetingAvailability.length === 0) {
        throw ResponseUtility.GENERIC_ERR({
          code: 400,
          message: 'At least one availability entry is required unless preferNotToSay is true.',
        });
      }

      const seenDays = new Set();

      for (const entry of meetingAvailability) {
        if (!entry || typeof entry !== 'object') {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Each availability entry must be an object.' });
        }

        const { day, timeSlots } = entry;

        if (typeof day !== 'string' || !day || !MEETING_DAYS.includes(day)) {
          throw ResponseUtility.GENERIC_ERR({
            code: 400,
            message: `Invalid day: ${day}. Allowed: ${MEETING_DAYS.join(', ')}`,
          });
        }

        if (seenDays.has(day)) {
          throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Duplicate day: ${day}` });
        }
        seenDays.add(day);

        if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
          throw ResponseUtility.GENERIC_ERR({
            code: 400,
            message: `Time slots must be a non-empty array for day: ${day}`,
          });
        }

        const uniqueSlots = [...new Set(timeSlots)];

        const invalidSlots = uniqueSlots.filter((s) => !MEETING_TIME_SLOTS.includes(s));
        if (invalidSlots.length) {
          throw ResponseUtility.GENERIC_ERR({
            code: 400,
            message: `Invalid time slots: ${invalidSlots.join(', ')}. Allowed: ${MEETING_TIME_SLOTS.join(', ')}`,
          });
        }

        normalizedAvailability.push({ day, timeSlots: uniqueSlots });
      }
    }

    const update = {
      meetingAvailability: isClearing ? [] : normalizedAvailability,
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
      message: isClearing ? 'Meeting availability cleared.' : 'Meeting availability updated.',
      data: { meetingAvailability: user.meetingAvailability },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};