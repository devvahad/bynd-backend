import { ResponseUtility } from '../../utility/index.js';
import { AppDetailModel } from '../../schemas/index.js';

export default async () => {
  try {
    const appDetails = await AppDetailModel.findOne({}, { __v: 0 }).lean();
    return ResponseUtility.SUCCESS({ data: appDetails });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};