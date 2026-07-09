import { logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { EMAIL_REGEX, HOST } from '../constants.js';
import { ResponseUtility } from '../utility/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;

const REQUIRED_ENV_VARS = ['BUSINESS_EMAIL', 'BUSINESS_EMAIL_PASSWORD'];

function assertEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  assertEnv();

  const port = parseInt(SMTP_PORT ?? '587', 10);
  const secure = SMTP_SECURE !== undefined ? SMTP_SECURE === 'true' : port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user: BUSINESS_EMAIL, pass: BUSINESS_EMAIL_PASSWORD },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function buildVerificationUrl(to, code) {
  const base = HOST.endsWith('/') ? HOST : `${HOST}/`;
  return `${base}api/users/mailVerification/${encodeURIComponent(to)}/${encodeURIComponent(code)}`;
}

async function sendMail({ to, subject, html }) {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({ from: BUSINESS_EMAIL, to, html, subject });
    return ResponseUtility.SUCCESS();
  } catch (error) {
    logger.error('TemplateMailServices sendMail error', { to, error: error.message });
    throw ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error });
  }
}

const templateCache = new Map();

async function getCompiledTemplate(templatePath) {
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath);
  }

  let html;
  try {
    html = await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw ResponseUtility.GENERIC_ERR({ message: `Email template not found: ${templatePath}`, error });
  }

  const compiled = handlebars.compile(html);
  templateCache.set(templatePath, compiled);
  return compiled;
}

async function render(templatePath, props) {
  const compiled = await getCompiledTemplate(templatePath);
  return compiled(props);
}

const TEMPLATES = {
  newAccount: path.resolve(__dirname, 'templates', 'new_account_template.html'),
  verification: path.resolve(__dirname, 'templates', 'verification_code_template.html'),
  passwordChange: path.resolve(__dirname, 'templates', 'pass_change_template.html'),
};

function assertMailProps({ to, name, code }) {
  if (!isValidEmail(to) || !name || !code) {
    throw ResponseUtility.MISSING_PROPS({ message: 'A valid "to", "name" and "code" are required.' });
  }
}

const TemplateMailServices = {
  async NewAccountMail({ to, name, verificationCode, templatePath = TEMPLATES.newAccount }) {
    assertMailProps({ to, name, code: verificationCode });

    const html = await render(templatePath, { user_name: name, verification_code: verificationCode });
    return sendMail({ to, subject: 'Welcome — verify your account', html });
  },

  async ChangePasswordToken({ to, name, code, templatePath = TEMPLATES.passwordChange }) {
    assertMailProps({ to, name, code });

    const html = await render(templatePath, { user_name: name, verification_code: code });
    return sendMail({ to, subject: 'Password Reset Request', html });
  },

  async VerificationToken({ to, name, code, templatePath = TEMPLATES.verification }) {
    assertMailProps({ to, name, code });

    const verificationUrl = buildVerificationUrl(to, code);
    const html = await render(templatePath, { user_name: name, verification_code: verificationUrl });
    return sendMail({ to, subject: 'Verify your email address', html });
  },
};

export default TemplateMailServices;