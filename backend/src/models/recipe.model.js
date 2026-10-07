import mongoose from 'mongoose';
import {
  VALID_MEAL_TYPES,
  VALID_DIFFICULTIES,
  VALID_SOURCES,
} from '../utils/recipeValidation.js';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Ingredient quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      enum: [
        'produce',
        'dairy',
        'meat',
        'bakery',
        'pantry',
        'canned',
        'beverages',
        'frozen',
        'other',
      ],
      default: 'other',
    },
  },
  { _id: false }
);

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, min: 0, default: 0 },
    protein: { type: Number, min: 0, default: 0 },
    carbohydrates: { type: Number, min: 0, default: 0 },
    fats: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Recipe name is required'],
      trim: true,
      minlength: [2, 'Recipe name must be at least 2 characters long'],
      maxlength: [120, 'Recipe name cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    image: {
      type: String,
      trim: true,
      default: '',
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
    dietaryTags: {
      type: [String],
      default: [],
      lowercase: true,
      index: true,
    },
    ingredients: {
      type: [ingredientSchema],
      required: [true, 'Recipe must have at least one ingredient'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Recipe must contain at least one ingredient',
      },
    },
    instructions: {
      type: [String],
      required: [true, 'Recipe must have at least one instruction step'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Recipe must contain at least one instruction step',
      },
    },
    prepTime: {
      type: Number,
      min: [0, 'Prep time cannot be negative'],
      default: 0,
    },
    cookTime: {
      type: Number,
      min: [0, 'Cook time cannot be negative'],
      default: 0,
      index: true,
    },
    totalTime: {
      type: Number,
      min: [0, 'Total time cannot be negative'],
      default: 0,
    },
    servings: {
      type: Number,
      min: [1, 'Servings must be at least 1'],
      default: 1,
    },
    nutrition: {
      type: nutritionSchema,
      default: () => ({ calories: 0, protein: 0, carbohydrates: 0, fats: 0 }),
    },
    cuisine: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'other',
      index: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: VALID_DIFFICULTIES,
        message: '{VALUE} is not a valid difficulty level',
      },
      lowercase: true,
      default: 'medium',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    source: {
      type: String,
      enum: {
        values: VALID_SOURCES,
        message: '{VALUE} is not a valid recipe source',
      },
      lowercase: true,
      default: 'system',
      index: true,
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

// Automatically calculate totalTime if missing
recipeSchema.pre('save', function (next) {
  if (!this.totalTime || this.totalTime === 0) {
    this.totalTime = (this.prepTime || 0) + (this.cookTime || 0);
  }
  next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;
