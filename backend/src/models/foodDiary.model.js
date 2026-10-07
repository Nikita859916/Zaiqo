import mongoose from 'mongoose';

export const VALID_MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
];

export const VALID_DIARY_SOURCES = [
  'FOOD_ANALYSIS',
  'MANUAL',
  'RECIPE',
];

const nutritionSnapshotSchema = new mongoose.Schema(
  {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative'],
      max: [10000, 'Calories cannot exceed 10000'],
      default: 0,
    },
    protein: {
      type: Number,
      min: [0, 'Protein cannot be negative'],
      max: [1000, 'Protein cannot exceed 1000g'],
      default: 0,
    },
    carbohydrates: {
      type: Number,
      min: [0, 'Carbohydrates cannot be negative'],
      max: [2000, 'Carbohydrates cannot exceed 2000g'],
      default: 0,
    },
    fats: {
      type: Number,
      min: [0, 'Fats cannot be negative'],
      max: [1000, 'Fats cannot exceed 1000g'],
      default: 0,
    },
    isEstimated: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const portionSnapshotSchema = new mongoose.Schema(
  {
    servingSize: {
      type: String,
      trim: true,
      default: '1 serving',
    },
    estimatedWeightGrams: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
      max: [5000, 'Weight cannot exceed 5000g'],
      default: null,
    },
  },
  { _id: false }
);

const userEditMetadataSchema = new mongoose.Schema(
  {
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    originalNutrition: {
      type: nutritionSnapshotSchema,
      default: null,
    },
  },
  { _id: false }
);

const foodDiarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      minlength: [1, 'Food name cannot be empty'],
      maxlength: [150, 'Food name cannot exceed 150 characters'],
    },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: {
        values: VALID_MEAL_TYPES,
        message: '{VALUE} is not a valid meal type',
      },
      lowercase: true,
      trim: true,
      index: true,
    },
    consumedAt: {
      type: Date,
      required: [true, 'Consumed date is required'],
      default: Date.now,
      index: true,
    },
    portion: {
      type: portionSnapshotSchema,
      default: () => ({
        servingSize: '1 serving',
        estimatedWeightGrams: null,
      }),
    },
    nutrition: {
      type: nutritionSnapshotSchema,
      required: [true, 'Nutrition data is required'],
      default: () => ({
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fats: 0,
        isEstimated: true,
      }),
    },
    ingredients: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      required: [true, 'Diary entry source is required'],
      enum: {
        values: VALID_DIARY_SOURCES,
        message: '{VALUE} is not a valid diary source',
      },
      default: 'MANUAL',
      index: true,
    },
    analysisRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodAnalysis',
      default: null,
      index: true,
    },
    recipeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    userEdits: {
      type: userEditMetadataSchema,
      default: () => ({
        isEdited: false,
        editedAt: null,
        originalNutrition: null,
      }),
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

// Compound indexes for user chronological queries and meal type filtering
foodDiarySchema.index({ user: 1, consumedAt: -1 });
foodDiarySchema.index({ user: 1, mealType: 1, consumedAt: -1 });

const FoodDiary = mongoose.model('FoodDiary', foodDiarySchema);

export default FoodDiary;
