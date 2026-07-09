import UserModel from './index.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { MIN_AGE, MIN_YEAR, SUCCESS_CODE } from '../../constants.js';

const validateFirstName = (firstName) => {
  if (!firstName || typeof firstName !== 'string') {
    return { valid: false, message: 'First name is required.' };
  }

  const trimmed = firstName.trim();

  if (!/^[A-Za-z]+$/.test(trimmed)) {
    return { valid: false, message: 'First name can only contain alphabets.' };
  }

  const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return { valid: true, normalizedFirstName: normalized };
};

const validateDOB = (dob) => {
  if (!dob) return { valid: false, message: 'Date of birth is required.' };

  const dobDate = new Date(dob);

  if (isNaN(dobDate.getTime())) {
    return { valid: false, message: 'Invalid date of birth.' };
  }

  const now = new Date();

  if (dobDate >= now) {
    return { valid: false, message: 'Date of birth must be a past date.' };
  }

  if (dobDate.getFullYear() < MIN_YEAR) {
    return { valid: false, message: `Year must be ${MIN_YEAR} or later.` };
  }

  let age = now.getFullYear() - dobDate.getFullYear();
  const monthDiff = now.getMonth() - dobDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dobDate.getDate())) {
    age -= 1;
  }

  if (age < MIN_AGE) {
    return { valid: false, message: `You must be at least ${MIN_AGE} years old to continue.` };
  }

  return { valid: true, age };
};

export default async ({ id, firstName, dob }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['firstName', 'dob'],
    sourceDocument: { firstName, dob },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  const user = await UserModel.findOne({ _id: id, deleted: false });

  if (!user) {
    throw ResponseUtility.GENERIC_ERR({ message: 'User not found.' });
  }

  if (!user.verified) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Please verify your phone number first.' });
  }

  const nameResult = validateFirstName(firstName);

  if (!nameResult.valid) {
    throw ResponseUtility.GENERIC_ERR({ message: nameResult.message });
  }

  const dobResult = validateDOB(dob);

  if (!dobResult.valid) {
    throw ResponseUtility.GENERIC_ERR({ message: dobResult.message });
  }

  user.firstName = nameResult.normalizedFirstName;
  user.dob = new Date(dob);
  user.age = dobResult.age;
  user.updatedOn = new Date();

  await user.save();

  return ResponseUtility.SUCCESS({
    data: {
      firstName: user.firstName,
      dob: user.dob,
      age: user.age,
      message: `Hi ${user.firstName}! You're ${user.age} years old.`,
    },
  });
};