import { ResponseUtility } from '../../utility/index.js';
import { UserModel } from '../index.js';
import { EMPTY_STATS } from '../../constants.js';

export default async () => {
  try {
    const [data] = await UserModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$deleted', false] }, 1, 0] } },
          blocked: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$deleted', false] }, { $eq: ['$blocked', true] }] }, 1, 0],
            },
          },
          deleted: { $sum: { $cond: [{ $eq: ['$deleted', true] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, total: 1, active: 1, blocked: 1, deleted: 1 } },
    ]);

    return ResponseUtility.SUCCESS({ data: data || EMPTY_STATS });
  } catch (err) {
    if (err instanceof Error) {
      throw ResponseUtility.GENERIC_ERR({ message: err.message, error: err });
    }
    throw err;
  }
};