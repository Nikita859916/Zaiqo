import mongoose from 'mongoose';
import {
  VALID_DIETARY_PREFERENCES,
  VALID_WELLNESS_GOALS,
  VALID_COOKING_TIMES,
  VALID_SPICE_LEVELS,
} from '../utils/preferenceValidation.js';

const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true,
      index: true,
    },
    dietaryPreference: {
      type: String,
      enum: {
        values: VALID_DIETARY_PREFERENCES,
        message: '{VALUE} is not a supported dietary preference',
      },
      default: 'no-preference',
      lowercase: true,
      trim: true,
    },
    wellnessGoals: {
      type: [
        {
          type: String,
          enum: {
            values: VALID_WELLNESS_GOALS,
            message: '{VALUE} is not a supported wellness goal',
          },
          lowercase: true,
          trim: true,
        },
      ],
      default: ['general-wellness'],
    },
    allergies: {
      type: [String],
      default: [],
    },
    foodsToAvoid: {
      type: [String],
      default: [],
    },
    preferredCuisines: {
      type: [String],
      default: [],
    },
    cookingTime: {
      type: String,
      enum: {
        values: VALID_COOKING_TIMES,
        message: '{VALUE} is not a valid cooking time interval',
      },
      default: 'no-preference',
      lowercase: true,
      trim: true,
    },
    spiceLevel: {
      type: String,
      enum: {
        values: VALID_SPICE_LEVELS,
        message: '{VALUE} is not a valid spice level',
      },
      default: 'medium',
      lowercase: true,
      trim: true,
    },
    dailyNutritionTargets: {
      calories: {
        type: Number,
        min: [0, 'Calories cannot be negative'],
        max: [10000, 'Calories cannot exceed 10000'],
        default: null,
      },
      proteinGrams: {
        type: Number,
        min: [0, 'Protein cannot be negative'],
        max: [1000, 'Protein cannot exceed 1000g'],
        default: null,
      },
      carbsGrams: {
        type: Number,
        min: [0, 'Carbohydrates cannot be negative'],
        max: [2000, 'Carbohydrates cannot exceed 2000g'],
        default: null,
      },
      fatsGrams: {
        type: Number,
        min: [0, 'Fats cannot be negative'],
        max: [1000, 'Fats cannot exceed 1000g'],
        default: null,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);

export default UserPreference;
