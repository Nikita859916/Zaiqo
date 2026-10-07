import mongoose from 'mongoose';

const savedRecipeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: [true, 'Recipe reference is required'],
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

// Compound unique index ensuring a user cannot save the same recipe multiple times
savedRecipeSchema.index({ user: 1, recipe: 1 }, { unique: true });

const SavedRecipe = mongoose.model('SavedRecipe', savedRecipeSchema);

export default SavedRecipe;
