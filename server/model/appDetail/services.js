import AppDetailMongoModel from './index.js';
import { ResponseUtility, SchemaMapperUtility } from '../../utility/index.js';

export const AddAppDetailService = async ({ title, description, version, logoUrl, bannerUrl, privacyPolicyUrl, termsUrl, contactEmail, socialLinks }) => {
  try {
    const detail = await AppDetailMongoModel.create({
      title, description, version, logoUrl, bannerUrl,
      privacyPolicyUrl, termsUrl, contactEmail, socialLinks,
    });
    return ResponseUtility.SUCCESS({ data: detail });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ error: err.message });
  }
};

export const ListAppDetailService = async () => {
  try {
    const data = await AppDetailMongoModel.find({ isActive: true }).sort({ createdAt: -1 });
    return ResponseUtility.SUCCESS({ data });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ error: err.message });
  }
};

export const GetAppDetailService = async () => {
  try {
    const detail = await AppDetailMongoModel.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!detail) throw ResponseUtility.NO_USER({ message: 'No app detail found.' });
    return ResponseUtility.SUCCESS({ data: detail });
  } catch (err) {
    if (err instanceof Error) throw ResponseUtility.GENERIC_ERR({ error: err.message });
    throw err;
  }
};

export const UpdateAppDetailService = async ({ id, ...rest }) => {
  try {
    const updates = await SchemaMapperUtility(rest);
    const detail = await AppDetailMongoModel.findByIdAndUpdate(id, updates, { new: true });
    if (!detail) throw ResponseUtility.NO_USER({ message: 'App detail not found.' });
    return ResponseUtility.SUCCESS({ data: detail });
  } catch (err) {
    if (err instanceof Error) throw ResponseUtility.GENERIC_ERR({ error: err.message });
    throw err;
  }
};
