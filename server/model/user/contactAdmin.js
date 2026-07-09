import { ResponseUtility } from '../../utility/index.js';
import { EmailServices } from '../../services/index.js';

const { DEVELOPER_EMAIL } = process.env;

const ContactAdminModel = async ({ userId, email, name, subject, message }) => {
  if (!subject || !message) {
    throw ResponseUtility.MISSING_PROPS();
  }

  const body = `Message from user: ${name} (${email})\nUser ID: ${userId}\n\nSubject: ${subject}\n\n${message}`.trim();

  await EmailServices({
    to: DEVELOPER_EMAIL,
    subject: `[Contact Admin] ${subject}`,
    text: body,
  });

  return ResponseUtility.SUCCESS({ message: 'Your message has been sent.' });
};

export default ContactAdminModel;