import { logger } from './logger.js';
import nodemailer from 'nodemailer';
import { ResponseUtility } from '../utility/index.js';
import { EMAIL_REGEX } from '../constants.js';

const REQUIRED_ENV_VARS = ['BUSINESS_EMAIL', 'BUSINESS_EMAIL_PASSWORD'];

let transporter;

function assertEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function getTransporter() {
  if (transporter) return transporter;

  assertEnv();

  const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;
  const port = parseInt(SMTP_PORT ?? '587', 10);
  const secure = SMTP_SECURE !== undefined ? SMTP_SECURE === 'true' : port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: BUSINESS_EMAIL,
      pass: BUSINESS_EMAIL_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

function normalizeRecipients(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function validateRecipientGroup(value) {
  const recipients = normalizeRecipients(value);
  return recipients.length === 0 || recipients.every(isValidEmail);
}

async function EmailServices({ to, cc, bcc, subject = 'Message from app', text, html, attachments }) {
  const recipients = normalizeRecipients(to);

  if (!recipients.length || !recipients.every(isValidEmail)) {
    throw ResponseUtility.GENERIC_ERR({ message: 'A valid recipient email address is required.' });
  }

  if (!validateRecipientGroup(cc) || !validateRecipientGroup(bcc)) {
    throw ResponseUtility.GENERIC_ERR({ message: 'CC and BCC fields must contain valid email addresses.' });
  }

  if (!text && !html) {
    throw ResponseUtility.GENERIC_ERR({ message: 'Email must include either text or html content.' });
  }

  const ccRecipients = normalizeRecipients(cc);
  const bccRecipients = normalizeRecipients(bcc);

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: process.env.BUSINESS_EMAIL,
      to: recipients,
      ...(ccRecipients.length && { cc: ccRecipients }),
      ...(bccRecipients.length && { bcc: bccRecipients }),
      subject,
      text,
      html,
      attachments,
    });

    return ResponseUtility.SUCCESS({ data: { messageId: info.messageId } });
  } catch (error) {
    logger.error('EmailServices sendMail error', {
      to: recipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject,
      error: error.message,
    });

    throw ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: error.message });
  }
}

export default EmailServices;