import { DateModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

const withUserId = (req) => ({ ...req, body: { ...req.body, userId: req.user._id || req.user.id } });

export default {
  list: (req, res) => ModelResolver(withUserId(req), res, DateModel.DateListService),
  feedback: (req, res) => ModelResolver(withUserId(req), res, DateModel.DateFeedbackService),
};
