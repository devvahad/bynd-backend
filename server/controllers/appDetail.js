import { AppDetailModel } from '../model/index.js';
import { ResponseUtility, SchemaMapperUtility } from '../utility/index.js';

export const AddAppDetailController = async (req, res) => {
  try {
    const detail = await AppDetailModel.create(req.body);
    return res.json(ResponseUtility.SUCCESS({ data: detail }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const GetAppDetailController = async (_req, res) => {
  try {
    const detail = await AppDetailModel.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!detail) return res.json(ResponseUtility.NO_USER({ message: 'No app detail found.' }));
    return res.json(ResponseUtility.SUCCESS({ data: detail }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const UpdateAppDetailController = async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const updates = await SchemaMapperUtility(rest);
    const detail = await AppDetailModel.findByIdAndUpdate(id, updates, { new: true });
    if (!detail) return res.json(ResponseUtility.NO_USER({ message: 'App detail not found.' }));
    return res.json(ResponseUtility.SUCCESS({ data: detail }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};

export const ListAppDetailController = async (req, res) => {
  try {
    const details = await AppDetailModel.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json(ResponseUtility.SUCCESS({ data: details }));
  } catch (err) {
    return res.status(500).json(ResponseUtility.GENERIC_ERR({ error: err.message }));
  }
};