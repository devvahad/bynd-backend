import mongoose from 'mongoose';
import {
  RELIGIONS, ALLOWED_GENDERS, USER_ETHNICITIES, LOOKING_FOR, POLITICAL_VIEWS,
  DRINKING_HABITS, SMOKING_HABITS, CHILDREN_STATUS, FAMILY_PLANS, EDUCATION_LEVELS,
  EXERCISE_HABITS, RELATIONSHIP_TYPES, MIN_HEIGHT_CM, MAX_HEIGHT_CM, OPEN_TO_EVERYONE, CANNABIS
} from '../../constants.js';

const { Schema, model } = mongoose;

const FilterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true,
    },

    basicFilters: {
      distance: {
        type: Number, min: 0, max: 30, default: 30,
      },
      ageRange: {
        min: {
          type: Number, min: 18, max: 90, default: 18,
        },
        max: {
          type: Number, min: 18, max: 90, default: 90,
        },
      },
      verifiedOnly: { type: Boolean, default: false },
      religions: { type: [String], enum: [...RELIGIONS, OPEN_TO_EVERYONE], default: [] },
      genders: { type: [String], enum: [...ALLOWED_GENDERS, OPEN_TO_EVERYONE], default: [] },
      ethnicities: { type: [String], enum: [...USER_ETHNICITIES, OPEN_TO_EVERYONE], default: [] },
      datingExpectations: { type: [String], enum: [...LOOKING_FOR, OPEN_TO_EVERYONE], default: [] },
      expandDistance: { type: Boolean, default: false },
      expandAge: { type: Boolean, default: false },
    },

    // Advanced filters — premium users only.
    advancedFilters: {
      heightRange: {
        min: {
          type: Number, min: MIN_HEIGHT_CM, max: MAX_HEIGHT_CM, default: MIN_HEIGHT_CM,
        },
        max: {
          type: Number, min: MIN_HEIGHT_CM, max: MAX_HEIGHT_CM, default: MAX_HEIGHT_CM,
        },
      },
      politicalViews: { type: [String], enum: [...POLITICAL_VIEWS, OPEN_TO_EVERYONE], default: [] },
      drinkingHabits: { type: [String], enum: [...DRINKING_HABITS, OPEN_TO_EVERYONE], default: [] },
      smokingHabits: { type: [String], enum: [...SMOKING_HABITS, OPEN_TO_EVERYONE], default: [] },
      children: { type: [String], enum: [...CHILDREN_STATUS, OPEN_TO_EVERYONE], default: [] },
      familyPlans: { type: [String], enum: [...FAMILY_PLANS, OPEN_TO_EVERYONE], default: [] },
      education: { type: [String], enum: [...EDUCATION_LEVELS, OPEN_TO_EVERYONE], default: [] },
      exercise: { type: [String], enum: [...EXERCISE_HABITS, OPEN_TO_EVERYONE], default: [] },
      relationshipType: { type: [String], enum: [...RELATIONSHIP_TYPES, OPEN_TO_EVERYONE], default: [] },
      cannabis: { type: [String], enum: [...CANNABIS, OPEN_TO_EVERYONE], default: [] },
      languages: { type: [String], default: [] },
      expandHeight: { type: Boolean, default: false },
    },

    isFilterActive: { type: Boolean, default: false },
    lastAppliedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } },
);

FilterSchema.pre('save', function preSave(next) {
  const { basicFilters } = this;

  this.isFilterActive = Boolean(
    basicFilters.distance < 30
    || basicFilters.ageRange.min > 18
    || basicFilters.ageRange.max < 90
    || basicFilters.verifiedOnly === true
    || basicFilters.religions?.length > 0
    || basicFilters.genders?.length > 0
    || basicFilters.ethnicities?.length > 0
    || basicFilters.datingExpectations?.length > 0,
  );
  this.lastAppliedAt = Date.now();
  next();
});

const FilterModel = model('Filter', FilterSchema);

export default FilterModel;
