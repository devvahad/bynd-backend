import rateLimit from 'express-rate-limit';

const LimiterUtility = (timeLimit, requestLimit, message) =>
  rateLimit({
    windowMs: timeLimit,
    max: requestLimit,
    message,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

export default LimiterUtility;