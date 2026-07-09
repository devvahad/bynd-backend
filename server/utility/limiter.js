import rateLimit from 'express-rate-limit';

const LimiterUtility = (timeLimit, requestLimit, message) =>
  rateLimit({
    windowMs: timeLimit,
    max: requestLimit,
    message,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

export const authLimiter = LimiterUtility(
  15 * 60 * 1000,
  10,
  { code: 429, message: 'Too many attempts, please try again later.' }
);

export const otpLimiter = LimiterUtility(
  10 * 60 * 1000,
  5,
  { code: 429, message: 'Too many OTP attempts, please try again later.' }
);

export default LimiterUtility;