import {
  SUCCESS_CODE,
  MISSING_PROPS_CODE,
  CONN_ERR_CODE,
  NO_USER_CODE,
  LOGIN_AUTH_FAILED_CODE,
  GENERIC_ERR_CODE,
  INVALID_ACCESS_TOKEN_CODE,
  EMAIL_ALREADY_TAKEN_CODE,
  NUMBER_NOT_REGISTERED_CODE,
  OTP_TYPE_ERROR_CODE,
  TOKEN_NOT_VERIFIED_CODE,
  EMAIL_ALREADY_VERIFIED_CODE,
  TOKEN_TRY_EXPIRED_CODE,
  TOKEN_EXPIRED_CODE,
  INVALID_VERIFICATION_CODE_CODE,
  BROKEN_REFERENCE_CODE,
  NOTHING_MODIFIED_CODE,
  NOT_MEMBER_OF_GROUP_CODE,
  MALFORMED_REQUEST_CODE,
  REFRESH_TOKEN_MISMATCH_CODE,
  PAGINATION_LIMIT,
} from '../constants.js';

const buildError = (code, httpStatus, defaultMessage, errorLabel) => ({ message = defaultMessage, error } = {}) => ({
  success: false,
  code,
  httpStatus,
  message,
  error: error !== undefined ? error : errorLabel,
});

const ResponseUtility = Object.freeze({
  MISSING_PROPS: buildError(MISSING_PROPS_CODE, 400, 'Missing required properties.', 'Missing Props'),

  CONN_ERR: buildError(CONN_ERR_CODE, 503, 'Connection error.', undefined),

  GENERIC_ERR: ({ code = GENERIC_ERR_CODE, httpStatus = 500, message = 'Something went wrong.', error } = {}) => ({
    success: false,
    code,
    httpStatus,
    message,
    ...(error !== undefined ? { error } : {}),
  }),

  NO_USER: buildError(NO_USER_CODE, 404, 'Requested user not found.', 'No User'),

  SUCCESS: ({ code = SUCCESS_CODE, httpStatus = 200, message = 'Request was successful.', data } = {}) => ({
    success: true,
    code,
    httpStatus,
    message,
    ...(data !== undefined ? { data } : {}),
  }),

  SUCCESS_PAGINATION: ({
    code = SUCCESS_CODE,
    httpStatus = 200,
    message = 'Request was successful.',
    data = [],
    page = 1,
    limit = PAGINATION_LIMIT,
  } = {}) => {

    const hasMore = data.length > limit;
    const pageData = hasMore ? data.slice(0, limit) : data;

    return {
      success: true,
      code,
      httpStatus,
      message,
      data: pageData,
      page,
      limit,
      size: pageData.length,
      hasMore,
    };
  },

  LOGIN_AUTH_FAILED: buildError(LOGIN_AUTH_FAILED_CODE, 401, 'Username/Password error.', 'Auth Failed'),
  NOTHING_MODIFIED: buildError(NOTHING_MODIFIED_CODE, 200, 'Nothing modified.', 'Nothing Modified'),
  INVALID_ACCESS_TOKEN: buildError(INVALID_ACCESS_TOKEN_CODE, 401, 'Invalid access token.', 'Invalid Access Token'),
  EMAIL_ALREADY_TAKEN: buildError(EMAIL_ALREADY_TAKEN_CODE, 409, 'This Email ID is already registered.', 'Email Already Taken'),
  
  NUMBER_NOT_REGISTERED: buildError(NUMBER_NOT_REGISTERED_CODE, 404, 'The requested number is not registered.', 'Number Not Registered'),
  OTP_TYPE_ERROR: buildError(OTP_TYPE_ERROR_CODE, 400, 'Invalid OTP type.', 'OTP Type Error'),
  TOKEN_NOT_VERIFIED: buildError(TOKEN_NOT_VERIFIED_CODE, 401, 'The token could not be verified.', 'Token Not Verified'),
  EMAIL_ALREADY_VERIFIED: buildError(EMAIL_ALREADY_VERIFIED_CODE, 409, 'Your email is already verified.', 'Email Already Verified'),
  
  TOKEN_TRY_EXPIRED: buildError(TOKEN_TRY_EXPIRED_CODE, 410, 'Verification code try has expired. Request a new token.', 'Token Try Expired'),
  TOKEN_EXPIRED: buildError(TOKEN_EXPIRED_CODE, 410, 'Your verification code has expired.', 'Token Expired'),
  INVALID_VERIFICATION_CODE: buildError(INVALID_VERIFICATION_CODE_CODE, 400, 'Invalid URL provided for verification.', 'Invalid Verification Code'),
  BROKEN_REFERENCE: buildError(BROKEN_REFERENCE_CODE, 500, 'Broken reference found.', 'Broken Reference'),
  MALFORMED_REQUEST: buildError(MALFORMED_REQUEST_CODE, 400, 'Malformed request. You might need to re-login.', 'Malformed Request'),
  REFRESH_TOKEN_MISMATCH: buildError(REFRESH_TOKEN_MISMATCH_CODE, 401, 'Refresh token mismatch.', 'Refresh Token Mismatch'),
  NOT_MEMBER_OF_GROUP: buildError(NOT_MEMBER_OF_GROUP_CODE, 403, 'You are not part of this group.', 'Not Member Of Group'),
});

export default ResponseUtility;