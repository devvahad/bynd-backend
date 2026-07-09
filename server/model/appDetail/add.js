import { ResponseUtility, SchemaMapperUtility } from '../../utility/index.js';
import { AppDetailModel } from '../../schemas/index.js';

const MAX_CONTENT_LENGTH = 100000;
const SINGLETON_FILTER = { createdOn: { $exists: true } };

const normalizeField = (value, fieldName) => {
  if (value === undefined) return undefined;

  if (typeof value !== 'string') {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: `${fieldName} must be a string.` });
  }

  const trimmed = value.trim();

  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw ResponseUtility.GENERIC_ERR({
      code: 400,
      message: `${fieldName} cannot exceed ${MAX_CONTENT_LENGTH} characters.`,
    });
  }

  return trimmed;
};

export default async ({ aboutUs, privacyPolicy, termsAndConditions }) => {
  try {
    if (aboutUs === undefined && privacyPolicy === undefined && termsAndConditions === undefined) {
      throw ResponseUtility.MISSING_PROPS({
        message: 'Kindly provide one out of three: aboutUs, privacyPolicy, or termsAndConditions.',
      });
    }

    const normalizedAboutUs = normalizeField(aboutUs, 'aboutUs');
    const normalizedPrivacyPolicy = normalizeField(privacyPolicy, 'privacyPolicy');
    const normalizedTermsAndConditions = normalizeField(termsAndConditions, 'termsAndConditions');

    const updateAppDetails = await SchemaMapperUtility({
      aboutUs: normalizedAboutUs,
      aboutUsUpdatedOn: normalizedAboutUs !== undefined ? new Date() : undefined,
      privacyPolicy: normalizedPrivacyPolicy,
      privacyPolicyUpdatedOn: normalizedPrivacyPolicy !== undefined ? new Date() : undefined,
      termsAndConditions: normalizedTermsAndConditions,
      termsAndConditionsUpdatedOn: normalizedTermsAndConditions !== undefined ? new Date() : undefined,
      $min: { createdOn: new Date() },
    });

    const appDetails = await AppDetailModel.findOneAndUpdate(
      SINGLETON_FILTER,
      updateAppDetails,
      { upsert: true, setDefaultsOnInsert: true, new: true, runValidators: true }
    );

    return ResponseUtility.SUCCESS({ data: appDetails, message: 'App details updated successfully.' });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};