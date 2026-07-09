import { ResponseUtility } from '../../utility/index.js';
import FaqModel from './index.js';
import { PAGINATION_LIMIT } from '../../constants.js';

export default async ({ page = 1, limit = PAGINATION_LIMIT }) => {
  try {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || PAGINATION_LIMIT);

    const [faqList, total] = await Promise.all([
      FaqModel.find({ deleted: false }, { __v: 0 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      FaqModel.countDocuments({ deleted: false }),
    ]);

    return ResponseUtility.SUCCESS({
      data: {
        list: faqList,
        total,
        page: pageNum,
        limit: limitNum,
        size: faqList.length,
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (err) {
    throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
  }
};
