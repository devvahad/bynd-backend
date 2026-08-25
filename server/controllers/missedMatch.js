import { MissedMatchModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

const withUserId = (req) => ({ ...req, body: { ...req.body, userId: req.user._id || req.user.id } });

export default {
  findOutWho: (req, res) => ModelResolver(withUserId(req), res, MissedMatchModel.FindOutWhoService),
  passAfterMissedMatch: (req, res) => ModelResolver(withUserId(req), res, MissedMatchModel.PassAfterMissedMatchService),
  initSession: (req, res) => ModelResolver(withUserId(req), res, MissedMatchModel.InitSessionService),
};
