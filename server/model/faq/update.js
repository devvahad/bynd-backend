import { ResponseUtility, SchemaMapperUtility } from '../../utility/index.js';
import FaqModel from './index.js';

export default async ({ faqRef, question, answer }) => {
  if (!faqRef) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing Property faqRef!' });
  }

  if (!(question || answer)) {
    throw ResponseUtility.MISSING_PROPS({ message: 'Missing Property question or answer!' });
  }

  try {
    const update = await SchemaMapperUtility({ question, answer });

    const updatedFaqObject = await FaqModel.findOneAndUpdate(
      { _id: faqRef, deleted: false },
      update,
      { new: true, runValidators: true },
    );

    if (!updatedFaqObject) {
      throw ResponseUtility.NO_USER({ message: 'Faq not found!' });
    }

    return ResponseUtility.SUCCESS({ data: updatedFaqObject });
  } catch (err) {
    if (err?.name === 'CastError') {
      throw ResponseUtility.MISSING_PROPS({ message: 'Invalid faqRef!' });
    }
    if (err?.name === 'ValidationError') {
      throw ResponseUtility.MISSING_PROPS({ message: err.message });
    }
    if (err?.message === 'Faq not found!') {
      throw err;
    }
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};
