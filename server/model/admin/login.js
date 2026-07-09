import {
  ResponseUtility,
  HashUtility,
  TokenUtility,
} from '../../utility/index.js';
import { AdminModel } from '../../schemas/index.js';
import { DUMMY_HASH } from '../../constants.js';

const safeCompare = async (text, hash) => {
  try {
    return await HashUtility.compare({ text, hash });
  } catch (_err) {
    return false;
  }
};

export default async ({ email, password }) => {
  try {
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      throw ResponseUtility.MISSING_PROPS({ message: 'Missing property either password or email.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = await AdminModel.findOne({ email: normalizedEmail }).lean();

    const passwordMatch = await safeCompare(password, admin ? admin.password : DUMMY_HASH);

    if (!admin || !passwordMatch) {
      throw ResponseUtility.LOGIN_AUTH_FAILED();
    }

    const token = await TokenUtility.generateToken({
      id: admin._id,
      email: admin.email,
      tokenLife: process.env.JWT_EXPIRES_IN,
      role: 'admin',
    });

    const { password: _password, createdOn, updatedOn, __v, ...safeAdmin } = admin;

    return ResponseUtility.SUCCESS({
      data: {
        accessToken: token,
        user: safeAdmin,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};