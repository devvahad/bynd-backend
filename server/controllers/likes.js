import { LikeModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

const withUserId = (req) => ({ ...req, body: { ...req.body, userId: req.user._id || req.user.id } });

export default {
  likeUser: (req, res) => ModelResolver(withUserId(req), res, LikeModel.LikeUserModel),
  passUser: (req, res) => ModelResolver(withUserId(req), res, LikeModel.PassUserModel),
  unlikeUser: (req, res) => ModelResolver(withUserId(req), res, LikeModel.UnlikeUserModel),
  likedListUser: (req, res) => ModelResolver(withUserId(req), res, LikeModel.LikedListUserModel),
  likedByListUser: (req, res) => ModelResolver(withUserId(req), res, LikeModel.LikedByListUserModel),
  undoPassUser: (req, res) => ModelResolver(withUserId(req), res, LikeModel.UndoPassUserModel),
  getUserDetails: (req, res) => ModelResolver(withUserId(req), res, LikeModel.GetUserDetailsModel),
};
