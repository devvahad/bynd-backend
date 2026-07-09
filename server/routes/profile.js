import { Router } from 'express';

import ProfileControllers from '../controllers/profile.js';
import { authenticate } from '../controllers/authentication.js';
import { MultipartService } from '../services/index.js';
import {
  EditNameSchema,
  UpdateBioSchema,
  UpdateDOBSchema,
  UpdateInterestsSchema,
  UpdateLanguagesSchema,
  UpdatePromptSchema,
  RemovePhotoSchema,
  ReorderPhotosSchema,
  UpdateGenderSchema,
  UpdatePronounsSchema,
  UpdateSexualitySchema,
  UpdateZodiacSignSchema,
  UpdateEthnicitiesSchema,
  UpdateReligionSchema,
  UpdatePoliticalViewSchema,
  UpdateHeightSchema,
  UpdateWorkSchema,
  UpdateSchoolSchema,
  UpdateEducationSchema,
  UpdateLocationSchema,
  UpdateChildrenSchema,
  UpdateFamilyPlansSchema,
  UpdatePetsSchema,
  UpdateExerciseSchema,
  UpdateDrinkingHabitsSchema,
  UpdateSmokingHabitsSchema,
  UpdateCannabisSchema,
  UpdateDietaryPreferencesSchema,
  UpdateFoodAllergiesSchema,
  UpdateActiveStatusSchema,
  UpdateLoveLanguagesSchema,
  UpdateFirstDatePreferencesSchema,
  UpdateLookingForSchema,
  UpdateRelationshipTypeSchema,
  UpdateDatingExpectationsSchema,
  UpdateFirstDateDistanceSchema,
  UpdateMeetingAvailabilitySchema,
} from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/get-more', ProfileControllers.getMore);
router.get('/safety', ProfileControllers.safety);
router.get('/preview', ProfileControllers.preview);
router.get('/edit-profile-data', ProfileControllers.editProfileData);

router.put('/edit', ProfileControllers.edit);
router.put('/name', EditNameSchema, ProfileControllers.editName);
router.put('/bio', UpdateBioSchema, ProfileControllers.updateBio);
router.put('/dob', UpdateDOBSchema, ProfileControllers.updateDOB);

router.post('/photos', MultipartService, ProfileControllers.addPhoto);
router.delete('/photos', RemovePhotoSchema, ProfileControllers.removePhoto);
router.put('/photos/reorder', ReorderPhotosSchema, ProfileControllers.reorderPhotos);

router.post('/prompt', UpdatePromptSchema, ProfileControllers.updatePrompt);

router.put('/interests', UpdateInterestsSchema, ProfileControllers.updateInterests);
router.put('/languages', UpdateLanguagesSchema, ProfileControllers.updateLanguages);

router.put('/gender', UpdateGenderSchema, ProfileControllers.updateGender);
router.put('/pronouns', UpdatePronounsSchema, ProfileControllers.updatePronouns);
router.put('/sexuality', UpdateSexualitySchema, ProfileControllers.updateSexuality);
router.put('/zodiac-sign', UpdateZodiacSignSchema, ProfileControllers.updateZodiacSign);
router.put('/ethnicities', UpdateEthnicitiesSchema, ProfileControllers.updateEthnicities);
router.put('/religion', UpdateReligionSchema, ProfileControllers.updateReligion);
router.put('/political-view', UpdatePoliticalViewSchema, ProfileControllers.updatePoliticalView);

router.put('/height', UpdateHeightSchema, ProfileControllers.updateHeight);
router.put('/work', UpdateWorkSchema, ProfileControllers.updateWork);
router.put('/school', UpdateSchoolSchema, ProfileControllers.updateSchool);
router.put('/education', UpdateEducationSchema, ProfileControllers.updateEducation);
router.put('/location', UpdateLocationSchema, ProfileControllers.updateLocation);

router.put('/children', UpdateChildrenSchema, ProfileControllers.updateChildren);
router.put('/family-plans', UpdateFamilyPlansSchema, ProfileControllers.updateFamilyPlans);
router.put('/pets', UpdatePetsSchema, ProfileControllers.updatePets);
router.put('/exercise', UpdateExerciseSchema, ProfileControllers.updateExercise);
router.put('/drinking-habits', UpdateDrinkingHabitsSchema, ProfileControllers.updateDrinkingHabits);
router.put('/smoking-habits', UpdateSmokingHabitsSchema, ProfileControllers.updateSmokingHabits);
router.put('/cannabis', UpdateCannabisSchema, ProfileControllers.updateCannabis);
router.put('/dietary-preferences', UpdateDietaryPreferencesSchema, ProfileControllers.updateDietaryPreferences);
router.put('/food-allergies', UpdateFoodAllergiesSchema, ProfileControllers.updateFoodAllergies);
router.put('/active-status', UpdateActiveStatusSchema, ProfileControllers.updateActiveStatus);

router.put('/love-languages', UpdateLoveLanguagesSchema, ProfileControllers.updateLoveLanguages);
router.put('/first-date-preferences', UpdateFirstDatePreferencesSchema, ProfileControllers.updateFirstDatePreferences);
router.put('/looking-for', UpdateLookingForSchema, ProfileControllers.updateLookingFor);
router.put('/relationship-type', UpdateRelationshipTypeSchema, ProfileControllers.updateRelationshipType);
router.put('/dating-expectations', UpdateDatingExpectationsSchema, ProfileControllers.updateDatingExpectations);
router.put('/first-date-distance', UpdateFirstDateDistanceSchema, ProfileControllers.updateFirstDateDistance);
router.put('/meeting-availability', UpdateMeetingAvailabilitySchema, ProfileControllers.updateMeetingAvailability);

export default router;
