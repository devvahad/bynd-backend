import { FaqModel } from '../model/index.js';
import { ResponseUtility, SchemaMapperUtility } from '../utility/index.js';
import { PAGINATION_LIMIT } from '../constants.js';

export const AddFaqController = async (req, res) => {
  try {
    const faq = await FaqModel.create(req.body);
    return res.json(ResponseUtility.SUCCESS({ data: faq }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ListFaqController = async (req, res) => {
  try {
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? String(PAGINATION_LIMIT), 10);
    const faqs = await FaqModel.find({ isDeleted: false, isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1);
    return res.json(ResponseUtility.SUCCESS_PAGINATION({ data: faqs, page, limit }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UpdateFaqController = async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const updates = await SchemaMapperUtility(rest);
    const faq = await FaqModel.findByIdAndUpdate(id, updates, { new: true });
    if (!faq) return res.json(ResponseUtility.GENERIC_ERR({ message: 'FAQ not found.' }));
    return res.json(ResponseUtility.SUCCESS({ data: faq }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const DeleteFaqController = async (req, res) => {
  try {
    const { id } = req.body;
    await FaqModel.findByIdAndUpdate(id, { isDeleted: true });
    return res.json(ResponseUtility.SUCCESS({ message: 'FAQ deleted.' }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};