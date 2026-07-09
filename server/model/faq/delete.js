import { ResponseUtility } from '../../utility/index.js';
import FaqModel from './index.js';

export default async ({ faqRef }) => {
	if (!faqRef) {
		throw ResponseUtility.MISSING_PROPS({ message: 'Missing Property faqRef!' });
	}

	try {
		const faq = await FaqModel.findOneAndUpdate(
			{ _id: faqRef, deleted: false },
			{ deleted: true },
			{ new: true },
		);

		if (!faq) {
            throw ResponseUtility.NO_USER({ message: 'Faq not found!' });
		}

		return ResponseUtility.SUCCESS({ message: 'Faq has been deleted successfully!' });
	} catch (err) {
		if (err?.name === 'CastError') {
			throw ResponseUtility.MISSING_PROPS({ message: 'Invalid faqRef!' });
		}
		if (err?.message === 'Faq not found!') {
			throw err;
		}
		throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
	}
};