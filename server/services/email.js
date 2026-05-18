import nodemailer from 'nodemailer';
import ResponseUtility from '../utility/response.js';

const { BUSINESS_EMAIL, BUSINESS_EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT } = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(SMTP_PORT ?? '587', 10),
  secure: false,
  auth: {
    user: BUSINESS_EMAIL,
    pass: BUSINESS_EMAIL_PASSWORD,
  },
});

const EmailServices = ({ to, subject = 'Message from app', text }) =>
  new Promise((resolve, reject) => {
    transporter.sendMail({ from: BUSINESS_EMAIL, to, subject, text }, (err) => {
      if (err) return reject(ResponseUtility.GENERIC_ERR({ message: 'Error sending email.', error: err }));
      return resolve(ResponseUtility.SUCCESS());
    });
  });

export default EmailServices;