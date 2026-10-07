import mongoose from 'mongoose';

export const VALID_GROCERY_CATEGORIES = [
  'vegetables',
  'fruits',
  'dairy',
  'grains',
  'protein',
  'spices',
  'spices & condiments',
  'beverages',
  'snacks',
  'other',
];

export const VALID_GROCERY_SOURCES = [
  'manual',
  'recipe',
  'meal-plan',
  'system',
];

const groceryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [1, 'Item name cannot be empty'],
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 1,
    },
    unit: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      lowercase: true,
      trim: true,
      default: 'other',
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

const groceryListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Grocery list name is required'],
      trim: true,
      minlength: [2, 'Grocery list name must be at least 2 characters long'],
      maxlength: [100, 'Grocery list name cannot exceed 100 characters'],
      default: 'My Grocery List',
    },
    source: {
      type: String,
      enum: {
        values: VALID_GROCERY_SOURCES,
        message: '{VALUE} is not a valid grocery source',
      },
      lowercase: true,
      default: 'manual',
      index: true,
    },
    items: {
      type: [groceryItemSchema],
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

// Compound index for user grocery lists ordered by recency
groceryListSchema.index({ user: 1, createdAt: -1 });

const GroceryList = mongoose.model('GroceryList', groceryListSchema);

export default GroceryList;
