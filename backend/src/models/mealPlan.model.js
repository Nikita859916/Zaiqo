import mongoose from 'mongoose';

const dailyMealSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Meal date is required'],
    },
    breakfast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    lunch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    dinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      default: null,
    },
    snacks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
    ],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Meal plan name is required'],
      trim: true,
      minlength: [2, 'Meal plan name must be at least 2 characters long'],
      maxlength: [100, 'Meal plan name cannot exceed 100 characters'],
      default: 'My Meal Plan',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    meals: {
      type: [dailyMealSchema],
      default: [],
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

// Compound index for efficient user meal-plan lookup by date range
mealPlanSchema.index({ user: 1, startDate: 1, endDate: 1 });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

export default MealPlan;
