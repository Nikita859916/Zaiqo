import mongoose from 'mongoose';

const detectedFoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Detected food name is required'],
      trim: true,
    },
    // Portions and quantities from images are approximate estimates
    estimatedQuantity: {
      type: Number,
      min: [0, 'Estimated quantity cannot be negative'],
      default: 1,
    },
    unit: {
      type: String,
      trim: true,
      default: 'serving',
    },
    confidence: {
      type: Number,
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
  },
  { _id: false }
);

// Macro & calorie estimates (approximate nutritional estimations)
const nutritionSchema = new mongoose.Schema(
  {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative'],
      default: 0,
    },
    protein: {
      type: Number,
      min: [0, 'Protein cannot be negative'],
      default: 0,
    },
    carbohydrates: {
      type: Number,
      min: [0, 'Carbohydrates cannot be negative'],
      default: 0,
    },
    fats: {
      type: Number,
      min: [0, 'Fats cannot be negative'],
      default: 0,
    },
    isEstimated: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const mealAnalysisSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    observations: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    mealType: {
      type: String,
      trim: true,
      default: null,
    },
    cuisine: {
      type: String,
      trim: true,
      default: null,
    },
    isPlantBased: {
      type: Boolean,
      default: null,
    },
  },
  { _id: false }
);

const portionSchema = new mongoose.Schema(
  {
    servingSize: {
      type: String,
      default: '1 serving',
    },
    estimatedWeightGrams: {
      type: Number,
      min: [0, 'Estimated weight cannot be negative'],
      default: null,
    },
    visualScale: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const confidenceSchema = new mongoose.Schema(
  {
    overall: {
      type: Number,
      min: [0, 'Overall confidence must be between 0 and 1'],
      max: [1, 'Overall confidence must be between 0 and 1'],
      default: 0,
    },
    level: {
      type: String,
      enum: {
        values: ['none', 'low', 'medium', 'high'],
        message: '{VALUE} is not a valid confidence level',
      },
      default: 'low',
    },
    isReliable: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const providerMetadataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    model: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

const foodAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    image: {
      mimeType: {
        type: String,
        required: [true, 'Image MIME type is required'],
      },
      size: {
        type: Number,
        required: [true, 'Image size is required'],
      },
      originalName: {
        type: String,
        trim: true,
      },
    },
    dish: {
      type: dishSchema,
      default: null,
    },
    detectedFoods: {
      type: [detectedFoodSchema],
      default: [],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    portion: {
      type: portionSchema,
      default: () => ({
        servingSize: '1 serving',
        estimatedWeightGrams: null,
        visualScale: null,
      }),
    },
    nutrition: {
      type: nutritionSchema,
      default: null,
    },
    mealAnalysis: {
      type: mealAnalysisSchema,
      default: null,
    },
    confidence: {
      type: confidenceSchema,
      default: () => ({
        overall: 0,
        level: 'low',
        isReliable: false,
      }),
    },
    warnings: {
      type: [String],
      default: [],
    },
    uncertaintyNotes: {
      type: String,
      default: 'Portions and nutritional values are approximate visual estimates.',
    },
    provider: {
      type: providerMetadataSchema,
      default: null,
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

// Compound index for user history retrieval ordered by most recent first
foodAnalysisSchema.index({ user: 1, createdAt: -1 });

const FoodAnalysis = mongoose.model('FoodAnalysis', foodAnalysisSchema);

export default FoodAnalysis;
