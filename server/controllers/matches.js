import { MatchesModel } from '../model/index.js';
import { ModelResolver } from './resolvers/index.js';

const withUserId = (req) => ({ ...req, body: { ...req.body, userId: req.user._id || req.user.id } });

export default {
  planADateList: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.PlanADateListModel),
  getMatchDetails: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.GetMatchDetailsModel),
  getAvailableDateSlots: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.GetAvailableDateSlotsModel),
  sendDateRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.SendDateRequestModel),
  searchLocations: (req, res) => ModelResolver(req, res, MatchesModel.SearchLocationsModel),
  getLocationDetails: (req, res) => ModelResolver(req, res, MatchesModel.GetLocationDetailsModel),
  validateLocationDistance: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.ValidateLocationDistanceModel),
  getDateRequestsList: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.GetDateRequestsListModel),
  previewDateRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.PreviewDateRequestModel),
  getDateRequestDetails: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.GetDateRequestDetailsModel),
  editDateRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.EditDateRequestModel),
  cancelDateRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.CancelDateRequestModel),
  acceptDateRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.AcceptDateRequestModel),
  rejectDateRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.RejectDateRequestModel),
  getConfirmedDates: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.GetConfirmedDatesModel),
  proposeNewRequest: (req, res) => ModelResolver(withUserId(req), res, MatchesModel.ProposeNewRequestModel),
};
