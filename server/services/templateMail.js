import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import ResponseUtility from '../utility/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT, HOST } = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(SMTP_PORT ?? '587', 10),
  secure: false,
  auth: { user: BUSINESS_EMAIL, pass: BUSINESS_EMAIL_PASSWORD },
});

const sendMail = ({ to, subject, html }) =>
  new Promise((resolve, reject) => {
    transporter.sendMail({ from: BUSINESS_EMAIL, to, html, subject }, (err) => {
      if (err) return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
      return resolve(ResponseUtility.SUCCESS());
    });
  });

const compile = (templatePath, props) => {
  const html = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  return handlebars.compile(html)(props);
};

const TEMPLATES = {
  newAccount: path.resolve(__dirname, 'templates', 'new_account_template.html'),
  verification: path.resolve(__dirname, 'templates', 'verification_code_template.html'),
  passwordChange: path.resolve(__dirname, 'templates', 'pass_change_template.html'),
};

const TemplateMailServices = {
  NewAccountMail: ({ to, name, verificationCode, templatePath = TEMPLATES.newAccount }) =>
    sendMail({
      to,
      subject: 'Welcome — verify your account',
      html: compile(templatePath, { user_name: name, verification_code: verificationCode }),
    }),

  ChangePasswordToken: ({ to, name, code, templatePath = TEMPLATES.passwordChange }) => {
    if (!to || !name || !code) return Promise.reject(ResponseUtility.MISSING_PROPS());
    return sendMail({
      to,
      subject: 'Password Reset Request',
      html: compile(templatePath, { user_name: name, verification_code: code }),
    });
  },

  VerificationToken: ({ to, name, code, templatePath = TEMPLATES.verification }) => {
    if (!to || !name || !code) return Promise.reject(ResponseUtility.MISSING_PROPS());
    const verificationUrl = `${HOST}api/users/mailVerification/${to}/${code}`;
    return sendMail({
      to,
      subject: 'Verify your email address',
      html: compile(templatePath, { user_name: name, verification_code: verificationUrl }),
    });
  },
};

export default TemplateMailServices;