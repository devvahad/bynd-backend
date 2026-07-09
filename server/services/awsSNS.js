import {
  SNSClient,
  PublishCommand,
  CheckIfPhoneNumberIsOptedOutCommand,
} from '@aws-sdk/client-sns';

import { APP_NAME, OTP_VALIDITY_MINUTES } from '../constants.js';
import { logger } from './logger.js';

const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = process.env;

const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const OTP_REGEX = /^\d{4,8}$/;

let snsClient;

function getClient() {
  if (!snsClient) {
    snsClient = new SNSClient({
      region: AWS_REGION || 'us-east-1',
      maxAttempts: 3,
      ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
  }

  return snsClient;
}

function normalizePhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== 'string' && typeof phoneNumber !== 'number') {
    return null;
  }

  const candidate = String(phoneNumber).trim();
  const formatted = candidate.startsWith('+')
    ? candidate
    : `+${candidate}`;

  return E164_REGEX.test(formatted) ? formatted : null;
}

function maskPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '****';

  return phoneNumber.replace(/\d(?=\d{4})/g, '*');
}

function getSenderId() {
  const sanitized = (APP_NAME || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 11);

  return sanitized || null;
}

async function sendOTP({ phoneNumber, otp }) {
  const formattedPhone = normalizePhoneNumber(phoneNumber);

  if (!formattedPhone) {
    return {
      success: false,
      error: 'INVALID_PHONE_NUMBER',
      message: 'Phone number must be a valid E.164 number.',
    };
  }

  const otpString = String(otp ?? '');

  if (!OTP_REGEX.test(otpString)) {
    return {
      success: false,
      error: 'INVALID_OTP',
      message: 'OTP must be 4 to 8 digits.',
    };
  }

  const senderId = getSenderId();

  const message =
    `Your ${APP_NAME} verification code is: ${otpString}. ` +
    `Valid for ${OTP_VALIDITY_MINUTES} minutes. ` +
    'Do not share this code.';

  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: formattedPhone,
      MessageAttributes: {
        ...(senderId && {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: senderId,
          },
        }),
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    const result = await getClient().send(command);

    logger.info('OTP sent successfully', {
      phoneNumber: maskPhoneNumber(formattedPhone),
      messageId: result.MessageId,
    });

    return {
      success: true,
      messageId: result.MessageId,
      message: 'OTP sent successfully.',
    };
  } catch (error) {
    logger.error('SNS sendOTP failed', {
      phoneNumber: maskPhoneNumber(formattedPhone),
      error: error.message,
    });

    return {
      success: false,
      error: error.name || 'SNS_ERROR',
      message: 'Failed to send OTP.',
    };
  }
}

async function validatePhoneNumber({ phoneNumber }) {
  const formattedPhone = normalizePhoneNumber(phoneNumber);

  if (!formattedPhone) {
    return {
      valid: false,
      error: 'INVALID_PHONE_NUMBER',
      message: 'Phone number must be a valid E.164 number.',
    };
  }

  try {
    const command = new CheckIfPhoneNumberIsOptedOutCommand({
      phoneNumber: formattedPhone,
    });

    const result = await getClient().send(command);

    if (result.isOptedOut) {
      return {
        valid: false,
        optedOut: true,
        error: 'OPTED_OUT',
        message: 'Phone number has opted out of SMS messages.',
      };
    }

    return {
      valid: true,
      optedOut: false,
      message: 'Phone number is valid.',
    };
  } catch (error) {
    logger.error('SNS validatePhoneNumber failed', {
      phoneNumber: maskPhoneNumber(formattedPhone),
      error: error.message,
    });

    return {
      valid: false,
      error: error.name || 'SNS_ERROR',
      message: 'Unable to validate phone number.',
    };
  }
}

const AwsSNSService = {
  sendOTP,
  validatePhoneNumber,
};

export default AwsSNSService;
export { sendOTP, validatePhoneNumber };