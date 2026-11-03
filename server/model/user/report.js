import UserModel from './index.js';
import ReportModel from '../chat/reportSchema.js';
import { ResponseUtility, PropsValidationUtility } from '../../utility/index.js';
import { SUCCESS_CODE, REPORT_CATEGORIES } from '../../constants.js';

export default async ({ id, reportedUserId, category, subOption }) => {
  const { code, message } = await PropsValidationUtility({
    validProps: ['reportedUserId', 'category'],
    sourceDocument: { reportedUserId, category },
  });

  if (code !== SUCCESS_CODE) {
    throw ResponseUtility.MISSING_PROPS({ message });
  }

  if (id === reportedUserId) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'You cannot report yourself.' });
  }

  const categoryObj = REPORT_CATEGORIES.find((c) => c.category === category);
  if (!categoryObj) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid report category.' });
  }

  if (categoryObj.subOptions.length && !categoryObj.subOptions.includes(subOption)) {
    throw ResponseUtility.GENERIC_ERR({ code: 400, message: 'Invalid report sub-option.' });
  }

  const reportedUser = await UserModel.findOne({ _id: reportedUserId, deleted: false });
  if (!reportedUser) {
    throw ResponseUtility.GENERIC_ERR({ code: 404, message: 'User not found.' });
  }

  const existingReport = await ReportModel.findOne({
    reporterId: id,
    reportedUserId,
    source: 'PROFILE',
    deleted: false,
  });

  if (existingReport) {
    return ResponseUtility.SUCCESS({ message: 'You have already reported this user.' });
  }

  await ReportModel.create({
    reporterId: id,
    reportedUserId,
    category,
    subOption,
    source: 'PROFILE',
  });

  await Promise.all([
    UserModel.findByIdAndUpdate(id, { $addToSet: { reportedUsers: reportedUserId } }),
    UserModel.findByIdAndUpdate(reportedUserId, { $addToSet: { reportedBy: id } }),
  ]);

  return ResponseUtility.SUCCESS({ message: 'Report submitted successfully.' });
};