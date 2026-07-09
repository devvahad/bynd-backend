import { ResponseUtility } from '../../utility/index.js';
import FaqModel from './index.js';

const missingFields = ({ question, answer }) => {
  const missing = [];
  if (!question) missing.push('question');
  if (!answer) missing.push('answer');
  return missing;
};

export default async ({ id, question, answer }) => {
  const missing = missingFields({ question, answer });

  if (missing.length > 0) {
    throw ResponseUtility.MISSING_PROPS({ message: `Missing Property ${missing.join(', ')}!` });
  }

  try {
    const faqObject = new FaqModel({ question, answer });
    await faqObject.save();
    return ResponseUtility.SUCCESS({ data: faqObject });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};