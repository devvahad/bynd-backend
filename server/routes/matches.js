import { Router } from 'express';
import { MatchesControllers } from '../controllers/index.js';
import { authenticate } from '../controllers/authentication.js';
import {
  PlanADateListSchema,
  GetMatchDetailsSchema,
  GetAvailableDateSlotsSchema,
  SendDateRequestSchema,
  SearchLocationsSchema,
  GetLocationDetailsSchema,
  ValidateLocationDistanceSchema,
  GetDateRequestsListSchema,
  PreviewDateRequestSchema,
  GetDateRequestDetailsSchema,
  EditDateRequestSchema,
  CancelDateRequestSchema,
  AcceptDateRequestSchema,
  RejectDateRequestSchema,
  GetConfirmedDatesSchema,
  ProposeNewRequestSchema,
} from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/plan-a-date-list', PlanADateListSchema, MatchesControllers.planADateList);
router.post('/details', GetMatchDetailsSchema, MatchesControllers.getMatchDetails);
router.post('/available-date-slots', GetAvailableDateSlotsSchema, MatchesControllers.getAvailableDateSlots);
router.post('/send-date-request', SendDateRequestSchema, MatchesControllers.sendDateRequest);
router.post('/search-locations', SearchLocationsSchema, MatchesControllers.searchLocations);
router.post('/location-details', GetLocationDetailsSchema, MatchesControllers.getLocationDetails);
router.post('/validate-location-distance', ValidateLocationDistanceSchema, MatchesControllers.validateLocationDistance);
router.post('/date-requests-list', GetDateRequestsListSchema, MatchesControllers.getDateRequestsList);
router.post('/preview-request', PreviewDateRequestSchema, MatchesControllers.previewDateRequest);
router.post('/date-request-details', GetDateRequestDetailsSchema, MatchesControllers.getDateRequestDetails);
router.post('/edit-date-request', EditDateRequestSchema, MatchesControllers.editDateRequest);
router.post('/cancel-date-request', CancelDateRequestSchema, MatchesControllers.cancelDateRequest);
router.post('/accept-date-request', AcceptDateRequestSchema, MatchesControllers.acceptDateRequest);
router.post('/reject-date-request', RejectDateRequestSchema, MatchesControllers.rejectDateRequest);
router.post('/confirmed-dates', GetConfirmedDatesSchema, MatchesControllers.getConfirmedDates);
router.post('/propose-new-request', ProposeNewRequestSchema, MatchesControllers.proposeNewRequest);

export default router;
