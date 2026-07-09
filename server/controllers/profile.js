import * as ProfileModel from '../model/profile/index.js';
import { ProfileModelResolver } from './resolvers/index.js';

export default {
  getMore: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileGetMoreModel),
  safety: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileSafetyModel),
  preview: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfilePreviewModel),
  editProfileData: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileEditDataModel),

  edit: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileEditModel),
  editName: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileEditNameModel),
  updateBio: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateBioModel),

  updateInterests: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateInterestsModel),
  updateLanguages: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateLanguagesModel),
  updatePrompt: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdatePrompt),

  addPhoto: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateAddPhoto),
  removePhoto: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateRemovePhoto),
  reorderPhotos: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdatePhotoOrder),

  updateGender: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateGender),
  updatePronouns: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdatePronouns),
  updateSexuality: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateSexuality),
  updateZodiacSign: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateZodiacSign),
  updateEthnicities: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateUserEthnicities),
  updateReligion: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateReligion),
  updatePoliticalView: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdatePoliticalView),

  updateDOB: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateDOB),
  updateHeight: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateHeight),
  updateWork: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateWorkModel),
  updateSchool: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateSchoolModel),
  updateEducation: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateEducationModel),
  updateLocation: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateLocationModel),

  updateChildren: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateChildren),
  updateFamilyPlans: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateFamilyPlans),
  updatePets: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdatePets),
  updateExercise: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateExercise),
  updateDrinkingHabits: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateDrinkingHabits),
  updateSmokingHabits: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateSmokingHabits),
  updateCannabis: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateCannabis),
  updateDietaryPreferences: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateDietaryPreferences),
  updateFoodAllergies: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateFoodAllergies),
  updateActiveStatus: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateActiveStatus),

  updateLoveLanguages: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateLoveLanguages),
  updateFirstDatePreferences: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateFirstDatePreferences),
  updateLookingFor: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateLookingFor),
  updateRelationshipType: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateRelationshipType),
  updateDatingExpectations: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateDatingExpectations),
  updateFirstDateDistance: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateFirstDateDistance),
  updateMeetingAvailability: (req, res) => ProfileModelResolver(req, res, ProfileModel.ProfileUpdateMeetingAvailability),
};
