import { UserModel } from '../index.js';
import { PropsValidationUtility, ResponseUtility } from '../../utility/index.js';
import { SUCCESS_CODE, MIN_AGE, MAX_AGE, DOB_FORMAT_REGEX } from '../../constants.js';

const calculateAge = (birthDate, referenceDate = new Date()) => {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const parseBirthDate = (dob) => {
  if (typeof dob !== 'string') {
    return null;
  }

  const match = dob.match(DOB_FORMAT_REGEX);
  if (!match) {
    return null;
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  const birthDate = new Date(year, month - 1, day);
  const isRealCalendarDate =
    birthDate.getFullYear() === year && birthDate.getMonth() === month - 1 && birthDate.getDate() === day;

  return isRealCalendarDate ? birthDate : null;
};

export default async ({ userId, dob }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['userId', 'dob'],
    sourceDocument: { userId, dob },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const birthDate = parseBirthDate(dob);
  if (!birthDate) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid date of birth format. Use dd-mm-yyyy.' });
  }

  const now = new Date();
  if (birthDate.getTime() > now.getTime()) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Date of birth cannot be in the future.' });
  }

  const age = calculateAge(birthDate, now);
  if (age < MIN_AGE) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `You must be at least ${MIN_AGE} years old.` });
  }
  if (age > MAX_AGE) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `Date of birth is invalid (age exceeds ${MAX_AGE}).` });
  }

  try {
    const user = await UserModel.findOne({ _id: userId, deleted: false, blocked: false });

    if (!user) {
      throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
    }

    user.dob = birthDate;
    user.age = age;
    user.updatedOn = new Date();
    await user.save();

    return ResponseUtility.SUCCESS({ message: 'Date of birth updated.', data: { dob: user.dob, age: user.age } });
  } catch (err) {
    if (err && err.code) {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};