import crypto from 'crypto';
import { ResponseUtility, HashUtility } from '../../utility/index.js';
import { AdminModel } from '../../schemas/index.js';
import { MIN_PASSWORD_LENGTH, DUPLICATE_KEY_ERROR_CODE } from '../../constants.js';

const timingSafeStringEqual = (a, b) => {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));

  if (bufferA.length !== bufferB.length) {
    crypto.timingSafeEqual(bufferA, bufferA);
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};

export default async ({ email, password, secretKey }) => {
  try {
    if (
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password ||
      typeof secretKey !== 'string' || !secretKey
    ) {
      throw ResponseUtility.MISSING_PROPS({ message: 'Missing property either email, password, or secretKey.' });
    }

    if (!process.env.ADMIN_SIGNUP_SECRET) {
      throw ResponseUtility.GENERIC_ERR({ code: 403, message: 'Invalid authorization.' });
    }

    if (!timingSafeStringEqual(secretKey, process.env.ADMIN_SIGNUP_SECRET)) {
      throw ResponseUtility.GENERIC_ERR({ code: 403, message: 'Invalid authorization.' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw ResponseUtility.GENERIC_ERR({
        code: 400,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailExists = await AdminModel.findOne({ email: normalizedEmail }).lean();

    if (emailExists) {
      throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'This email is already registered.' });
    }

    const hashedPassword = await HashUtility.generate({ text: password });

    try {
      await AdminModel.create({
        email: normalizedEmail,
        password: hashedPassword,
        createdOn: new Date(),
        updatedOn: new Date(),
      });
    } catch (err) {
      if (err?.code === DUPLICATE_KEY_ERROR_CODE) {
        throw ResponseUtility.GENERIC_ERR({ code: 409, message: 'This email is already registered.' });
      }
      throw err;
    }

    return ResponseUtility.SUCCESS({ message: 'Admin has signed up successfully.' });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};