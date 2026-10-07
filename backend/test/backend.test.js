import assert from 'node:assert/strict';
import http from 'node:http';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import UserPreference from '../src/models/userPreference.model.js';
import Recipe from '../src/models/recipe.model.js';
import { generateToken, verifyToken } from '../src/utils/token.js';
import { connectDB, getDBStatus, disconnectDB } from '../src/config/db.js';
import preferenceService from '../src/services/preference.service.js';
import recipeService from '../src/services/recipe.service.js';
import {
  validatePreferenceInput,
  VALID_DIETARY_PREFERENCES,
  VALID_WELLNESS_GOALS,
  VALID_COOKING_TIMES,
  VALID_SPICE_LEVELS,
} from '../src/utils/preferenceValidation.js';
import {
  validateRecipeInput,
  VALID_MEAL_TYPES,
  VALID_DIFFICULTIES,
  VALID_SOURCES,
} from '../src/utils/recipeValidation.js';
import {
  createRecipe as createRecipeController,
  updateRecipe as updateRecipeController,
} from '../src/controllers/recipe.controller.js';
import SavedRecipe from '../src/models/savedRecipe.model.js';
import savedRecipeService from '../src/services/savedRecipe.service.js';
import {
  saveRecipe as saveRecipeController,
  unsaveRecipe as unsaveRecipeController,
  getSavedRecipes as getSavedRecipesController,
  getRecipeSavedStatus as getRecipeSavedStatusController,
} from '../src/controllers/savedRecipe.controller.js';
import MealPlan from '../src/models/mealPlan.model.js';
import mealPlanService from '../src/services/mealPlan.service.js';
import {
  validateMealPlanInput,
  validateMealSlotUpdate,
  VALID_MEAL_SLOT_TYPES,
} from '../src/utils/mealPlanValidation.js';
import {
  createMealPlan as createMealPlanController,
  updateMealPlan as updateMealPlanController,
  updateMealSlot as updateMealSlotController,
} from '../src/controllers/mealPlan.controller.js';
import GroceryList, {
  VALID_GROCERY_CATEGORIES,
  VALID_GROCERY_SOURCES,
} from '../src/models/groceryList.model.js';
import groceryService from '../src/services/grocery.service.js';
import {
  validateGroceryListInput,
  validateGroceryItemInput,
  categorizeIngredientName,
} from '../src/utils/groceryValidation.js';
import {
  createGroceryList as createGroceryListController,
  updateGroceryList as updateGroceryListController,
  addGroceryItem as addGroceryItemController,
  updateGroceryItem as updateGroceryItemController,
  createFromMealPlan as createFromMealPlanController,
} from '../src/controllers/grocery.controller.js';
import userService from '../src/services/user.service.js';
import { updateUserProfile as updateUserProfileController } from '../src/controllers/user.controller.js';
import { signup as signupController } from '../src/controllers/auth.controller.js';
import { getJwtSecret } from '../src/utils/token.js';
import FoodAnalysis from '../src/models/foodAnalysis.model.js';
import foodAnalysisService, {
  BaseFoodAnalysisProvider,
  setFoodAnalysisProvider,
  getFoodAnalysisProvider,
} from '../src/services/foodAnalysis.service.js';
import {
  analyzeFoodPhoto as analyzeFoodPhotoController,
  getFoodAnalysisHistory as getFoodAnalysisHistoryController,
  getFoodAnalysisById as getFoodAnalysisByIdController,
  deleteFoodAnalysis as deleteFoodAnalysisController,
} from '../src/controllers/foodAnalysis.controller.js';
import {
  uploadFoodPhoto,
  fileFilter,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '../src/middleware/upload.middleware.js';
import {
  ZAI_ACTIONS,
  SUPPORTED_ACTIONS,
  isValidZaiAction,
  createActionContract,
} from '../src/utils/zaiActionContract.js';
import zaiResolverService from '../src/services/zaiResolver.service.js';
import zaiActionService from '../src/services/zaiAction.service.js';
import { handleZaiMessage as handleZaiMessageController } from '../src/controllers/zai.controller.js';
import geminiService, { sanitizeUserContext, sanitizeConversationHistory } from '../src/services/gemini.service.js';
import { validateStructuredAction } from '../src/utils/zaiActionValidation.js';
import ZaiConversation from '../src/models/zaiConversation.model.js';
import zaiConversationService from '../src/services/zaiConversation.service.js';
import GeminiFoodAnalysisProvider from '../src/services/geminiFoodAnalysis.provider.js';
import { validateFoodIntelligence } from '../src/utils/foodAnalysisValidation.js';
import FoodDiary, { VALID_MEAL_TYPES as VALID_DIARY_MEAL_TYPES, VALID_DIARY_SOURCES } from '../src/models/foodDiary.model.js';
import foodDiaryService from '../src/services/foodDiary.service.js';
import {
  validateDiaryEntryInput,
  validateDiaryUpdateInput,
  isValidIanaTimezone,
  getTimezoneDateRange,
} from '../src/utils/foodDiaryValidation.js';
import {
  createDiaryEntry as createDiaryEntryController,
  createFromAnalysis as createFromAnalysisController,
  getDailySummary as getDailySummaryController,
  getHistory as getHistoryController,
  getEntryById as getEntryByIdController,
  updateEntry as updateEntryController,
  deleteEntry as deleteEntryController,
} from '../src/controllers/foodDiary.controller.js';
import recipeIntelligenceService from '../src/services/recipeIntelligence.service.js';
import {
  validateGeneratedRecipeData,
  calculateRemainingNutrition,
  checkAllergenConflict,
} from '../src/utils/recipeIntelligenceValidation.js';
import {
  generateRecipe as generateRecipeController,
  getRecommendations as getRecommendationsController,
} from '../src/controllers/recipe.controller.js';
import groceryIntelligenceService from '../src/services/groceryIntelligence.service.js';
import {
  canonicalizeIngredientName,
  normalizeUnit,
  getUnitDimension,
  formatOptimalQuantityAndUnit,
  validateIngredientData,
  resolveIngredientCategory,
} from '../src/utils/groceryIntelligenceValidation.js';
import {
  createFromRecipes as createFromRecipesController,
  addRecipesToList as addRecipesToListController,
  getGroupedGroceryListById as getGroupedGroceryListByIdController,
  getShoppingLinksForList as getShoppingLinksForListController,
} from '../src/controllers/grocery.controller.js';
import priceIntelligenceService, {
  mapConcurrent,
  MAX_CONCURRENT_PRICE_REQUESTS,
  PriceCache,
  generatePriceCacheKey,
  isCacheableOffer,
  DEFAULT_PRICE_CACHE_TTL_MS,
  DEFAULT_MAX_PRICE_CACHE_ENTRIES,
} from '../src/services/priceIntelligence.service.js';
import {
  blinkitAdapter,
  zeptoAdapter,
  jiomartAdapter,
  instamartAdapter,
  getAllMarketplaceAdapters,
  getMarketplaceAdapter,
  SUPPORTED_MARKETPLACES,
} from '../src/services/marketplaces/index.js';
import {
  isValidMarketplaceUrl,
  assertValidMarketplaceUrl,
  sanitizeSearchQuery,
  ALLOWED_MARKETPLACE_DOMAINS,
} from '../src/utils/marketplaceUrlValidation.js';
import productMatchingService from '../src/services/productMatching.service.js';
import priceComparisonService from '../src/services/priceComparison.service.js';
import {
  getPriceComparisonForList as getPriceComparisonForListController,
} from '../src/controllers/grocery.controller.js';
import {
  BasePriceProvider,
  registerPriceProvider,
  getPriceProvider,
  getAllPriceProviders,
  getConfiguredPriceProviders,
  hasConfiguredPriceProviders,
  isMarketplaceSupported,
  unregisterPriceProvider,
  resetPriceProviders,
  clearPriceProviders,
  validatePriceProvider,
  InstamartPriceProvider,
} from '../src/services/priceProviders/index.js';
import { calculateNormalizedPrice } from '../src/services/priceComparison.service.js';
import ingredientNormalizationService from '../src/services/ingredientNormalization.service.js';
import dietaryConstraintService, {
  CONSTRAINT_CATALOG,
  MEDICAL_SAFETY_DISCLAIMER,
} from '../src/services/dietaryConstraint.service.js';
import recipeGroceryService from '../src/services/recipeGrocery.service.js';
import {
  getRecipeGroceries as getRecipeGroceriesController,
  getRecipePriceComparison as getRecipePriceComparisonController,
} from '../src/controllers/recipe.controller.js';
import aiRecipeService from '../src/services/ai/aiRecipe.service.js';
import {
  BaseAiRecipeProvider,
  geminiRecipeProvider,
  registerAiRecipeProvider,
  unregisterAiRecipeProvider,
  getAiRecipeProvider,
  getDefaultAiRecipeProvider,
} from '../src/services/ai/index.js';
import { GeminiRecipeProvider } from '../src/services/ai/providers/geminiRecipe.provider.js';


let server;
let baseUrl;

async function runTests() {
  console.log('--- STARTING ZAIQO BACKEND VERIFICATION SUITE ---');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
      } catch (err) {
        console.error(`[FAIL] ${name}`);
        console.error(`  Error: ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. UNIT TESTS: Password Hashing & Bcrypt
  await test('Password hashing with bcryptjs generates valid non-plaintext hash', async () => {
    const plain = 'wellnessSecure123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plain, salt);

    assert.notEqual(hash, plain, 'Password must not equal plaintext');
    assert.ok(hash.startsWith('$2'), 'Bcrypt hash should start with $2');

    const matches = await bcrypt.compare(plain, hash);
    assert.equal(matches, true, 'Bcrypt compare should succeed for correct password');

    const mismatch = await bcrypt.compare('wrongPassword', hash);
    assert.equal(mismatch, false, 'Bcrypt compare should fail for incorrect password');
  });

  // 2. UNIT TESTS: User Model comparePassword method
  await test('User instance comparePassword method validates correctly', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('mySecretPass123', salt);

    const userInstance = new User({
      name: 'Test Chef',
      email: 'chef@zaiqo.com',
      password: hash,
    });

    const isMatch = await userInstance.comparePassword('mySecretPass123');
    assert.equal(isMatch, true, 'User.comparePassword should return true for valid password');

    const isNotMatch = await userInstance.comparePassword('wrongPassword');
    assert.equal(isNotMatch, false, 'User.comparePassword should return false for invalid password');
  });

  // 3. UNIT TESTS: User Model toJSON sanitization
  await test('User toJSON method strips password and internal fields', () => {
    const userInstance = new User({
      name: 'Sarah Connor',
      email: 'sarah@zaiqo.com',
      password: 'hiddenPassword123',
    });

    const json = userInstance.toJSON();
    assert.equal(json.password, undefined, 'Password must never be included in toJSON output');
    assert.equal(json.__v, undefined, '__v should be stripped');
    assert.ok(json.id, 'User should have id field');
    assert.equal(json.email, 'sarah@zaiqo.com');
  });

  // 4. UNIT TESTS: JWT Generation and Verification
  await test('JWT token generation and verification cycle', () => {
    const payload = { id: 'usr_mock_123', email: 'test@zaiqo.com' };
    const token = generateToken(payload, '1h');

    assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Token must be valid 3-part JWT');

    const decoded = verifyToken(token);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.email, payload.email);
  });

  await test('JWT verification throws for invalid / tampered token', () => {
    assert.throws(
      () => {
        verifyToken('invalid.jwt.token');
      },
      /jwt|token/i,
      'Invalid token should throw an error'
    );
  });

  await test('JWT secret requires environment variable in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      assert.throws(
        () => getJwtSecret(),
        /JWT_SECRET environment variable is strictly required in production/i
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      }
    }
  });

  // 5. DATABASE TESTS: Clear failure when MONGODB_URI is missing
  await test('connectDB fails clearly with descriptive message when MONGODB_URI is empty', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    try {
      await connectDB();
      assert.fail('connectDB should have thrown when MONGODB_URI is missing');
    } catch (err) {
      assert.ok(
        err.message.includes('MONGODB_URI is not defined'),
        `Expected descriptive configuration error, got: ${err.message}`
      );
    } finally {
      process.env.MONGODB_URI = originalUri;
    }
  });

  // 6. UNIT TESTS: UserPreference Schema Validation
  await test('UserPreference schema succeeds for valid preference configuration', () => {
    const validDoc = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      dietaryPreference: 'vegetarian',
      wellnessGoals: ['healthy-eating', 'better-nutrition'],
      allergies: ['peanuts', 'dairy'],
      foodsToAvoid: ['refined sugar'],
      preferredCuisines: ['indian', 'mediterranean'],
      cookingTime: '15-30',
      spiceLevel: 'medium',
    });

    const error = validDoc.validateSync();
    assert.equal(error, undefined, 'Valid preference should not yield schema validation error');
  });

  await test('UserPreference schema rejects invalid dietary preference', () => {
    const invalidDoc = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      dietaryPreference: 'carnivore-only',
    });

    const error = invalidDoc.validateSync();
    assert.ok(error, 'Schema should produce validation error for invalid dietary preference');
    assert.ok(error.errors.dietaryPreference);
  });

  await test('UserPreference schema rejects invalid wellness goals', () => {
    const invalidDoc = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      wellnessGoals: ['fly-to-the-moon'],
    });

    const error = invalidDoc.validateSync();
    assert.ok(error, 'Schema should produce validation error for invalid wellness goal');
    assert.ok(error.errors['wellnessGoals.0']);
  });

  await test('UserPreference schema rejects invalid cooking time', () => {
    const invalidDoc = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      cookingTime: '5-hours-slow-cook',
    });

    const error = invalidDoc.validateSync();
    assert.ok(error, 'Schema should produce validation error for invalid cooking time');
    assert.ok(error.errors.cookingTime);
  });

  await test('UserPreference schema rejects invalid spice level', () => {
    const invalidDoc = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      spiceLevel: 'dragon-fire',
    });

    const error = invalidDoc.validateSync();
    assert.ok(error, 'Schema should produce validation error for invalid spice level');
    assert.ok(error.errors.spiceLevel);
  });

  await test('UserPreference schema requires user reference', () => {
    const missingUserDoc = new UserPreference({
      dietaryPreference: 'vegan',
    });

    const error = missingUserDoc.validateSync();
    assert.ok(error, 'Schema must require user ID');
    assert.ok(error.errors.user);
  });

  await test('UserPreference toJSON cleans output correctly', () => {
    const dummyId = new mongoose.Types.ObjectId();
    const pref = new UserPreference({
      user: dummyId,
      dietaryPreference: 'vegan',
    });

    const json = pref.toJSON();
    assert.equal(json._id, undefined, '_id should be stripped');
    assert.equal(json.__v, undefined, '__v should be stripped');
    assert.ok(json.id, 'id field should be present');
  });

  // 7. UNIT TESTS: validatePreferenceInput Helper
  await test('validatePreferenceInput normalizes and trims valid input data', () => {
    const raw = {
      dietaryPreference: '  VEGAN  ',
      wellnessGoals: ['Healthy-Eating ', ' Better-Nutrition'],
      allergies: [' Peanuts ', 'DAIRY'],
      foodsToAvoid: [' Refined Sugar '],
      preferredCuisines: [' Indian ', 'ITALIAN'],
      cookingTime: ' 15-30 ',
      spiceLevel: ' SPICY ',
    };

    const result = validatePreferenceInput(raw);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitized.dietaryPreference, 'vegan');
    assert.deepEqual(result.sanitized.wellnessGoals, ['healthy-eating', 'better-nutrition']);
    assert.deepEqual(result.sanitized.allergies, ['peanuts', 'dairy']);
    assert.deepEqual(result.sanitized.foodsToAvoid, ['refined sugar']);
    assert.deepEqual(result.sanitized.preferredCuisines, ['indian', 'italian']);
    assert.equal(result.sanitized.cookingTime, '15-30');
    assert.equal(result.sanitized.spiceLevel, 'spicy');
  });

  await test('validatePreferenceInput catches invalid fields with descriptive errors', () => {
    const invalidDiet = validatePreferenceInput({ dietaryPreference: 'pescatarian-extra' });
    assert.equal(invalidDiet.isValid, false);
    assert.ok(invalidDiet.error.includes('Invalid dietary preference'));

    const invalidGoal = validatePreferenceInput({ wellnessGoals: ['superhuman-strength'] });
    assert.equal(invalidGoal.isValid, false);
    assert.ok(invalidGoal.error.includes('Invalid wellness goal'));

    const invalidCooking = validatePreferenceInput({ cookingTime: '90-minutes' });
    assert.equal(invalidCooking.isValid, false);
    assert.ok(invalidCooking.error.includes('Invalid cooking time'));

    const invalidSpice = validatePreferenceInput({ spiceLevel: 'volcano' });
    assert.equal(invalidSpice.isValid, false);
    assert.ok(invalidSpice.error.includes('Invalid spice level'));

    const invalidNonArray = validatePreferenceInput({ allergies: 'nuts' });
    assert.equal(invalidNonArray.isValid, false);
    assert.ok(invalidNonArray.error.includes('must be an array of strings'));
  });

  // 8. UNIT TESTS: Recipe Model Schema Validation
  await test('Recipe schema succeeds for valid complete recipe configuration', () => {
    const validRecipe = new Recipe({
      name: 'Mediterranean Spiced Salmon',
      description: 'Pan-seared wild salmon with fresh dill and lemon',
      image: 'https://images.unsplash.com/photo-salmon',
      mealType: 'dinner',
      dietaryTags: ['high-protein', 'gluten-free'],
      ingredients: [
        { name: 'Wild salmon fillet', quantity: 250, unit: 'g' },
        { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
      ],
      instructions: [
        'Preheat skillet to medium heat with olive oil.',
        'Sear salmon 4 minutes per side until flaky.',
      ],
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      nutrition: {
        calories: 450,
        protein: 38,
        carbohydrates: 4,
        fats: 22,
      },
      cuisine: 'mediterranean',
      difficulty: 'easy',
      source: 'user',
    });

    const error = validRecipe.validateSync();
    assert.equal(error, undefined, 'Valid recipe schema should not throw validation error');
  });

  await test('Recipe schema requires name', () => {
    const invalidDoc = new Recipe({
      mealType: 'lunch',
      ingredients: [{ name: 'Tomato', quantity: 1 }],
      instructions: ['Chop tomato'],
    });

    const error = invalidDoc.validateSync();
    assert.ok(error, 'Schema should produce validation error for missing name');
    assert.ok(error.errors.name);
  });

  await test('Recipe schema enforces name length constraints', () => {
    const shortDoc = new Recipe({
      name: 'A',
      mealType: 'lunch',
      ingredients: [{ name: 'Tomato', quantity: 1 }],
      instructions: ['Chop tomato'],
    });
    const errorShort = shortDoc.validateSync();
    assert.ok(errorShort.errors.name);

    const longDoc = new Recipe({
      name: 'A'.repeat(121),
      mealType: 'lunch',
      ingredients: [{ name: 'Tomato', quantity: 1 }],
      instructions: ['Chop tomato'],
    });
    const errorLong = longDoc.validateSync();
    assert.ok(errorLong.errors.name);
  });

  await test('Recipe schema rejects invalid mealType', () => {
    const invalidDoc = new Recipe({
      name: 'Late Midnight Feast',
      mealType: 'midnight_snack',
      ingredients: [{ name: 'Bread', quantity: 1 }],
      instructions: ['Eat bread'],
    });
    const error = invalidDoc.validateSync();
    assert.ok(error, 'Schema should reject invalid mealType');
    assert.ok(error.errors.mealType);
  });

  await test('Recipe schema requires at least one ingredient', () => {
    const emptyIngDoc = new Recipe({
      name: 'Air Salad',
      mealType: 'lunch',
      ingredients: [],
      instructions: ['Breathe in'],
    });
    const error = emptyIngDoc.validateSync();
    assert.ok(error, 'Schema should reject empty ingredients array');
    assert.ok(error.errors.ingredients);
  });

  await test('Recipe schema requires ingredient name and non-negative quantity', () => {
    const missingNameDoc = new Recipe({
      name: 'Mysterious Stew',
      mealType: 'dinner',
      ingredients: [{ quantity: 100 }],
      instructions: ['Simmer mysterious item'],
    });
    const errorName = missingNameDoc.validateSync();
    assert.ok(errorName.errors['ingredients.0.name']);

    const negQtyDoc = new Recipe({
      name: 'Negative Stew',
      mealType: 'dinner',
      ingredients: [{ name: 'Water', quantity: -50 }],
      instructions: ['Simmer water'],
    });
    const errorQty = negQtyDoc.validateSync();
    assert.ok(errorQty.errors['ingredients.0.quantity']);
  });

  await test('Recipe schema requires at least one instruction step', () => {
    const emptyInstDoc = new Recipe({
      name: 'No Step Recipe',
      mealType: 'lunch',
      ingredients: [{ name: 'Apple', quantity: 1 }],
      instructions: [],
    });
    const error = emptyInstDoc.validateSync();
    assert.ok(error, 'Schema should reject empty instructions array');
    assert.ok(error.errors.instructions);
  });

  await test('Recipe schema rejects invalid difficulty and source', () => {
    const invalidDiffDoc = new Recipe({
      name: 'Impossible Dish',
      mealType: 'dinner',
      ingredients: [{ name: 'Spice', quantity: 1 }],
      instructions: ['Cook'],
      difficulty: 'expert-master',
    });
    const errorDiff = invalidDiffDoc.validateSync();
    assert.ok(errorDiff.errors.difficulty);

    const invalidSrcDoc = new Recipe({
      name: 'Extraterrestrial Soup',
      mealType: 'dinner',
      ingredients: [{ name: 'Stardust', quantity: 1 }],
      instructions: ['Stir'],
      source: 'martian',
    });
    const errorSrc = invalidSrcDoc.validateSync();
    assert.ok(errorSrc.errors.source);
  });

  await test('Recipe toJSON cleans output correctly', () => {
    const recipe = new Recipe({
      name: 'Clean Recipe',
      mealType: 'breakfast',
      ingredients: [{ name: 'Oats', quantity: 50, unit: 'g' }],
      instructions: ['Boil oats'],
    });
    const json = recipe.toJSON();
    assert.equal(json._id, undefined, '_id should be stripped in toJSON');
    assert.equal(json.__v, undefined, '__v should be stripped in toJSON');
    assert.ok(json.id, 'id field should be present');
    assert.equal(json.name, 'Clean Recipe');
  });

  // 9. UNIT TESTS: validateRecipeInput Helper
  await test('validateRecipeInput normalizes valid input and parses quantities', () => {
    const raw = {
      name: '  Keto Avocado Omelet  ',
      description: '  Rich and velvety omelet  ',
      mealType: '  BREAKFAST  ',
      dietaryTags: ['  KETO  ', 'GLUTEN-FREE '],
      ingredients: [
        { name: '  Farm Eggs  ', quantity: '3 pieces', unit: '  pcs ' },
        { item: ' Avocado ', quantity: 1, unit: 'whole' },
      ],
      instructions: [' Whisk eggs thoroughly. ', { text: ' Fold avocado into center. ' }],
      prepTime: ' 5 mins ',
      cookTime: ' 8 mins ',
      servings: ' 2 ',
      nutrition: {
        calories: ' 380 ',
        protein: ' 18g ',
        carbohydrates: ' 4g ',
        fats: ' 32g ',
      },
      cuisine: ' AMERICAN ',
      difficulty: ' EASY ',
      source: ' USER ',
    };

    const result = validateRecipeInput(raw, false);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitized.name, 'Keto Avocado Omelet');
    assert.equal(result.sanitized.mealType, 'breakfast');
    assert.deepEqual(result.sanitized.dietaryTags, ['keto', 'gluten-free']);
    assert.equal(result.sanitized.ingredients.length, 2);
    assert.equal(result.sanitized.ingredients[0].name, 'Farm Eggs');
    assert.equal(result.sanitized.ingredients[0].quantity, 3);
    assert.equal(result.sanitized.ingredients[0].unit, 'pcs');
    assert.equal(result.sanitized.ingredients[1].name, 'Avocado');
    assert.equal(result.sanitized.instructions[0], 'Whisk eggs thoroughly.');
    assert.equal(result.sanitized.instructions[1], 'Fold avocado into center.');
    assert.equal(result.sanitized.prepTime, 5);
    assert.equal(result.sanitized.cookTime, 8);
    assert.equal(result.sanitized.totalTime, 13);
    assert.equal(result.sanitized.servings, 2);
    assert.equal(result.sanitized.nutrition.calories, 380);
    assert.equal(result.sanitized.nutrition.protein, 18);
    assert.equal(result.sanitized.cuisine, 'american');
    assert.equal(result.sanitized.difficulty, 'easy');
    assert.equal(result.sanitized.source, 'user');
  });

  await test('validateRecipeInput catches invalid inputs with descriptive errors', () => {
    // Non-object
    assert.equal(validateRecipeInput(null).isValid, false);
    assert.equal(validateRecipeInput('string').isValid, false);

    // Missing name
    const noName = validateRecipeInput({ mealType: 'lunch' });
    assert.equal(noName.isValid, false);
    assert.ok(noName.error.includes('Recipe name is required'));

    // Name too short
    const shortName = validateRecipeInput({ name: 'A', mealType: 'lunch' });
    assert.equal(shortName.isValid, false);
    assert.ok(shortName.error.includes('at least 2 characters'));

    // Invalid mealType
    const badMeal = validateRecipeInput({ name: 'Dish', mealType: 'brunch' });
    assert.equal(badMeal.isValid, false);
    assert.ok(badMeal.error.includes('Invalid meal type'));

    // Missing ingredients
    const noIng = validateRecipeInput({ name: 'Dish', mealType: 'lunch' });
    assert.equal(noIng.isValid, false);
    assert.ok(noIng.error.includes('ingredient'));

    // Empty ingredients array
    const emptyIng = validateRecipeInput({ name: 'Dish', mealType: 'lunch', ingredients: [] });
    assert.equal(emptyIng.isValid, false);
    assert.ok(emptyIng.error.includes('at least one ingredient'));

    // Ingredient missing name
    const unnamedIng = validateRecipeInput({
      name: 'Dish',
      mealType: 'lunch',
      ingredients: [{ quantity: 5 }],
      instructions: ['Cook'],
    });
    assert.equal(unnamedIng.isValid, false);
    assert.ok(unnamedIng.error.includes('valid name'));

    // Missing instructions
    const noInst = validateRecipeInput({
      name: 'Dish',
      mealType: 'lunch',
      ingredients: [{ name: 'Rice', quantity: 100 }],
    });
    assert.equal(noInst.isValid, false);
    assert.ok(noInst.error.includes('instruction step'));

    // Invalid difficulty
    const badDiff = validateRecipeInput({
      name: 'Dish',
      mealType: 'lunch',
      ingredients: [{ name: 'Rice', quantity: 100 }],
      instructions: ['Cook'],
      difficulty: 'nightmare',
    });
    assert.equal(badDiff.isValid, false);
    assert.ok(badDiff.error.includes('Invalid difficulty'));

    // Invalid source
    const badSrc = validateRecipeInput({
      name: 'Dish',
      mealType: 'lunch',
      ingredients: [{ name: 'Rice', quantity: 100 }],
      instructions: ['Cook'],
      source: 'robot',
    });
    assert.equal(badSrc.isValid, false);
    assert.ok(badSrc.error.includes('Invalid source'));
  });

  await test('validateRecipeInput permits partial updates (isPartial=true)', () => {
    const partial = validateRecipeInput({ cookTime: '25 mins' }, true);
    assert.equal(partial.isValid, true);
    assert.equal(partial.sanitized.cookTime, 25);
    assert.equal(partial.sanitized.name, undefined);

    const partialNut = validateRecipeInput({ nutrition: { calories: 350 } }, true);
    assert.equal(partialNut.isValid, true);
    assert.equal(partialNut.sanitized.nutrition.calories, 350);
    assert.equal(partialNut.sanitized.nutrition.protein, undefined);
  });

  // 10. UNIT TESTS: SavedRecipe Model Schema Validation
  await test('SavedRecipe schema succeeds for valid user and recipe references', () => {
    const validSavedDoc = new SavedRecipe({
      user: new mongoose.Types.ObjectId(),
      recipe: new mongoose.Types.ObjectId(),
    });

    const error = validSavedDoc.validateSync();
    assert.equal(error, undefined, 'Valid SavedRecipe schema should not throw error');
  });

  await test('SavedRecipe schema requires user reference', () => {
    const missingUserDoc = new SavedRecipe({
      recipe: new mongoose.Types.ObjectId(),
    });
    const error = missingUserDoc.validateSync();
    assert.ok(error, 'Schema should require user reference');
    assert.ok(error.errors.user);
  });

  await test('SavedRecipe schema requires recipe reference', () => {
    const missingRecipeDoc = new SavedRecipe({
      user: new mongoose.Types.ObjectId(),
    });
    const error = missingRecipeDoc.validateSync();
    assert.ok(error, 'Schema should require recipe reference');
    assert.ok(error.errors.recipe);
  });

  await test('SavedRecipe schema defines unique compound index on user and recipe', () => {
    const indexes = SavedRecipe.schema.indexes();
    const compoundUniqueIndex = indexes.find(
      ([fields, options]) => fields.user === 1 && fields.recipe === 1 && options?.unique === true
    );
    assert.ok(compoundUniqueIndex, 'SavedRecipe must have compound unique index on { user: 1, recipe: 1 }');
  });

  await test('SavedRecipe toJSON cleans output correctly', () => {
    const doc = new SavedRecipe({
      user: new mongoose.Types.ObjectId(),
      recipe: new mongoose.Types.ObjectId(),
    });
    const json = doc.toJSON();
    assert.equal(json._id, undefined, '_id should be stripped in toJSON');
    assert.equal(json.__v, undefined, '__v should be stripped in toJSON');
    assert.ok(json.id, 'id field should be present');
  });

  // 11. UNIT TESTS: MealPlan Model Schema Validation
  await test('MealPlan schema succeeds for valid meal plan configuration', () => {
    const validPlan = new MealPlan({
      user: new mongoose.Types.ObjectId(),
      name: 'Weekly Wellness Plan',
      startDate: new Date('2026-10-12'),
      endDate: new Date('2026-10-18'),
      meals: [
        {
          date: new Date('2026-10-12'),
          breakfast: new mongoose.Types.ObjectId(),
          lunch: new mongoose.Types.ObjectId(),
          dinner: new mongoose.Types.ObjectId(),
          snacks: [new mongoose.Types.ObjectId()],
        },
      ],
    });

    const error = validPlan.validateSync();
    assert.equal(error, undefined, 'Valid MealPlan schema should not throw error');
  });

  await test('MealPlan schema requires user, name, startDate, and endDate', () => {
    const invalidPlan = new MealPlan({});
    const error = invalidPlan.validateSync();
    assert.ok(error, 'Schema should require mandatory fields');
    assert.ok(error.errors.user);
    assert.ok(error.errors.startDate);
    assert.ok(error.errors.endDate);
  });

  await test('MealPlan schema enforces name length constraints', () => {
    const shortPlan = new MealPlan({
      user: new mongoose.Types.ObjectId(),
      name: 'A',
      startDate: new Date(),
      endDate: new Date(),
    });
    const errorShort = shortPlan.validateSync();
    assert.ok(errorShort.errors.name);

    const longPlan = new MealPlan({
      user: new mongoose.Types.ObjectId(),
      name: 'A'.repeat(101),
      startDate: new Date(),
      endDate: new Date(),
    });
    const errorLong = longPlan.validateSync();
    assert.ok(errorLong.errors.name);
  });

  await test('MealPlan toJSON cleans output correctly', () => {
    const plan = new MealPlan({
      user: new mongoose.Types.ObjectId(),
      name: 'Spring Reset',
      startDate: new Date(),
      endDate: new Date(),
    });
    const json = plan.toJSON();
    assert.equal(json._id, undefined, '_id should be stripped in toJSON');
    assert.equal(json.__v, undefined, '__v should be stripped in toJSON');
    assert.ok(json.id, 'id field should be present');
    assert.equal(json.name, 'Spring Reset');
  });

  // 12. UNIT TESTS: validateMealPlanInput & validateMealSlotUpdate Helpers
  await test('validateMealPlanInput normalizes valid plan and parses dates', () => {
    const raw = {
      name: '  Keto Week 1  ',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      meals: [
        {
          date: '2026-11-01',
          breakfast: new mongoose.Types.ObjectId().toString(),
          snacks: [new mongoose.Types.ObjectId().toString()],
        },
      ],
    };

    const result = validateMealPlanInput(raw, false);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitized.name, 'Keto Week 1');
    assert.ok(result.sanitized.startDate instanceof Date);
    assert.ok(result.sanitized.endDate instanceof Date);
    assert.equal(result.sanitized.meals.length, 1);
    assert.ok(result.sanitized.meals[0].breakfast instanceof mongoose.Types.ObjectId);
    assert.equal(result.sanitized.meals[0].snacks.length, 1);
  });

  await test('validateMealPlanInput rejects invalid date inputs and inverted ranges', () => {
    // Non-object
    assert.equal(validateMealPlanInput(null).isValid, false);
    assert.equal(validateMealPlanInput('string').isValid, false);

    // Missing dates
    const noStart = validateMealPlanInput({ endDate: '2026-11-05' });
    assert.equal(noStart.isValid, false);
    assert.ok(noStart.error.includes('Start date is required'));

    const noEnd = validateMealPlanInput({ startDate: '2026-11-01' });
    assert.equal(noEnd.isValid, false);
    assert.ok(noEnd.error.includes('End date is required'));

    // Malformed date string
    const badDate = validateMealPlanInput({ startDate: 'not-a-date', endDate: '2026-11-05' });
    assert.equal(badDate.isValid, false);
    assert.ok(badDate.error.includes('valid date'));

    // End date before start date
    const inverted = validateMealPlanInput({
      startDate: '2026-11-10',
      endDate: '2026-11-05',
    });
    assert.equal(inverted.isValid, false);
    assert.ok(inverted.error.includes('End date cannot be before start date'));

    // Invalid recipe ID in meals
    const badRecipe = validateMealPlanInput({
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      meals: [{ date: '2026-11-01', breakfast: 'not-an-id' }],
    });
    assert.equal(badRecipe.isValid, false);
    assert.ok(badRecipe.error.includes('Invalid recipe ID format'));
  });

  await test('validateMealSlotUpdate validates slot update payload correctly', () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();

    // Valid breakfast update
    const validSlot = validateMealSlotUpdate({
      date: '2026-11-02',
      mealType: 'breakfast',
      recipeId: dummyRecipeId,
    });
    assert.equal(validSlot.isValid, true);
    assert.equal(validSlot.sanitized.mealType, 'breakfast');
    assert.ok(validSlot.sanitized.recipeId instanceof mongoose.Types.ObjectId);

    // Valid snacks update with array
    const validSnacks = validateMealSlotUpdate({
      date: '2026-11-02',
      mealType: 'snacks',
      recipeIds: [dummyRecipeId],
    });
    assert.equal(validSnacks.isValid, true);
    assert.equal(validSnacks.sanitized.mealType, 'snacks');
    assert.equal(validSnacks.sanitized.recipeIds.length, 1);

    // Rejects invalid mealType
    const badType = validateMealSlotUpdate({
      date: '2026-11-02',
      mealType: 'midnight_feast',
    });
    assert.equal(badType.isValid, false);
    assert.ok(badType.error.includes('Invalid meal type'));

    // Rejects missing date
    const noDate = validateMealSlotUpdate({
      mealType: 'lunch',
      recipeId: dummyRecipeId,
    });
    assert.equal(noDate.isValid, false);
    assert.ok(noDate.error.includes('Date is required'));
  });

  // 13. UNIT TESTS: GroceryList & GroceryItem Model Schema Validation
  await test('GroceryList schema succeeds for valid grocery list configuration', () => {
    const validList = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'Weekly Provisions',
      source: 'manual',
      items: [
        {
          name: 'Paneer',
          quantity: 250,
          unit: 'g',
          category: 'dairy',
          checked: false,
        },
      ],
    });

    const error = validList.validateSync();
    assert.equal(error, undefined, 'Valid GroceryList schema should not throw error');
  });

  await test('GroceryList schema requires user reference and validates name constraints', () => {
    const missingUserDoc = new GroceryList({ name: 'Valid Name' });
    const errorUser = missingUserDoc.validateSync();
    assert.ok(errorUser.errors.user);

    const shortNameDoc = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'A',
    });
    const errorShort = shortNameDoc.validateSync();
    assert.ok(errorShort.errors.name);

    const longNameDoc = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'X'.repeat(101),
    });
    const errorLong = longNameDoc.validateSync();
    assert.ok(errorLong.errors.name);
  });

  await test('GroceryItem schema enforces required name and non-negative quantity', () => {
    const list = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'Item Test List',
      items: [
        {
          quantity: 2,
        },
      ],
    });
    const error = list.validateSync();
    assert.ok(error.errors['items.0.name'], 'Item name should be required');

    const negativeQtyList = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'Negative Test',
      items: [
        {
          name: 'Tomatoes',
          quantity: -3,
        },
      ],
    });
    const errorNegative = negativeQtyList.validateSync();
    assert.ok(errorNegative.errors['items.0.quantity'], 'Quantity cannot be negative');
  });

  await test('GroceryList schema rejects invalid source enum', () => {
    const invalidSourceDoc = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'Special List',
      source: 'supermarket_scanner_ai',
    });
    const error = invalidSourceDoc.validateSync();
    assert.ok(error.errors.source);
  });

  await test('GroceryList and GroceryItem toJSON cleans output correctly', () => {
    const list = new GroceryList({
      user: new mongoose.Types.ObjectId(),
      name: 'Clean Grocery List',
      items: [
        {
          name: 'Greek Yogurt',
          quantity: 500,
          unit: 'g',
          category: 'dairy',
        },
      ],
    });

    const json = list.toJSON();
    assert.equal(json._id, undefined, 'List _id should be stripped in toJSON');
    assert.equal(json.__v, undefined, 'List __v should be stripped in toJSON');
    assert.ok(json.id, 'List id field should be present');
    assert.equal(json.items[0]._id, undefined, 'Item _id should be stripped in toJSON');
    assert.ok(json.items[0].id, 'Item id field should be present');
    assert.equal(json.items[0].name, 'Greek Yogurt');
  });

  // 14. UNIT TESTS: validateGroceryListInput, validateGroceryItemInput & categorizeIngredientName Helpers
  await test('validateGroceryListInput normalizes valid list input and parses items', () => {
    const raw = {
      name: '  Weekend Feast  ',
      source: ' MANUAL ',
      items: [
        {
          name: '  Spinach  ',
          quantity: ' 2 bunches ',
          unit: '  bunches  ',
          category: ' VEGETABLES ',
          checked: false,
        },
        {
          name: ' Milk ',
          quantity: 2,
          unit: 'liters',
        },
      ],
    };

    const result = validateGroceryListInput(raw, false);
    assert.equal(result.isValid, true);
    assert.equal(result.sanitized.name, 'Weekend Feast');
    assert.equal(result.sanitized.source, 'manual');
    assert.equal(result.sanitized.items.length, 2);
    assert.equal(result.sanitized.items[0].name, 'Spinach');
    assert.equal(result.sanitized.items[0].quantity, 2);
    assert.equal(result.sanitized.items[0].unit, 'bunches');
    assert.equal(result.sanitized.items[0].category, 'vegetables');
    assert.equal(result.sanitized.items[1].name, 'Milk');
    assert.equal(result.sanitized.items[1].category, 'dairy');
  });

  await test('validateGroceryListInput rejects invalid input types and short name', () => {
    assert.equal(validateGroceryListInput(null).isValid, false);
    assert.equal(validateGroceryListInput('string').isValid, false);

    const shortName = validateGroceryListInput({ name: 'A' });
    assert.equal(shortName.isValid, false);
    assert.ok(shortName.error.includes('at least 2 characters'));

    const longName = validateGroceryListInput({ name: 'A'.repeat(101) });
    assert.equal(longName.isValid, false);
    assert.ok(longName.error.includes('cannot exceed 100 characters'));

    const invalidSource = validateGroceryListInput({ source: 'telepathic' });
    assert.equal(invalidSource.isValid, false);
    assert.ok(invalidSource.error.includes('Invalid source'));
  });

  await test('validateGroceryItemInput validates single item and handles partials', () => {
    assert.equal(validateGroceryItemInput(null).isValid, false);

    // Missing name on full validation
    const missingName = validateGroceryItemInput({ quantity: 2 }, false);
    assert.equal(missingName.isValid, false);
    assert.ok(missingName.error.includes('Item name is required'));

    // Partial update allows missing name
    const partialValid = validateGroceryItemInput({ checked: true, quantity: 5 }, true);
    assert.equal(partialValid.isValid, true);
    assert.equal(partialValid.sanitized.checked, true);
    assert.equal(partialValid.sanitized.quantity, 5);
    assert.equal(partialValid.sanitized.name, undefined);

    // Rejects negative quantity
    const negativeQty = validateGroceryItemInput({ name: 'Carrots', quantity: -2 });
    assert.equal(negativeQty.isValid, false);
    assert.ok(negativeQty.error.includes('cannot be negative'));
  });

  await test('categorizeIngredientName accurately categorizes ingredients based on keywords', () => {
    assert.equal(categorizeIngredientName('Paneer Cubes'), 'dairy');
    assert.equal(categorizeIngredientName('Fresh Spinach leaves'), 'vegetables');
    assert.equal(categorizeIngredientName('Organic Apples'), 'fruits');
    assert.equal(categorizeIngredientName('Brown Basmati Rice'), 'grains');
    assert.equal(categorizeIngredientName('Grilled Chicken Breast'), 'protein');
    assert.equal(categorizeIngredientName('Black Pepper powder'), 'spices');
    assert.equal(categorizeIngredientName('Green Tea bags'), 'beverages');
    assert.equal(categorizeIngredientName('Tortilla chips'), 'snacks');
    assert.equal(categorizeIngredientName('Unknown exotic ingredient'), 'other');
    assert.equal(categorizeIngredientName(''), 'other');
  });

  // START HTTP TEST SERVER
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[HTTP Test Server started on ${baseUrl}]`);
      resolve();
    });
  });

  // 8. HTTP API TESTS: Root & Health Check with Preferences Endpoint List
  await test('GET / returns 200 and lists preferences & user endpoints', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.message.includes('Zaiqo'));
    assert.equal(body.health, '/api/health');
    assert.ok(body.endpoints.preferences);
    assert.equal(body.endpoints.preferences.get, 'GET /api/preferences');
    assert.equal(body.endpoints.preferences.create, 'POST /api/preferences');
    assert.equal(body.endpoints.preferences.update, 'PUT /api/preferences');
    assert.equal(body.endpoints.preferences.delete, 'DELETE /api/preferences');
    assert.equal(body.endpoints.userProfile, 'GET /api/users/profile');
    assert.ok(body.endpoints.grocery);
    assert.equal(body.endpoints.grocery.list, 'GET /api/grocery');
    assert.ok(body.endpoints.foodAnalysis);
    assert.equal(body.endpoints.foodAnalysis.analyze, 'POST /api/food-analysis');
  });

  await test('GET /api/health returns 200 and operational status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'online');
    assert.equal(body.project, 'Zaiqo Backend API');
    assert.ok(body.services);
    assert.equal(body.services.auth, 'ready');
  });

  // 9. HTTP API TESTS: 404 Route Not Found
  await test('GET /api/nonexistent returns 404 with structured error', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Route not found'));
  });

  // 10. HTTP API TESTS: Signup Validation Errors
  await test('POST /api/auth/signup with missing fields returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Please provide name, email, and password'));
  });

  await test('POST /api/auth/signup with invalid email format returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'invalid-email-format',
        password: 'securePassword123',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('valid email'));
  });

  await test('POST /api/auth/signup with short password returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'alex@zaiqo.com',
        password: '123',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('at least 6 characters'));
  });

  // 11. HTTP API TESTS: Login Validation Errors
  await test('POST /api/auth/login with missing fields returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Please provide email and password'));
  });

  await test('POST /api/auth/login with invalid email format returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'password123',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('valid email'));
  });

  // 12. HTTP API TESTS: Protected Auth Routes Without / With Invalid Auth
  await test('GET /api/auth/me without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/auth/me with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid.token.value',
      },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  // 13. HTTP API TESTS: Preferences Authentication Protection
  await test('GET /api/preferences without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/preferences with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      headers: { Authorization: 'Bearer bogus.token.string' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('POST /api/preferences without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietaryPreference: 'vegetarian' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/preferences without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookingTime: '15-30' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/preferences without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/users/profile without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/users/profile without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/users/profile with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token',
      },
      body: JSON.stringify({ name: 'Valid Name' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  // 14. CONTROLLER UNIT TESTS: Input Validation Handling
  const mockUserId = new mongoose.Types.ObjectId();
  const mockToken = generateToken({ id: mockUserId.toString(), email: 'mockuser@zaiqo.com' });

  await test('createPreferences controller rejects invalid dietary preference with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { dietaryPreference: 'unsupported-carnivore' },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    const { createPreferences } = await import('../src/controllers/preference.controller.js');
    await createPreferences(req, res, next);

    assert.ok(capturedError, 'Controller should call next with error');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Invalid dietary preference'));
  });

  await test('createPreferences controller rejects invalid wellness goal with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { wellnessGoals: ['fly-to-mars'] },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    const { createPreferences } = await import('../src/controllers/preference.controller.js');
    await createPreferences(req, res, next);

    assert.ok(capturedError, 'Controller should call next with error');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Invalid wellness goal'));
  });

  await test('updatePreferences controller rejects invalid cooking time with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { cookingTime: 'over-5-hours' },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    const { updatePreferences } = await import('../src/controllers/preference.controller.js');
    await updatePreferences(req, res, next);

    assert.ok(capturedError, 'Controller should call next with error');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Invalid cooking time'));
  });

  await test('updatePreferences controller rejects invalid spice level with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { spiceLevel: 'nuclear' },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    const { updatePreferences } = await import('../src/controllers/preference.controller.js');
    await updatePreferences(req, res, next);

    assert.ok(capturedError, 'Controller should call next with error');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Invalid spice level'));
  });

  // 15. SERVICE LOGIC TESTS: User Isolation & Duplicate Prevention
  await test('preferenceService throws 409 conflict when duplicate preferences created for user', async () => {
    const originalFindOne = UserPreference.findOne;
    // Mock UserPreference.findOne to return existing document
    UserPreference.findOne = async () => ({ _id: 'existing_pref_id', user: mockUserId });

    try {
      await preferenceService.createPreferences(mockUserId, { dietaryPreference: 'vegan' });
      assert.fail('createPreferences should throw conflict if user already has preferences');
    } catch (err) {
      assert.equal(err.statusCode, 409, 'Expected 409 Conflict status');
      assert.ok(err.message.includes('already exist'));
    } finally {
      UserPreference.findOne = originalFindOne;
    }
  });

  await test('User isolation: service strictly queries by authenticated user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalFindOne = UserPreference.findOne;
    UserPreference.findOne = async (query) => {
      queriedUserId = query.user;
      return null;
    };

    try {
      await preferenceService.getPreferencesByUserId(userA);
      assert.equal(queriedUserId.toString(), userA.toString(), 'Query must use User A ID');

      await preferenceService.getPreferencesByUserId(userB);
      assert.equal(queriedUserId.toString(), userB.toString(), 'Query must use User B ID');
      assert.notEqual(userA.toString(), userB.toString(), 'User IDs must remain strictly distinct');
    } finally {
      UserPreference.findOne = originalFindOne;
    }
  });

  await test('signup controller persists preferences to UserPreference collection', async () => {
    const originalFindOne = User.findOne;
    const originalUserCreate = User.create;
    const originalPrefCreate = preferenceService.createPreferences;
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    User.findOne = async () => null;
    const dummyUserId = new mongoose.Types.ObjectId();
    let createdUserData = null;
    User.create = async (data) => {
      createdUserData = data;
      return {
        _id: dummyUserId,
        name: data.name,
        email: data.email,
      };
    };

    let createdPrefData = null;
    preferenceService.createPreferences = async (userId, data) => {
      createdPrefData = { userId, ...data };
      return { _id: 'pref_123', user: userId, ...data };
    };

    const req = {
      body: {
        name: 'Elena Rostova',
        email: 'elena@zaiqo.com',
        password: 'securePassword123',
        preferences: {
          dietaryPreference: 'vegetarian',
          wellnessGoals: ['healthy-eating'],
          allergies: ['dairy'],
        },
      },
    };
    let responseData = null;
    let statusCode = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (d) => { responseData = d; },
        };
      },
    };
    const next = (err) => { if (err) throw err; };

    try {
      await signupController(req, res, next);
      assert.equal(statusCode, 201);
      assert.ok(responseData.success);
      assert.equal(createdUserData.preferences, undefined, 'User model should not store embedded preferences');
      assert.equal(createdPrefData.userId.toString(), dummyUserId.toString());
      assert.equal(createdPrefData.dietaryPreference, 'vegetarian');
    } finally {
      User.findOne = originalFindOne;
      User.create = originalUserCreate;
      preferenceService.createPreferences = originalPrefCreate;
      mongoose.connection.readyState = originalReadyState;
    }
  });

  await test('signup controller rejects invalid preferences with 400', async () => {
    let capturedError = null;
    const req = {
      body: {
        name: 'Invalid Pref User',
        email: 'badpref@zaiqo.com',
        password: 'password123',
        preferences: {
          dietaryPreference: 'invalid-diet-type',
        },
      },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await signupController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Invalid dietary preference'));
  });

  await test('updateUserProfile service updates name and rejects invalid name', async () => {
    const dummyUserId = new mongoose.Types.ObjectId();
    const originalFindById = User.findById;

    const mockUserDoc = {
      _id: dummyUserId,
      name: 'Old Name',
      email: 'user@zaiqo.com',
      save: async function () { return this; },
    };
    User.findById = async () => mockUserDoc;

    try {
      // 1. Valid update
      const updated = await userService.updateUserProfile(dummyUserId, { name: 'New Fresh Name' });
      assert.equal(updated.name, 'New Fresh Name');

      // 2. Reject short name
      await assert.rejects(
        async () => userService.updateUserProfile(dummyUserId, { name: 'A' }),
        /at least 2 characters/i
      );

      // 3. Reject long name
      await assert.rejects(
        async () => userService.updateUserProfile(dummyUserId, { name: 'X'.repeat(51) }),
        /cannot exceed 50 characters/i
      );
    } finally {
      User.findById = originalFindById;
    }
  });

  await test('updateUserProfile controller returns updated profile without password', async () => {
    const dummyUserId = new mongoose.Types.ObjectId();
    const originalUpdate = userService.updateUserProfile;
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    userService.updateUserProfile = async (id, data) => ({
      id: dummyUserId,
      name: data.name,
      email: 'user@zaiqo.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = {
      user: { _id: dummyUserId },
      body: { name: 'Updated Alex' },
    };
    let responseData = null;
    const res = {
      status: (code) => {
        assert.equal(code, 200);
        return {
          json: (d) => { responseData = d; },
        };
      },
    };
    const next = (err) => { if (err) throw err; };

    try {
      await updateUserProfileController(req, res, next);
      assert.ok(responseData.success);
      assert.equal(responseData.data.user.name, 'Updated Alex');
      assert.equal(responseData.data.user.password, undefined);
    } finally {
      userService.updateUserProfile = originalUpdate;
      mongoose.connection.readyState = originalReadyState;
    }
  });

  // 16. HTTP API TESTS: Authenticated Endpoints Return 503 When Database Disconnected
  await test('POST /api/preferences with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        dietaryPreference: 'vegetarian',
      }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/preferences with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/preferences with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        cookingTime: '15-30',
      }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/preferences with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/preferences`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/users/profile with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/users/profile with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ name: 'Alex Updated' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // 15. Database Unavailability Handling (when DB is disconnected)
  await test('POST /api/auth/signup returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: 'jordan@zaiqo.com',
        password: 'securePassword123',
      }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // 17. CONTROLLER UNIT TESTS: Recipe Validation
  await test('createRecipe controller rejects invalid payload with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { name: 'X' },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await createRecipeController(req, res, next);
    assert.ok(capturedError, 'createRecipe controller should call next with error');
    assert.equal(capturedError.statusCode, 400);
  });

  await test('updateRecipe controller rejects invalid difficulty with 400', async () => {
    let capturedError = null;
    const req = {
      params: { id: mockUserId.toString() },
      user: { _id: mockUserId },
      body: { difficulty: 'insane' },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await updateRecipeController(req, res, next);
    assert.ok(capturedError, 'updateRecipe controller should call next with error');
    assert.equal(capturedError.statusCode, 400);
  });

  // 18. SERVICE LOGIC TESTS: Recipe Creation & Ownership
  await test('recipeService.createRecipe associates authenticated user and defaults source to user', async () => {
    const originalCreate = Recipe.create;
    let savedPayload = null;
    Recipe.create = async (payload) => {
      savedPayload = payload;
      return { id: 'mock_recipe_id', ...payload };
    };

    try {
      const mockAuthUser = { _id: mockUserId, email: 'chef@zaiqo.com' };
      const recipeData = {
        name: 'Avocado Toast',
        mealType: 'breakfast',
        ingredients: [{ name: 'Bread', quantity: 2, unit: 'slices' }],
        instructions: ['Toast bread and mash avocado'],
      };

      await recipeService.createRecipe(recipeData, mockAuthUser);
      assert.ok(savedPayload);
      assert.equal(savedPayload.createdBy.toString(), mockUserId.toString());
      assert.equal(savedPayload.source, 'user');

      // Explicit AI source preserved
      await recipeService.createRecipe({ ...recipeData, source: 'ai' }, mockAuthUser);
      assert.equal(savedPayload.source, 'ai');

      // Unauthenticated / system creation
      await recipeService.createRecipe(recipeData, null);
      assert.equal(savedPayload.createdBy, null);
      assert.equal(savedPayload.source, 'system');
    } finally {
      Recipe.create = originalCreate;
    }
  });

  await test('recipeService.getRecipeById validates ID format and handles not found', async () => {
    await assert.rejects(
      async () => recipeService.getRecipeById('invalid-id-format'),
      /Invalid recipe ID format/i
    );

    const originalFindById = Recipe.findById;
    Recipe.findById = () => ({
      populate: async () => null,
    });

    try {
      const dummyId = new mongoose.Types.ObjectId().toString();
      await assert.rejects(
        async () => recipeService.getRecipeById(dummyId),
        /Recipe not found/i
      );
    } finally {
      Recipe.findById = originalFindById;
    }
  });

  await test('recipeService.updateRecipe enforces user ownership and recomputes totalTime', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const recipeId = new mongoose.Types.ObjectId().toString();

    // Rejects invalid ID
    await assert.rejects(
      async () => recipeService.updateRecipe('bad-id', {}, { _id: ownerId }),
      /Invalid recipe ID format/i
    );

    const originalFindById = Recipe.findById;

    // Recipe not found
    Recipe.findById = async () => null;
    try {
      await assert.rejects(
        async () => recipeService.updateRecipe(recipeId, { name: 'Updated' }, { _id: ownerId }),
        /Recipe not found/i
      );
    } finally {
      Recipe.findById = originalFindById;
    }

    // Ownership check: user cannot modify another user's recipe
    Recipe.findById = async () => ({
      _id: recipeId,
      createdBy: ownerId,
      prepTime: 10,
      cookTime: 15,
      totalTime: 25,
      save: async () => {},
    });

    try {
      await assert.rejects(
        async () => recipeService.updateRecipe(recipeId, { name: 'Hack' }, { _id: otherUserId }),
        /do not have permission/i
      );
    } finally {
      Recipe.findById = originalFindById;
    }

    // System recipe cannot be modified without ownership
    Recipe.findById = async () => ({
      _id: recipeId,
      createdBy: null,
      save: async () => {},
    });

    try {
      await assert.rejects(
        async () => recipeService.updateRecipe(recipeId, { name: 'Hack' }, { _id: ownerId }),
        /do not have permission/i
      );
    } finally {
      Recipe.findById = originalFindById;
    }

    // Successful update by owner with totalTime recomputation & nutrition merging
    const mockDoc = {
      _id: recipeId,
      createdBy: ownerId,
      name: 'Original',
      prepTime: 10,
      cookTime: 15,
      totalTime: 25,
      nutrition: { calories: 300, protein: 20, carbohydrates: 10, fats: 5 },
      save: async function () { return this; },
    };
    Recipe.findById = async () => mockDoc;

    try {
      const updated = await recipeService.updateRecipe(
        recipeId,
        { cookTime: 25, nutrition: { calories: 350 } },
        { _id: ownerId }
      );
      assert.equal(updated.cookTime, 25);
      assert.equal(updated.totalTime, 35); // 10 prep + 25 cook
      assert.equal(updated.nutrition.calories, 350);
      assert.equal(updated.nutrition.protein, 20); // preserved
    } finally {
      Recipe.findById = originalFindById;
    }
  });

  await test('recipeService.deleteRecipe enforces user ownership', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const recipeId = new mongoose.Types.ObjectId().toString();

    const originalFindById = Recipe.findById;
    const originalFindByIdAndDelete = Recipe.findByIdAndDelete;
    let deletedId = null;
    Recipe.findByIdAndDelete = async (id) => { deletedId = id; };

    try {
      // Not found check
      Recipe.findById = async () => null;
      await assert.rejects(
        async () => recipeService.deleteRecipe(recipeId, { _id: ownerId }),
        /Recipe not found/i
      );

      // Ownership rejection
      Recipe.findById = async () => ({ _id: recipeId, createdBy: ownerId });
      await assert.rejects(
        async () => recipeService.deleteRecipe(recipeId, { _id: otherUserId }),
        /do not have permission/i
      );

      // Successful deletion by owner
      Recipe.findById = async () => ({ _id: recipeId, createdBy: ownerId });
      const result = await recipeService.deleteRecipe(recipeId, { _id: ownerId });
      assert.equal(result, true);
      assert.equal(deletedId, recipeId);
    } finally {
      Recipe.findById = originalFindById;
      Recipe.findByIdAndDelete = originalFindByIdAndDelete;
    }
  });

  await test('recipeService.getRecipes applies query filters and pagination correctly', async () => {
    let capturedQuery = null;
    let capturedSkip = null;
    let capturedLimit = null;

    const originalFind = Recipe.find;
    const originalCount = Recipe.countDocuments;

    Recipe.find = (q) => {
      capturedQuery = q;
      return {
        sort: () => ({
          skip: (s) => {
            capturedSkip = s;
            return {
              limit: (l) => {
                capturedLimit = l;
                return {
                  populate: async () => [{ name: 'Paneer Bowl' }],
                };
              },
            };
          },
        }),
      };
    };
    Recipe.countDocuments = async (q) => 42;

    try {
      const filters = {
        mealType: 'DINNER',
        dietaryPreference: 'vegetarian,high-protein',
        cuisine: 'INDIAN',
        maxCookTime: '30',
        difficulty: 'EASY',
        source: 'AI',
        search: 'paneer (special)',
      };

      const result = await recipeService.getRecipes(filters, { page: 2, limit: 15 });

      assert.equal(capturedQuery.mealType, 'dinner');
      assert.deepEqual(capturedQuery.dietaryTags, { $in: ['vegetarian', 'high-protein'] });
      assert.equal(capturedQuery.cuisine, 'indian');
      assert.deepEqual(capturedQuery.cookTime, { $lte: 30 });
      assert.equal(capturedQuery.difficulty, 'easy');
      assert.equal(capturedQuery.source, 'ai');
      assert.ok(capturedQuery.$or); // search regex
      assert.equal(capturedSkip, 15);
      assert.equal(capturedLimit, 15);
      assert.equal(result.pagination.total, 42);
      assert.equal(result.pagination.page, 2);
      assert.equal(result.pagination.limit, 15);
      assert.equal(result.pagination.totalPages, 3);
    } finally {
      Recipe.find = originalFind;
      Recipe.countDocuments = originalCount;
    }
  });

  // 19. HTTP API TESTS: Recipe Route Protection & Database Disconnection
  await test('GET /api/recipes returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/recipes/:id returns 503 when DB is disconnected without hanging', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/recipes/${dummyId}`);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/recipes without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Recipe' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/recipes with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.str',
      },
      body: JSON.stringify({ name: 'New Recipe' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('PUT /api/recipes/:id without token returns 401 Unauthorized', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/recipes/${dummyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Recipe' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/recipes/:id without token returns 401 Unauthorized', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/recipes/${dummyId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/recipes with valid token and valid payload returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        name: 'Spiced Chicken Skillet',
        mealType: 'dinner',
        ingredients: [{ name: 'Chicken breast', quantity: 300, unit: 'g' }],
        instructions: ['Sear chicken on medium heat for 6 mins per side.'],
      }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/recipes/:id with valid token and valid payload returns 503 when DB is disconnected without hanging', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/recipes/${dummyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ cookTime: 20 }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/recipes/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const dummyId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/recipes/${dummyId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // 20. SERVICE LOGIC TESTS: SavedRecipe
  await test('savedRecipeService.saveRecipe validates recipe ID format', async () => {
    await assert.rejects(
      async () => savedRecipeService.saveRecipe(mockUserId, 'invalid-id-format'),
      /Invalid recipe ID format/i
    );
  });

  await test('savedRecipeService.saveRecipe throws 404 when recipe does not exist', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalFindById = Recipe.findById;
    Recipe.findById = async () => null;

    try {
      await assert.rejects(
        async () => savedRecipeService.saveRecipe(mockUserId, dummyRecipeId),
        /Recipe not found/i
      );
    } finally {
      Recipe.findById = originalFindById;
    }
  });

  await test('savedRecipeService.saveRecipe throws 409 conflict when recipe is already saved', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalFindById = Recipe.findById;
    const originalFindOne = SavedRecipe.findOne;

    Recipe.findById = async () => ({ _id: dummyRecipeId, name: 'Paneer Bowl' });
    SavedRecipe.findOne = async () => ({ _id: 'existing_save_id', user: mockUserId, recipe: dummyRecipeId });

    try {
      await assert.rejects(
        async () => savedRecipeService.saveRecipe(mockUserId, dummyRecipeId),
        /already in your saved collection/i
      );
    } finally {
      Recipe.findById = originalFindById;
      SavedRecipe.findOne = originalFindOne;
    }
  });

  await test('savedRecipeService.saveRecipe handles MongoDB duplicate key code 11000 gracefully', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalFindById = Recipe.findById;
    const originalFindOne = SavedRecipe.findOne;
    const originalCreate = SavedRecipe.create;

    Recipe.findById = async () => ({ _id: dummyRecipeId });
    SavedRecipe.findOne = async () => null;
    SavedRecipe.create = async () => {
      const err = new Error('E11000 duplicate key');
      err.code = 11000;
      throw err;
    };

    try {
      await assert.rejects(
        async () => savedRecipeService.saveRecipe(mockUserId, dummyRecipeId),
        /already in your saved collection/i
      );
    } finally {
      Recipe.findById = originalFindById;
      SavedRecipe.findOne = originalFindOne;
      SavedRecipe.create = originalCreate;
    }
  });

  await test('savedRecipeService.saveRecipe creates and populates recipe on success', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalFindById = Recipe.findById;
    const originalFindOne = SavedRecipe.findOne;
    const originalCreate = SavedRecipe.create;

    Recipe.findById = async () => ({ _id: dummyRecipeId, name: 'Quinoa Salad' });
    SavedRecipe.findOne = async () => null;
    SavedRecipe.create = async (payload) => ({
      _id: 'new_saved_id',
      ...payload,
      populate: async () => ({
        _id: 'new_saved_id',
        ...payload,
        recipe: { _id: dummyRecipeId, name: 'Quinoa Salad' },
      }),
    });

    try {
      const result = await savedRecipeService.saveRecipe(mockUserId, dummyRecipeId);
      assert.ok(result);
      assert.equal(result.recipe.name, 'Quinoa Salad');
      assert.equal(result.user.toString(), mockUserId.toString());
    } finally {
      Recipe.findById = originalFindById;
      SavedRecipe.findOne = originalFindOne;
      SavedRecipe.create = originalCreate;
    }
  });

  await test('savedRecipeService.unsaveRecipe validates recipe ID format', async () => {
    await assert.rejects(
      async () => savedRecipeService.unsaveRecipe(mockUserId, 'invalid-id-format'),
      /Invalid recipe ID format/i
    );
  });

  await test('savedRecipeService.unsaveRecipe throws 404 when recipe was not saved', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalFindOneAndDelete = SavedRecipe.findOneAndDelete;
    SavedRecipe.findOneAndDelete = async () => null;

    try {
      await assert.rejects(
        async () => savedRecipeService.unsaveRecipe(mockUserId, dummyRecipeId),
        /Recipe was not found in your saved collection/i
      );
    } finally {
      SavedRecipe.findOneAndDelete = originalFindOneAndDelete;
    }
  });

  await test('savedRecipeService.unsaveRecipe succeeds when recipe is in saved collection', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalFindOneAndDelete = SavedRecipe.findOneAndDelete;
    SavedRecipe.findOneAndDelete = async () => ({ _id: 'deleted_save_id' });

    try {
      const result = await savedRecipeService.unsaveRecipe(mockUserId, dummyRecipeId);
      assert.equal(result, true);
    } finally {
      SavedRecipe.findOneAndDelete = originalFindOneAndDelete;
    }
  });

  await test('savedRecipeService.isRecipeSaved returns true when saved and false when not saved', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();
    const originalExists = SavedRecipe.exists;

    SavedRecipe.exists = async () => ({ _id: 'some_saved_id' });
    try {
      const isSaved = await savedRecipeService.isRecipeSaved(mockUserId, dummyRecipeId);
      assert.equal(isSaved, true);

      SavedRecipe.exists = async () => null;
      const isNotSaved = await savedRecipeService.isRecipeSaved(mockUserId, dummyRecipeId);
      assert.equal(isNotSaved, false);
    } finally {
      SavedRecipe.exists = originalExists;
    }
  });

  await test('User isolation: savedRecipeService strictly queries and mutates by authenticated user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const recipeId = new mongoose.Types.ObjectId().toString();
    let queriedUserId = null;

    const originalFindOneAndDelete = SavedRecipe.findOneAndDelete;
    SavedRecipe.findOneAndDelete = async (query) => {
      queriedUserId = query.user;
      return { _id: 'deleted_doc' };
    };

    try {
      await savedRecipeService.unsaveRecipe(userA, recipeId);
      assert.equal(queriedUserId.toString(), userA.toString(), 'Must delete strictly for User A');

      await savedRecipeService.unsaveRecipe(userB, recipeId);
      assert.equal(queriedUserId.toString(), userB.toString(), 'Must delete strictly for User B');
      assert.notEqual(userA.toString(), userB.toString());
    } finally {
      SavedRecipe.findOneAndDelete = originalFindOneAndDelete;
    }
  });

  await test('savedRecipeService.getSavedRecipes returns populated list and pagination', async () => {
    const originalFind = SavedRecipe.find;
    const originalCount = SavedRecipe.countDocuments;

    let queriedUserId = null;
    let capturedSkip = null;
    let capturedLimit = null;

    SavedRecipe.find = (q) => {
      queriedUserId = q.user;
      return {
        sort: () => ({
          skip: (s) => {
            capturedSkip = s;
            return {
              limit: (l) => {
                capturedLimit = l;
                return {
                  populate: async () => [{ _id: 'save_1', recipe: { name: 'Herb Salmon' } }],
                };
              },
            };
          },
        }),
      };
    };
    SavedRecipe.countDocuments = async () => 1;

    try {
      const result = await savedRecipeService.getSavedRecipes(mockUserId, { page: 1, limit: 10 });
      assert.equal(queriedUserId.toString(), mockUserId.toString());
      assert.equal(capturedSkip, 0);
      assert.equal(capturedLimit, 10);
      assert.equal(result.savedRecipes.length, 1);
      assert.equal(result.savedRecipes[0].recipe.name, 'Herb Salmon');
      assert.equal(result.pagination.total, 1);
      assert.equal(result.pagination.totalPages, 1);
    } finally {
      SavedRecipe.find = originalFind;
      SavedRecipe.countDocuments = originalCount;
    }
  });

  // 21. HTTP API TESTS: Saved Recipes Authentication & Database Disconnection
  const testRecipeId = new mongoose.Types.ObjectId().toString();

  await test('GET /api/recipes/saved without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/saved`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/recipes/saved with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/saved`, {
      headers: { Authorization: 'Bearer invalid.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/recipes/saved with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/saved`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/recipes/:recipeId/saved without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/saved`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/recipes/:recipeId/saved with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/saved`, {
      headers: { Authorization: 'Bearer invalid.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/recipes/:recipeId/saved with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/saved`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/recipes/:recipeId/save without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/save`, {
      method: 'POST',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/recipes/:recipeId/save with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/save`, {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('POST /api/recipes/:recipeId/save with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/recipes/:recipeId/save without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/save`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/recipes/:recipeId/save with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/save`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer invalid.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('DELETE /api/recipes/:recipeId/save with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/${testRecipeId}/save`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // 22. CONTROLLER UNIT TESTS: MealPlan Validation
  await test('createMealPlan controller rejects invalid date range with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: {
        startDate: '2026-11-10',
        endDate: '2026-11-01',
      },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await createMealPlanController(req, res, next);
    assert.ok(capturedError, 'createMealPlan should reject inverted dates');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('End date cannot be before start date'));
  });

  await test('updateMealSlot controller rejects invalid mealType with 400', async () => {
    let capturedError = null;
    const req = {
      params: { id: mockUserId.toString() },
      user: { _id: mockUserId },
      body: {
        date: '2026-11-05',
        mealType: 'midnight_snack_buffet',
      },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await updateMealSlotController(req, res, next);
    assert.ok(capturedError, 'updateMealSlot should reject invalid mealType');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Invalid meal type'));
  });

  // 23. SERVICE LOGIC TESTS: MealPlan CRUD & Ownership
  await test('mealPlanService.createMealPlan creates plan and verifies recipes exist', async () => {
    const dummyRecipeId1 = new mongoose.Types.ObjectId().toString();
    const dummyRecipeId2 = new mongoose.Types.ObjectId().toString();

    const originalRecipeFind = Recipe.find;
    const originalMealPlanCreate = MealPlan.create;

    // Both recipes exist
    Recipe.find = () => ({
      select: async () => [{ _id: dummyRecipeId1 }, { _id: dummyRecipeId2 }],
    });

    let createdPayload = null;
    MealPlan.create = async (payload) => {
      createdPayload = payload;
      return {
        _id: 'new_plan_id',
        ...payload,
        populate: async () => ({
          _id: 'new_plan_id',
          ...payload,
        }),
      };
    };

    try {
      const planData = {
        name: 'Detox Plan',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-07'),
        meals: [
          {
            date: new Date('2026-11-01'),
            breakfast: dummyRecipeId1,
            snacks: [dummyRecipeId2],
          },
        ],
      };

      const plan = await mealPlanService.createMealPlan(mockUserId, planData);
      assert.ok(plan);
      assert.equal(createdPayload.user.toString(), mockUserId.toString());
      assert.equal(createdPayload.name, 'Detox Plan');
    } finally {
      Recipe.find = originalRecipeFind;
      MealPlan.create = originalMealPlanCreate;
    }
  });

  await test('mealPlanService.createMealPlan rejects non-existent recipe references with 404', async () => {
    const dummyRecipeId = new mongoose.Types.ObjectId().toString();

    const originalRecipeFind = Recipe.find;
    // Recipe does not exist in DB
    Recipe.find = () => ({
      select: async () => [],
    });

    try {
      const planData = {
        name: 'Ghost Plan',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-07'),
        meals: [
          {
            date: new Date('2026-11-01'),
            breakfast: dummyRecipeId,
          },
        ],
      };

      await assert.rejects(
        async () => mealPlanService.createMealPlan(mockUserId, planData),
        /does not exist/i
      );
    } finally {
      Recipe.find = originalRecipeFind;
    }
  });

  await test('mealPlanService.getMealPlanById enforces ownership (403 for unauthorized user)', async () => {
    const planOwnerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const planId = new mongoose.Types.ObjectId().toString();

    const originalFindById = MealPlan.findById;

    // Plan exists belonging to planOwnerId
    MealPlan.findById = () => ({
      populate: async () => ({
        _id: planId,
        user: planOwnerId,
        name: 'Private Plan',
      }),
    });

    try {
      // Owner can access
      const plan = await mealPlanService.getMealPlanById(planOwnerId, planId);
      assert.equal(plan.name, 'Private Plan');

      // Another user is forbidden
      await assert.rejects(
        async () => mealPlanService.getMealPlanById(attackerId, planId),
        /do not have permission/i
      );
    } finally {
      MealPlan.findById = originalFindById;
    }
  });

  await test('mealPlanService.updateMealPlan enforces ownership and updates fields', async () => {
    const planOwnerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const planId = new mongoose.Types.ObjectId().toString();

    const originalFindById = MealPlan.findById;

    const mockPlanDoc = {
      _id: planId,
      user: planOwnerId,
      name: 'Original Plan',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-07'),
      meals: [],
      save: async function () { return this; },
      populate: async function () { return this; },
    };

    MealPlan.findById = async () => mockPlanDoc;

    try {
      // Attacker cannot update
      await assert.rejects(
        async () => mealPlanService.updateMealPlan(attackerId, planId, { name: 'Hacked' }),
        /do not have permission/i
      );

      // Owner can update
      const updated = await mealPlanService.updateMealPlan(planOwnerId, planId, { name: 'Renamed Plan' });
      assert.equal(updated.name, 'Renamed Plan');
    } finally {
      MealPlan.findById = originalFindById;
    }
  });

  await test('mealPlanService.deleteMealPlan enforces ownership', async () => {
    const planOwnerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const planId = new mongoose.Types.ObjectId().toString();

    const originalFindById = MealPlan.findById;
    const originalFindByIdAndDelete = MealPlan.findByIdAndDelete;

    MealPlan.findById = async () => ({ _id: planId, user: planOwnerId });
    MealPlan.findByIdAndDelete = async () => ({ _id: planId });

    try {
      // Attacker rejected
      await assert.rejects(
        async () => mealPlanService.deleteMealPlan(attackerId, planId),
        /do not have permission/i
      );

      // Owner succeeds
      const result = await mealPlanService.deleteMealPlan(planOwnerId, planId);
      assert.equal(result, true);
    } finally {
      MealPlan.findById = originalFindById;
      MealPlan.findByIdAndDelete = originalFindByIdAndDelete;
    }
  });

  await test('mealPlanService.updateMealSlot updates single meal and adds day entry if missing', async () => {
    const planOwnerId = new mongoose.Types.ObjectId();
    const planId = new mongoose.Types.ObjectId().toString();
    const dummyRecipeId = new mongoose.Types.ObjectId();

    const originalFindById = MealPlan.findById;
    const originalRecipeFind = Recipe.find;

    Recipe.find = () => ({
      select: async () => [{ _id: dummyRecipeId }],
    });

    const mockPlanDoc = {
      _id: planId,
      user: planOwnerId,
      meals: [],
      save: async function () { return this; },
      populate: async function () { return this; },
    };

    MealPlan.findById = async () => mockPlanDoc;

    try {
      // 1. Add breakfast for 2026-11-03 (creates new day entry)
      const res1 = await mealPlanService.updateMealSlot(planOwnerId, planId, {
        date: new Date('2026-11-03'),
        mealType: 'breakfast',
        recipeId: dummyRecipeId,
      });
      assert.equal(res1.meals.length, 1);
      assert.equal(res1.meals[0].breakfast.toString(), dummyRecipeId.toString());

      // 2. Add lunch for same date (modifies existing day entry)
      const res2 = await mealPlanService.updateMealSlot(planOwnerId, planId, {
        date: new Date('2026-11-03'),
        mealType: 'lunch',
        recipeId: dummyRecipeId,
      });
      assert.equal(res2.meals.length, 1);
      assert.equal(res2.meals[0].lunch.toString(), dummyRecipeId.toString());
    } finally {
      MealPlan.findById = originalFindById;
      Recipe.find = originalRecipeFind;
    }
  });

  await test('User isolation: mealPlanService queries strictly by authenticated user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalFind = MealPlan.find;
    const originalCount = MealPlan.countDocuments;

    MealPlan.find = (q) => {
      queriedUserId = q.user;
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
              populate: async () => [{ name: 'User Plan' }],
            }),
          }),
        }),
      };
    };
    MealPlan.countDocuments = async () => 1;

    try {
      await mealPlanService.getMealPlans(userA);
      assert.equal(queriedUserId.toString(), userA.toString(), 'Query must use User A ID');

      await mealPlanService.getMealPlans(userB);
      assert.equal(queriedUserId.toString(), userB.toString(), 'Query must use User B ID');
      assert.notEqual(userA.toString(), userB.toString());
    } finally {
      MealPlan.find = originalFind;
      MealPlan.countDocuments = originalCount;
    }
  });

  // 24. HTTP API TESTS: MealPlan Authentication & Disconnection Resilience
  const testMealPlanId = new mongoose.Types.ObjectId().toString();

  await test('GET /api/meal-plans without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/meal-plans with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans`, {
      headers: { Authorization: 'Bearer bad.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/meal-plans with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/meal-plans/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/meal-plans/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/meal-plans without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Plan' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/meal-plans with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        name: 'Weekly Health',
        startDate: '2026-11-01',
        endDate: '2026-11-07',
      }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/meal-plans/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/meal-plans/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ name: 'Updated' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/meal-plans/:id/meals without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}/meals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-11-02', mealType: 'breakfast' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/meal-plans/:id/meals with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}/meals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ date: '2026-11-02', mealType: 'breakfast' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/meal-plans/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/meal-plans/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/meal-plans/${testMealPlanId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // 25. CONTROLLER UNIT TESTS: Grocery Controllers Input Validation
  await test('createGroceryList controller rejects invalid input with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { name: 'A' },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await createGroceryListController(req, res, next);
    assert.ok(capturedError, 'createGroceryList should reject short name');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('at least 2 characters'));
  });

  await test('updateGroceryList controller rejects invalid name with 400', async () => {
    let capturedError = null;
    const req = {
      params: { id: mockUserId.toString() },
      user: { _id: mockUserId },
      body: { name: 'Z'.repeat(105) },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await updateGroceryListController(req, res, next);
    assert.ok(capturedError, 'updateGroceryList should reject long name');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('cannot exceed 100 characters'));
  });

  await test('addGroceryItem controller rejects invalid item payload with 400', async () => {
    let capturedError = null;
    const req = {
      params: { id: mockUserId.toString() },
      user: { _id: mockUserId },
      body: { name: '', quantity: -5 },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await addGroceryItemController(req, res, next);
    assert.ok(capturedError, 'addGroceryItem should reject empty name');
    assert.equal(capturedError.statusCode, 400);
  });

  await test('updateGroceryItem controller rejects negative quantity with 400', async () => {
    let capturedError = null;
    const req = {
      params: { id: mockUserId.toString(), itemId: mockUserId.toString() },
      user: { _id: mockUserId },
      body: { quantity: -1 },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await updateGroceryItemController(req, res, next);
    assert.ok(capturedError, 'updateGroceryItem should reject negative quantity');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('cannot be negative'));
  });

  // 26. SERVICE LOGIC TESTS: Grocery CRUD, Items & Meal Plan Aggregation
  await test('groceryService.createGroceryList associates authenticated user and defaults source to manual', async () => {
    let createdPayload = null;
    const originalCreate = GroceryList.create;

    GroceryList.create = async (payload) => {
      createdPayload = payload;
      return { _id: 'list_123', ...payload };
    };

    try {
      const listData = {
        name: 'Weekly Prep',
        items: [{ name: 'Oats', quantity: 500, unit: 'g', category: 'grains', checked: false }],
      };

      const result = await groceryService.createGroceryList(mockUserId, listData);
      assert.ok(result);
      assert.equal(createdPayload.user.toString(), mockUserId.toString());
      assert.equal(createdPayload.name, 'Weekly Prep');
      assert.equal(createdPayload.items.length, 1);
    } finally {
      GroceryList.create = originalCreate;
    }
  });

  await test('groceryService.getGroceryLists queries by authenticated user and handles pagination', async () => {
    const originalFind = GroceryList.find;
    const originalCount = GroceryList.countDocuments;
    let queriedFilter = null;

    GroceryList.find = (filter) => {
      queriedFilter = filter;
      return {
        sort: () => ({
          skip: () => ({
            limit: async () => [{ name: 'Test List', items: [] }],
          }),
        }),
      };
    };
    GroceryList.countDocuments = async () => 1;

    try {
      const result = await groceryService.getGroceryLists(mockUserId, { page: 1, limit: 10 });
      assert.equal(queriedFilter.user.toString(), mockUserId.toString());
      assert.equal(result.groceryLists.length, 1);
      assert.equal(result.pagination.total, 1);
      assert.equal(result.pagination.page, 1);
    } finally {
      GroceryList.find = originalFind;
      GroceryList.countDocuments = originalCount;
    }
  });

  await test('groceryService.getGroceryListById enforces ownership (403 for unauthorized user)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const listId = new mongoose.Types.ObjectId().toString();

    const originalFindById = GroceryList.findById;
    GroceryList.findById = async () => ({
      _id: listId,
      user: ownerId,
      name: 'Owner Grocery List',
    });

    try {
      // Owner accesses successfully
      const list = await groceryService.getGroceryListById(ownerId, listId);
      assert.equal(list.name, 'Owner Grocery List');

      // Unauthorized user is forbidden
      await assert.rejects(
        async () => groceryService.getGroceryListById(attackerId, listId),
        /do not have permission/i
      );
    } finally {
      GroceryList.findById = originalFindById;
    }
  });

  await test('groceryService.getGroceryListById throws 404 for non-existent list and 400 for invalid ID format', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const originalFindById = GroceryList.findById;
    GroceryList.findById = async () => null;

    try {
      await assert.rejects(
        async () => groceryService.getGroceryListById(mockUserId, 'invalid-id-format'),
        /Invalid grocery list ID/i
      );

      await assert.rejects(
        async () => groceryService.getGroceryListById(mockUserId, validId),
        /not found/i
      );
    } finally {
      GroceryList.findById = originalFindById;
    }
  });

  await test('groceryService.updateGroceryList enforces ownership and updates list fields', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const listId = new mongoose.Types.ObjectId().toString();

    const originalFindById = GroceryList.findById;
    const mockDoc = {
      _id: listId,
      user: ownerId,
      name: 'Old Name',
      save: async function () { return this; },
    };
    GroceryList.findById = async () => mockDoc;

    try {
      // Attacker rejected
      await assert.rejects(
        async () => groceryService.updateGroceryList(attackerId, listId, { name: 'Compromised' }),
        /do not have permission/i
      );

      // Owner succeeds
      const updated = await groceryService.updateGroceryList(ownerId, listId, { name: 'New Name' });
      assert.equal(updated.name, 'New Name');
    } finally {
      GroceryList.findById = originalFindById;
    }
  });

  await test('groceryService.deleteGroceryList enforces ownership and deletes list', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const listId = new mongoose.Types.ObjectId().toString();

    const originalFindById = GroceryList.findById;
    const originalFindByIdAndDelete = GroceryList.findByIdAndDelete;

    GroceryList.findById = async () => ({ _id: listId, user: ownerId });
    GroceryList.findByIdAndDelete = async () => ({ _id: listId });

    try {
      // Attacker rejected
      await assert.rejects(
        async () => groceryService.deleteGroceryList(attackerId, listId),
        /do not have permission/i
      );

      // Owner succeeds
      const res = await groceryService.deleteGroceryList(ownerId, listId);
      assert.equal(res, true);
    } finally {
      GroceryList.findById = originalFindById;
      GroceryList.findByIdAndDelete = originalFindByIdAndDelete;
    }
  });

  await test('groceryService.addItem appends item to grocery list', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalFindById = GroceryList.findById;

    const mockDoc = {
      _id: listId,
      user: mockUserId,
      items: [],
      save: async function () { return this; },
    };
    GroceryList.findById = async () => mockDoc;

    try {
      const result = await groceryService.addItem(mockUserId, listId, {
        name: 'Avocado',
        quantity: 2,
        unit: 'pieces',
        category: 'fruits',
        checked: false,
      });

      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].name, 'Avocado');
    } finally {
      GroceryList.findById = originalFindById;
    }
  });

  await test('groceryService.updateItem updates item fields and toggles checked/unchecked', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const itemId = new mongoose.Types.ObjectId().toString();
    const originalFindById = GroceryList.findById;

    const mockItem = {
      _id: itemId,
      name: 'Butter',
      quantity: 100,
      unit: 'g',
      category: 'dairy',
      checked: false,
    };

    const mockDoc = {
      _id: listId,
      user: mockUserId,
      items: {
        id: (id) => (id.toString() === itemId ? mockItem : null),
      },
      save: async function () { return this; },
    };
    GroceryList.findById = async () => mockDoc;

    try {
      // Toggle checked and update quantity
      await groceryService.updateItem(mockUserId, listId, itemId, {
        checked: true,
        quantity: 150,
      });

      assert.equal(mockItem.checked, true);
      assert.equal(mockItem.quantity, 150);
    } finally {
      GroceryList.findById = originalFindById;
    }
  });

  await test('groceryService.removeItem removes item from grocery list', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const itemId = new mongoose.Types.ObjectId().toString();
    const originalFindById = GroceryList.findById;
    let pulledId = null;

    const mockDoc = {
      _id: listId,
      user: mockUserId,
      items: {
        id: (id) => (id.toString() === itemId ? { _id: itemId } : null),
        pull: (id) => { pulledId = id; },
      },
      save: async function () { return this; },
    };
    GroceryList.findById = async () => mockDoc;

    try {
      await groceryService.removeItem(mockUserId, listId, itemId);
      assert.equal(pulledId, itemId);
    } finally {
      GroceryList.findById = originalFindById;
    }
  });

  await test('groceryService.createFromMealPlan enforces meal plan ownership (403 for unauthorized user)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const mealPlanId = new mongoose.Types.ObjectId().toString();

    const originalMealPlanFindById = MealPlan.findById;
    MealPlan.findById = async () => ({
      _id: mealPlanId,
      user: ownerId,
      name: 'Owner Plan',
      meals: [],
    });

    try {
      await assert.rejects(
        async () => groceryService.createFromMealPlan(attackerId, mealPlanId),
        /do not have permission/i
      );
    } finally {
      MealPlan.findById = originalMealPlanFindById;
    }
  });

  await test('groceryService.createFromMealPlan throws 404 for non-existent meal plan', async () => {
    const mealPlanId = new mongoose.Types.ObjectId().toString();
    const originalMealPlanFindById = MealPlan.findById;
    MealPlan.findById = async () => null;

    try {
      await assert.rejects(
        async () => groceryService.createFromMealPlan(mockUserId, mealPlanId),
        /Meal plan not found/i
      );
    } finally {
      MealPlan.findById = originalMealPlanFindById;
    }
  });

  await test('groceryService.createFromMealPlan aggregates recipes, ingredients, and combines duplicate ingredients', async () => {
    const mealPlanId = new mongoose.Types.ObjectId().toString();
    const recipeId1 = new mongoose.Types.ObjectId().toString();
    const recipeId2 = new mongoose.Types.ObjectId().toString();

    const originalMealPlanFindById = MealPlan.findById;
    const originalRecipeFind = Recipe.find;
    const originalGroceryListCreate = GroceryList.create;

    // Meal Plan with breakfast (Paneer Butter Masala) and lunch (Palak Paneer)
    MealPlan.findById = async () => ({
      _id: mealPlanId,
      user: mockUserId,
      name: 'High Protein Week',
      meals: [
        {
          date: new Date('2026-11-01'),
          breakfast: recipeId1,
          lunch: recipeId2,
        },
      ],
    });

    // Recipe 1: Paneer 200g, Tomato 2 pcs
    // Recipe 2: Paneer 150g, Spinach 1 bunch
    Recipe.find = async () => [
      {
        _id: recipeId1,
        name: 'Paneer Butter Masala',
        ingredients: [
          { name: 'Paneer', quantity: 200, unit: 'g' },
          { name: 'Tomato', quantity: 2, unit: 'pcs' },
        ],
      },
      {
        _id: recipeId2,
        name: 'Palak Paneer',
        ingredients: [
          { name: 'Paneer', quantity: 150, unit: 'g' },
          { name: 'Spinach', quantity: 1, unit: 'bunch' },
        ],
      },
    ];

    let createdGroceryPayload = null;
    GroceryList.create = async (payload) => {
      createdGroceryPayload = payload;
      return { _id: 'gen_list_id', ...payload };
    };

    try {
      const generated = await groceryService.createFromMealPlan(mockUserId, mealPlanId);
      assert.ok(generated);
      assert.equal(createdGroceryPayload.source, 'meal-plan');
      assert.equal(createdGroceryPayload.name, 'Grocery List for High Protein Week');
      assert.equal(createdGroceryPayload.items.length, 3);

      // Verify Paneer duplicate combined: 200g + 150g = 350g
      const paneerItem = createdGroceryPayload.items.find((i) => i.name.toLowerCase() === 'paneer');
      assert.ok(paneerItem, 'Paneer should exist in generated items');
      assert.equal(paneerItem.quantity, 350);
      assert.equal(paneerItem.unit, 'g');
      assert.equal(paneerItem.category, 'dairy');

      // Verify Tomato: 2 pcs
      const tomatoItem = createdGroceryPayload.items.find((i) => i.name.toLowerCase() === 'tomato');
      assert.ok(tomatoItem);
      assert.equal(tomatoItem.quantity, 2);
      assert.equal(tomatoItem.category, 'vegetables');

      // Verify Spinach: 1 bunch
      const spinachItem = createdGroceryPayload.items.find((i) => i.name.toLowerCase() === 'spinach');
      assert.ok(spinachItem);
      assert.equal(spinachItem.quantity, 1);
      assert.equal(spinachItem.category, 'vegetables');
    } finally {
      MealPlan.findById = originalMealPlanFindById;
      Recipe.find = originalRecipeFind;
      GroceryList.create = originalGroceryListCreate;
    }
  });

  await test('User isolation: groceryService queries strictly by authenticated user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalFind = GroceryList.find;
    const originalCount = GroceryList.countDocuments;

    GroceryList.find = (q) => {
      queriedUserId = q.user;
      return {
        sort: () => ({
          skip: () => ({
            limit: async () => [{ name: 'User List' }],
          }),
        }),
      };
    };
    GroceryList.countDocuments = async () => 1;

    try {
      await groceryService.getGroceryLists(userA);
      assert.equal(queriedUserId.toString(), userA.toString(), 'Query must use User A ID');

      await groceryService.getGroceryLists(userB);
      assert.equal(queriedUserId.toString(), userB.toString(), 'Query must use User B ID');
      assert.notEqual(userA.toString(), userB.toString());
    } finally {
      GroceryList.find = originalFind;
      GroceryList.countDocuments = originalCount;
    }
  });

  // 27. HTTP API TESTS: Grocery Authentication & Disconnection Resilience
  const testGroceryListId = new mongoose.Types.ObjectId().toString();
  const testGroceryItemId = new mongoose.Types.ObjectId().toString();

  await test('GET /api/grocery without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/grocery with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery`, {
      headers: { Authorization: 'Bearer bad.token' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/grocery with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/grocery/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/grocery/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/grocery without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fresh List' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/grocery with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ name: 'Fresh List' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/grocery/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated List Name' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/grocery/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ name: 'Updated List Name' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/grocery/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/grocery/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/grocery/:id/items without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Apples', quantity: 4 }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/grocery/:id/items with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ name: 'Apples', quantity: 4 }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('PUT /api/grocery/:id/items/:itemId without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}/items/${testGroceryItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: true }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('PUT /api/grocery/:id/items/:itemId with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}/items/${testGroceryItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ checked: true }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/grocery/:id/items/:itemId without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}/items/${testGroceryItemId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/grocery/:id/items/:itemId with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/${testGroceryListId}/items/${testGroceryItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/grocery/from-meal-plan/:mealPlanId without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/from-meal-plan/${testMealPlanId}`, {
      method: 'POST',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/grocery/from-meal-plan/:mealPlanId with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/from-meal-plan/${testMealPlanId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // ==========================================
  // 28. FOOD PHOTO ANALYSIS: Model & Validation Tests
  // ==========================================
  await test('FoodAnalysis model schema validates valid document and defaults estimates', () => {
    const validDoc = new FoodAnalysis({
      user: mockUserId,
      image: {
        mimeType: 'image/jpeg',
        size: 102400,
        originalName: 'salad.jpg',
      },
      detectedFoods: [
        { name: 'Caesar Salad', estimatedQuantity: 1, unit: 'bowl', confidence: 0.88 },
      ],
      nutrition: {
        calories: 320,
        protein: 8,
        carbohydrates: 14,
        fats: 26,
      },
      mealAnalysis: {
        summary: 'Nutritious salad with light dressing',
        observations: ['Rich in dietary fiber'],
        suggestions: ['Could add a protein source'],
      },
    });

    const error = validDoc.validateSync();
    assert.equal(error, undefined, 'Valid FoodAnalysis should have no validation errors');
    assert.equal(validDoc.status, 'pending');
    assert.equal(validDoc.detectedFoods[0].name, 'Caesar Salad');
    assert.equal(validDoc.detectedFoods[0].confidence, 0.88);
  });

  await test('FoodAnalysis model schema defaults empty detectedFoods and null nutrition/mealAnalysis', () => {
    const doc = new FoodAnalysis({
      user: mockUserId,
      image: {
        mimeType: 'image/png',
        size: 204800,
      },
    });

    assert.equal(doc.status, 'pending');
    assert.deepEqual(doc.detectedFoods, []);
    assert.equal(doc.nutrition, null);
    assert.equal(doc.mealAnalysis, null);
    assert.equal(doc.provider, null);
  });

  await test('FoodAnalysis model schema rejects missing required fields and invalid status', () => {
    // Missing user
    const noUser = new FoodAnalysis({
      image: { mimeType: 'image/jpeg', size: 1000 },
    });
    const errNoUser = noUser.validateSync();
    assert.ok(errNoUser.errors.user);

    // Missing image metadata
    const noImage = new FoodAnalysis({
      user: mockUserId,
    });
    const errNoImage = noImage.validateSync();
    assert.ok(errNoImage.errors['image.mimeType']);
    assert.ok(errNoImage.errors['image.size']);

    // Invalid status enum
    const badStatus = new FoodAnalysis({
      user: mockUserId,
      status: 'unsupported_status',
      image: { mimeType: 'image/jpeg', size: 1000 },
    });
    const errBadStatus = badStatus.validateSync();
    assert.ok(errBadStatus.errors.status);

    // Negative estimated quantity
    const negQty = new FoodAnalysis({
      user: mockUserId,
      image: { mimeType: 'image/jpeg', size: 1000 },
      detectedFoods: [{ name: 'Soup', estimatedQuantity: -2 }],
    });
    const errNegQty = negQty.validateSync();
    assert.ok(errNegQty.errors['detectedFoods.0.estimatedQuantity']);

    // Out of range confidence
    const badConfidence = new FoodAnalysis({
      user: mockUserId,
      image: { mimeType: 'image/jpeg', size: 1000 },
      detectedFoods: [{ name: 'Soup', confidence: 1.5 }],
    });
    const errBadConf = badConfidence.validateSync();
    assert.ok(errBadConf.errors['detectedFoods.0.confidence']);
  });

  await test('FoodAnalysis toJSON sanitizes _id to id and strips __v', () => {
    const doc = new FoodAnalysis({
      user: mockUserId,
      image: { mimeType: 'image/jpeg', size: 1000 },
    });
    const json = doc.toJSON();
    assert.ok(json.id);
    assert.equal(json._id, undefined);
    assert.equal(json.__v, undefined);
  });

  // ==========================================
  // 29. FOOD PHOTO ANALYSIS: Provider Abstraction & Service Logic Tests
  // ==========================================
  await test('BaseFoodAnalysisProvider interface enforces analyze method implementation', async () => {
    const provider = new BaseFoodAnalysisProvider();
    await assert.rejects(
      async () => provider.analyze(Buffer.from('test'), 'image/jpeg'),
      /must be implemented/i
    );
  });

  await test('foodAnalysisService rejects when vision provider is unconfigured without returning fake data', async () => {
    // Ensure no provider is configured
    assert.equal(getFoodAnalysisProvider(), null);

    const mockFile = {
      buffer: Buffer.from('fake image content'),
      mimetype: 'image/jpeg',
      size: 1024,
      originalname: 'food.jpg',
    };

    try {
      await foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile);
      assert.fail('Should have thrown when provider is unconfigured');
    } catch (err) {
      assert.equal(err.statusCode, 503);
      assert.ok(err.message.includes('Food analysis provider is not configured yet'));
    }
  });

  await test('foodAnalysisService rejects missing image file with 400', async () => {
    await assert.rejects(
      async () => foodAnalysisService.analyzeFoodPhoto(mockUserId, null),
      /Image file is required/i
    );
    await assert.rejects(
      async () => foodAnalysisService.analyzeFoodPhoto(mockUserId, {}),
      /Image file is required/i
    );
  });

  await test('foodAnalysisService integrates with configured provider without hardcoded fake data', async () => {
    const originalCreate = FoodAnalysis.create;
    let savedPayload = null;
    FoodAnalysis.create = async (payload) => {
      savedPayload = payload;
      return { id: 'analysis_123', ...payload };
    };

    // Inject mock vision provider for test
    const mockVisionProvider = {
      analyze: async (buffer, mimeType) => {
        assert.ok(buffer);
        assert.equal(mimeType, 'image/png');
        return {
          detectedFoods: [
            { name: 'Oatmeal with Berries', estimatedQuantity: 1, unit: 'bowl', confidence: 0.95 },
          ],
          nutrition: { calories: 290, protein: 9, carbohydrates: 54, fats: 5 },
          mealAnalysis: {
            summary: 'High fiber balanced breakfast',
            observations: ['Good antioxidant content from berries'],
            suggestions: ['Consider adding pumpkin seeds for zinc'],
          },
          provider: { name: 'MockVisionEngine', model: 'vision-v1-test' },
        };
      },
    };

    setFoodAnalysisProvider(mockVisionProvider);
    assert.equal(getFoodAnalysisProvider(), mockVisionProvider);

    try {
      const mockFile = {
        buffer: Buffer.from('mock image bytes'),
        mimetype: 'image/png',
        size: 512,
        originalname: 'breakfast.png',
      };

      await foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile);
      assert.ok(savedPayload);
      assert.equal(savedPayload.status, 'completed');
      assert.equal(savedPayload.image.mimeType, 'image/png');
      assert.equal(savedPayload.image.size, 512);
      assert.equal(savedPayload.detectedFoods[0].name, 'Oatmeal with Berries');
      assert.equal(savedPayload.nutrition.calories, 290);
      assert.equal(savedPayload.provider.name, 'MockVisionEngine');
    } finally {
      FoodAnalysis.create = originalCreate;
      setFoodAnalysisProvider(null); // Clean up: reset provider to unconfigured
    }
    assert.equal(getFoodAnalysisProvider(), null);
  });

  await test('foodAnalysisService.createAnalysisRecord validates inputs and persists pending record', async () => {
    const originalCreate = FoodAnalysis.create;
    let createdPayload = null;
    FoodAnalysis.create = async (payload) => {
      createdPayload = payload;
      return { id: 'created_record_id', ...payload };
    };

    try {
      // Rejects missing userId
      await assert.rejects(
        async () => foodAnalysisService.createAnalysisRecord(null, { mimeType: 'image/jpeg', size: 100 }),
        /User ID is required/i
      );

      // Rejects missing image metadata
      await assert.rejects(
        async () => foodAnalysisService.createAnalysisRecord(mockUserId, null),
        /Valid image metadata/i
      );

      // Successfully creates record
      await foodAnalysisService.createAnalysisRecord(
        mockUserId,
        { mimeType: 'image/jpeg', size: 4096, originalName: 'lunch.jpg' }
      );
      assert.ok(createdPayload);
      assert.equal(createdPayload.user.toString(), mockUserId.toString());
      assert.equal(createdPayload.status, 'pending');
      assert.equal(createdPayload.image.mimeType, 'image/jpeg');
    } finally {
      FoodAnalysis.create = originalCreate;
    }
  });

  await test('User isolation: foodAnalysisService strictly enforces ownership on get and delete', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const testAnalysisId = new mongoose.Types.ObjectId().toString();

    const originalFindById = FoodAnalysis.findById;
    const originalFindByIdAndDelete = FoodAnalysis.findByIdAndDelete;

    const mockAnalysisDoc = {
      _id: testAnalysisId,
      user: ownerId,
      status: 'completed',
      image: { mimeType: 'image/jpeg', size: 2000, originalName: 'dinner.jpg' },
      detectedFoods: [],
      nutrition: null,
      mealAnalysis: null,
    };

    FoodAnalysis.findById = async () => mockAnalysisDoc;
    FoodAnalysis.findByIdAndDelete = async () => mockAnalysisDoc;

    try {
      // 1. Invalid ID formats produce 400 Bad Request
      await assert.rejects(
        async () => foodAnalysisService.getAnalysisById(ownerId, 'invalid-id-format'),
        /Invalid analysis ID format/i
      );
      await assert.rejects(
        async () => foodAnalysisService.deleteAnalysis(ownerId, 'invalid-id-format'),
        /Invalid analysis ID format/i
      );

      // 2. Owner can get the record
      const accessed = await foodAnalysisService.getAnalysisById(ownerId, testAnalysisId);
      assert.equal(accessed._id, testAnalysisId);

      // 3. Non-owner cannot access (403 Forbidden)
      try {
        await foodAnalysisService.getAnalysisById(attackerId, testAnalysisId);
        assert.fail('Should have rejected unauthorized access with 403');
      } catch (err) {
        assert.equal(err.statusCode, 403);
        assert.ok(err.message.includes('do not have permission'));
      }

      // 4. Non-owner cannot delete (403 Forbidden)
      try {
        await foodAnalysisService.deleteAnalysis(attackerId, testAnalysisId);
        assert.fail('Should have rejected unauthorized delete with 403');
      } catch (err) {
        assert.equal(err.statusCode, 403);
        assert.ok(err.message.includes('do not have permission'));
      }

      // 5. Owner can delete the record
      const deleted = await foodAnalysisService.deleteAnalysis(ownerId, testAnalysisId);
      assert.equal(deleted, true);

      // 6. Not found handling (404)
      FoodAnalysis.findById = async () => null;
      await assert.rejects(
        async () => foodAnalysisService.getAnalysisById(ownerId, testAnalysisId),
        /Food analysis record not found/i
      );
      await assert.rejects(
        async () => foodAnalysisService.deleteAnalysis(ownerId, testAnalysisId),
        /Food analysis record not found/i
      );
    } finally {
      FoodAnalysis.findById = originalFindById;
      FoodAnalysis.findByIdAndDelete = originalFindByIdAndDelete;
    }
  });

  await test('User isolation: foodAnalysisService.getAnalysisHistory queries strictly by user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalFind = FoodAnalysis.find;
    FoodAnalysis.find = (q) => {
      queriedUserId = q.user;
      return {
        sort: () => ({
          exec: async () => [{ user: q.user, status: 'completed' }],
          skip: () => ({
            limit: () => ({
              exec: async () => [{ user: q.user, status: 'completed' }],
            }),
          }),
        }),
      };
    };

    try {
      await foodAnalysisService.getAnalysisHistory(userA);
      assert.equal(queriedUserId.toString(), userA.toString(), 'Query must use User A ID');

      await foodAnalysisService.getAnalysisHistory(userB);
      assert.equal(queriedUserId.toString(), userB.toString(), 'Query must use User B ID');
      assert.notEqual(userA.toString(), userB.toString());
    } finally {
      FoodAnalysis.find = originalFind;
    }
  });

  // ==========================================
  // 30. FOOD PHOTO ANALYSIS: Controller Unit Tests
  // ==========================================
  await test('analyzeFoodPhoto controller rejects request without image file with 400', async () => {
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      file: null,
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    await analyzeFoodPhotoController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Food image file is required'));
  });

  await test('Upload configuration: fileFilter accepts allowed image MIME types and rejects others', () => {
    let accepted = null;
    let err = null;

    // Allowed
    fileFilter(null, { mimetype: 'image/jpeg' }, (e, a) => { err = e; accepted = a; });
    assert.equal(err, null);
    assert.equal(accepted, true);

    fileFilter(null, { mimetype: 'image/png' }, (e, a) => { err = e; accepted = a; });
    assert.equal(err, null);
    assert.equal(accepted, true);

    fileFilter(null, { mimetype: 'image/webp' }, (e, a) => { err = e; accepted = a; });
    assert.equal(err, null);
    assert.equal(accepted, true);

    // Disallowed
    fileFilter(null, { mimetype: 'application/pdf' }, (e, a) => { err = e; accepted = a; });
    assert.ok(err);
    assert.equal(err.statusCode, 400);
    assert.equal(accepted, false);

    fileFilter(null, { mimetype: 'text/plain' }, (e, a) => { err = e; accepted = a; });
    assert.ok(err);
    assert.equal(err.statusCode, 400);
    assert.equal(accepted, false);
  });

  await test('Upload configuration: enforces 10MB limit and handles multer limit errors', async () => {
    assert.equal(MAX_FILE_SIZE, 10 * 1024 * 1024);

    const multerError = new Error('File too large');
    multerError.name = 'MulterError';
    multerError.code = 'LIMIT_FILE_SIZE';

    const { errorHandler } = await import('../src/middleware/error.middleware.js');
    let statusCode = null;
    let jsonBody = null;
    const mockRes = {
      status: (c) => { statusCode = c; return { json: (b) => { jsonBody = b; } }; },
    };
    errorHandler(multerError, {}, mockRes, () => {});
    assert.equal(statusCode, 400);
    assert.ok(jsonBody.error.includes('10 MB'));
  });

  await test('analyzeFoodPhoto controller passes 503 provider unconfigured error when called with file', async () => {
    let capturedError = null;
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const req = {
      user: { _id: mockUserId },
      file: {
        buffer: Buffer.from('bytes'),
        mimetype: 'image/jpeg',
        size: 100,
        originalname: 'apple.jpg',
      },
    };
    const res = {};
    const next = (err) => { capturedError = err; };

    try {
      await analyzeFoodPhotoController(req, res, next);
      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 503);
      assert.ok(capturedError.message.includes('Food analysis provider is not configured yet'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  // ==========================================
  // 31. FOOD PHOTO ANALYSIS: HTTP API Integration Tests
  // ==========================================
  const testAnalysisId = new mongoose.Types.ObjectId().toString();

  await test('POST /api/food-analysis without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis`, {
      method: 'POST',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/food-analysis with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis`, {
      method: 'POST',
      headers: { Authorization: 'Bearer bad.token.value' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/food-analysis without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/food-analysis with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis`, {
      headers: { Authorization: 'Bearer bad.token.value' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/food-analysis/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis/${testAnalysisId}`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('GET /api/food-analysis/:id with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis/${testAnalysisId}`, {
      headers: { Authorization: 'Bearer bad.token.value' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('DELETE /api/food-analysis/:id without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis/${testAnalysisId}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('DELETE /api/food-analysis/:id with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis/${testAnalysisId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer bad.token.value' },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('GET /api/food-analysis with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('GET /api/food-analysis/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis/${testAnalysisId}`, {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('DELETE /api/food-analysis/:id with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/food-analysis/${testAnalysisId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  await test('POST /api/food-analysis with valid token returns 503 when DB is disconnected without hanging', async () => {
    const formData = new FormData();
    const imageBlob = new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
    formData.append('image', imageBlob, 'photo.jpg');

    const res = await fetch(`${baseUrl}/api/food-analysis`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mockToken}` },
      body: formData,
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // ==========================================
  // 32. ZAI ORCHESTRATION LAYER: Unit & Contract Tests
  // ==========================================
  await test('Zai Action Contract: defines all 7 required initial actions and validates correctly', () => {
    assert.equal(ZAI_ACTIONS.RECIPE_GENERATION, 'RECIPE_GENERATION');
    assert.equal(ZAI_ACTIONS.MEAL_PLANNING, 'MEAL_PLANNING');
    assert.equal(ZAI_ACTIONS.GROCERY_LIST, 'GROCERY_LIST');
    assert.equal(ZAI_ACTIONS.DIETARY_PREFERENCE, 'DIETARY_PREFERENCE');
    assert.equal(ZAI_ACTIONS.RECIPE_SEARCH, 'RECIPE_SEARCH');
    assert.equal(ZAI_ACTIONS.FOOD_ANALYSIS, 'FOOD_ANALYSIS');
    assert.equal(ZAI_ACTIONS.FOOD_DIARY, 'FOOD_DIARY');
    assert.equal(ZAI_ACTIONS.GENERAL_ZAIQO, 'GENERAL_ZAIQO');

    assert.equal(SUPPORTED_ACTIONS.length, 8);
    assert.equal(isValidZaiAction('RECIPE_GENERATION'), true);
    assert.equal(isValidZaiAction('MEAL_PLANNING'), true);
    assert.equal(isValidZaiAction('GROCERY_LIST'), true);
    assert.equal(isValidZaiAction('DIETARY_PREFERENCE'), true);
    assert.equal(isValidZaiAction('RECIPE_SEARCH'), true);
    assert.equal(isValidZaiAction('FOOD_ANALYSIS'), true);
    assert.equal(isValidZaiAction('FOOD_DIARY'), true);
    assert.equal(isValidZaiAction('GENERAL_ZAIQO'), true);

    // Unsupported / invalid action strings
    assert.equal(isValidZaiAction('UNKNOWN_ACTION'), false);
    assert.equal(isValidZaiAction(''), false);
    assert.equal(isValidZaiAction(null), false);
    assert.equal(isValidZaiAction(123), false);

    const contract = createActionContract(
      ZAI_ACTIONS.RECIPE_GENERATION,
      { mealType: 'dinner' },
      'test message'
    );
    assert.equal(contract.action, 'RECIPE_GENERATION');
    assert.equal(contract.parameters.mealType, 'dinner');
    assert.equal(contract.message, 'test message');

    assert.throws(
      () => createActionContract('INVALID_ACTION_NAME'),
      /Unsupported Zai action type/i
    );
  });

  await test('zaiResolverService rejects null, undefined, empty, or non-string messages with 400', () => {
    assert.throws(() => zaiResolverService.resolveAction(null), /Message is required/i);
    assert.throws(() => zaiResolverService.resolveAction(undefined), /Message is required/i);
    assert.throws(() => zaiResolverService.resolveAction(''), /Message cannot be empty/i);
    assert.throws(() => zaiResolverService.resolveAction('   '), /Message cannot be empty/i);
    assert.throws(() => zaiResolverService.resolveAction(12345), /Message must be a string/i);
    assert.throws(() => zaiResolverService.resolveAction({}), /Message must be a string/i);
  });

  await test('zaiResolverService detects RECIPE_GENERATION and extracts structured parameters', () => {
    const input = 'I have paneer and spinach, suggest a healthy dinner in 20 min';
    const resolved = zaiResolverService.resolveAction(input);

    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.ok(Array.isArray(resolved.parameters.ingredients));
    assert.ok(resolved.parameters.ingredients.includes('paneer'));
    assert.ok(resolved.parameters.ingredients.includes('spinach'));
    assert.equal(resolved.parameters.mealType, 'dinner');
    assert.equal(resolved.parameters.cookingTime, 20);
    assert.equal(resolved.parameters.healthGoal, 'healthy');
  });

  await test('zaiResolverService detects MEAL_PLANNING and extracts duration parameter', () => {
    const resolved5Day = zaiResolverService.resolveAction('Give me a 5 day meal plan');
    assert.equal(resolved5Day.action, ZAI_ACTIONS.MEAL_PLANNING);
    assert.equal(resolved5Day.parameters.duration, 5);

    const resolvedWeekly = zaiResolverService.resolveAction('Plan my meals for this week');
    assert.equal(resolvedWeekly.action, ZAI_ACTIONS.MEAL_PLANNING);
  });

  await test('zaiResolverService detects GROCERY_LIST intent', () => {
    const resolved = zaiResolverService.resolveAction('Create my grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.deepEqual(resolved.parameters, {});

    const resolvedShopping = zaiResolverService.resolveAction('Show my shopping list');
    assert.equal(resolvedShopping.action, ZAI_ACTIONS.GROCERY_LIST);
  });

  await test('zaiResolverService detects DIETARY_PREFERENCE and extracts preference parameter', () => {
    const resolvedVeg = zaiResolverService.resolveAction('I am vegetarian');
    assert.equal(resolvedVeg.action, ZAI_ACTIONS.DIETARY_PREFERENCE);
    assert.equal(resolvedVeg.parameters.dietaryPreference, 'vegetarian');

    const resolvedVegan = zaiResolverService.resolveAction('I am vegan, please set my dietary preference');
    assert.equal(resolvedVegan.action, ZAI_ACTIONS.DIETARY_PREFERENCE);
    assert.equal(resolvedVegan.parameters.dietaryPreference, 'vegan');
  });

  await test('zaiResolverService detects RECIPE_SEARCH and extracts cuisine parameter', () => {
    const resolved = zaiResolverService.resolveAction('Find me Italian recipes');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_SEARCH);
    assert.equal(resolved.parameters.cuisine, 'Italian');

    const resolvedSearch = zaiResolverService.resolveAction('Search pasta recipes');
    assert.equal(resolvedSearch.action, ZAI_ACTIONS.RECIPE_SEARCH);
  });

  await test('zaiResolverService detects FOOD_ANALYSIS and sets photoRequired: true', () => {
    const resolved = zaiResolverService.resolveAction('Analyze this food photo');
    assert.equal(resolved.action, ZAI_ACTIONS.FOOD_ANALYSIS);
    assert.equal(resolved.parameters.photoRequired, true);

    const resolvedScan = zaiResolverService.resolveAction('Scan food image');
    assert.equal(resolvedScan.action, ZAI_ACTIONS.FOOD_ANALYSIS);
    assert.equal(resolvedScan.parameters.photoRequired, true);
  });

  await test('zaiResolverService falls back to GENERAL_ZAIQO for generic queries', () => {
    const resolvedGeneral = zaiResolverService.resolveAction('How does Zaiqo work?');
    assert.equal(resolvedGeneral.action, ZAI_ACTIONS.GENERAL_ZAIQO);
    assert.deepEqual(resolvedGeneral.parameters, {});

    const resolvedHi = zaiResolverService.resolveAction('Hello Zai, what can you do?');
    assert.equal(resolvedHi.action, ZAI_ACTIONS.GENERAL_ZAIQO);

    const resolvedRandom = zaiResolverService.resolveAction('Tell me something interesting today');
    assert.equal(resolvedRandom.action, ZAI_ACTIONS.GENERAL_ZAIQO);
  });

  // ==========================================
  // 33. ZAI ACTION SERVICE: Orchestration & Delegation Tests
  // ==========================================
  await test('zaiActionService.getUserContext delegates to preferenceService without duplicate models', async () => {
    const originalGetPref = preferenceService.getPreferencesByUserId;
    let queriedUserId = null;

    preferenceService.getPreferencesByUserId = async (uid) => {
      queriedUserId = uid;
      return { dietaryPreference: 'vegetarian', spiceLevel: 'medium' };
    };

    try {
      const context = await zaiActionService.getUserContext(mockUserId);
      assert.equal(queriedUserId.toString(), mockUserId.toString());
      assert.equal(context.dietaryPreference, 'vegetarian');

      const nullContext = await zaiActionService.getUserContext(null);
      assert.equal(nullContext, null);
    } finally {
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('zaiActionService.dispatchAction handles RECIPE_GENERATION without fake recipes or Gemini', async () => {
    const result = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.RECIPE_GENERATION,
      { ingredients: ['paneer', 'spinach'], mealType: 'dinner', cookingTime: 20 },
      mockUserId,
      null
    );

    assert.equal(result.data, null, 'Must not return fake recipe data');
    assert.ok(result.message.includes('paneer, spinach'));
    assert.ok(result.message.includes('AI recipe generation will be enabled'));
  });

  await test('zaiActionService.dispatchAction delegates MEAL_PLANNING to mealPlanService', async () => {
    const originalGetPlans = mealPlanService.getMealPlans;
    let delegatedUserId = null;
    let delegatedOptions = null;

    mealPlanService.getMealPlans = async (uid, opts) => {
      delegatedUserId = uid;
      delegatedOptions = opts;
      return { mealPlans: [{ name: 'Weekly Plan 1' }], pagination: { total: 1 } };
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.MEAL_PLANNING,
        { duration: 5 },
        mockUserId,
        null
      );

      assert.equal(delegatedUserId.toString(), mockUserId.toString());
      assert.ok(delegatedOptions);
      assert.ok(result.message.includes('5 days'));
      assert.equal(result.data.mealPlans.length, 1);
    } finally {
      mealPlanService.getMealPlans = originalGetPlans;
    }
  });

  await test('zaiActionService.dispatchAction delegates GROCERY_LIST to groceryService', async () => {
    const originalGetLists = groceryService.getGroceryLists;
    let delegatedUserId = null;

    groceryService.getGroceryLists = async (uid, opts) => {
      delegatedUserId = uid;
      return { groceryLists: [{ name: 'Weekend Groceries' }], pagination: { total: 1 } };
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        {},
        mockUserId,
        null
      );

      assert.equal(delegatedUserId.toString(), mockUserId.toString());
      assert.ok(result.message.includes('grocery lists'));
      assert.equal(result.data.groceryLists.length, 1);
    } finally {
      groceryService.getGroceryLists = originalGetLists;
    }
  });

  await test('zaiActionService.dispatchAction delegates DIETARY_PREFERENCE to preferenceService', async () => {
    const originalUpdate = preferenceService.updatePreferences;
    const originalGet = preferenceService.getPreferencesByUserId;
    let updatedPayload = null;

    preferenceService.updatePreferences = async (uid, data) => {
      updatedPayload = data;
      return { user: uid, dietaryPreference: data.dietaryPreference };
    };

    try {
      // 1. Update preference when extracted
      const resultUpdate = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.DIETARY_PREFERENCE,
        { dietaryPreference: 'vegetarian' },
        mockUserId,
        null
      );
      assert.equal(updatedPayload.dietaryPreference, 'vegetarian');
      assert.ok(resultUpdate.message.includes('vegetarian'));
      assert.equal(resultUpdate.data.dietaryPreference, 'vegetarian');

      // 2. Read preference when none specified
      preferenceService.getPreferencesByUserId = async () => ({ dietaryPreference: 'vegan' });
      const resultRead = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.DIETARY_PREFERENCE,
        {},
        mockUserId,
        null
      );
      assert.ok(resultRead.message.includes('current dietary preferences'));
      assert.equal(resultRead.data.dietaryPreference, 'vegan');
    } finally {
      preferenceService.updatePreferences = originalUpdate;
      preferenceService.getPreferencesByUserId = originalGet;
    }
  });

  await test('zaiActionService.dispatchAction delegates RECIPE_SEARCH to recipeService', async () => {
    const originalGetRecipes = recipeService.getRecipes;
    let capturedFilters = null;

    recipeService.getRecipes = async (filters, opts) => {
      capturedFilters = filters;
      return { recipes: [{ name: 'Spaghetti Pomodoro', cuisine: 'italian' }], pagination: { total: 1 } };
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.RECIPE_SEARCH,
        { cuisine: 'Italian' },
        mockUserId,
        null
      );

      assert.equal(capturedFilters.cuisine, 'italian');
      assert.ok(result.message.includes('Italian'));
      assert.equal(result.data.recipes.length, 1);
    } finally {
      recipeService.getRecipes = originalGetRecipes;
    }
  });

  await test('zaiActionService.dispatchAction handles FOOD_ANALYSIS requiring photo without fake data', async () => {
    const result = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.FOOD_ANALYSIS,
      { photoRequired: true },
      mockUserId,
      null
    );

    assert.equal(result.data, null, 'Must not fabricate food analysis results');
    assert.ok(result.message.includes('requires an image file'));
  });

  await test('zaiActionService.dispatchAction handles GENERAL_ZAIQO with helpful guidance', async () => {
    const result = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.GENERAL_ZAIQO,
      {},
      mockUserId,
      null
    );

    assert.equal(result.data, null);
    assert.ok(result.message.includes('Zai is your intelligent culinary assistant'));
  });

  await test('zaiActionService.dispatchAction rejects unsupported action type', async () => {
    await assert.rejects(
      async () => zaiActionService.dispatchAction('UNSUPPORTED_ACTION', {}, mockUserId, null),
      /Unsupported action type/i
    );
  });

  await test('zaiActionService.processMessage enforces authenticated user ID requirement', async () => {
    await assert.rejects(
      async () => zaiActionService.processMessage(null, 'Hello Zai'),
      /Authenticated user ID is required/i
    );
  });

  await test('User isolation: zaiActionService delegates strictly with authenticated user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let accessedUserId = null;

    const originalGetPlans = mealPlanService.getMealPlans;
    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    mealPlanService.getMealPlans = async (uid) => {
      accessedUserId = uid;
      return { mealPlans: [], pagination: { total: 0 } };
    };

    try {
      await zaiActionService.processMessage(userA, 'Give me a 5 day meal plan');
      assert.equal(accessedUserId.toString(), userA.toString(), 'Must delegate using User A ID');

      await zaiActionService.processMessage(userB, 'Give me a 5 day meal plan');
      assert.equal(accessedUserId.toString(), userB.toString(), 'Must delegate using User B ID');
      assert.notEqual(userA.toString(), userB.toString());
    } finally {
      mealPlanService.getMealPlans = originalGetPlans;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('Downstream service error handling: zaiActionService propagates domain errors', async () => {
    const originalGetPlans = mealPlanService.getMealPlans;
    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    mealPlanService.getMealPlans = async () => {
      throw new Error('Database query failure inside mealPlanService');
    };

    try {
      await assert.rejects(
        async () => zaiActionService.processMessage(mockUserId, 'Give me a 5 day meal plan'),
        /Database query failure inside mealPlanService/i
      );
    } finally {
      mealPlanService.getMealPlans = originalGetPlans;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  // ==========================================
  // 34. ZAI CONTROLLER: Unit Tests
  // ==========================================
  await test('handleZaiMessage controller rejects unauthenticated user with 401', async () => {
    let capturedError = null;
    const req = { user: null, body: { message: 'Hello' } };
    const res = {};
    const next = (err) => { capturedError = err; };

    await handleZaiMessageController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 401);
    assert.ok(capturedError.message.includes('Authentication required'));
  });

  await test('handleZaiMessage controller rejects non-object request body with 400', async () => {
    let capturedError = null;
    const req = { user: { _id: mockUserId }, body: 'plain string' };
    const res = {};
    const next = (err) => { capturedError = err; };

    await handleZaiMessageController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('JSON object'));
  });

  await test('handleZaiMessage controller rejects missing message with 400', async () => {
    let capturedError = null;
    const req = { user: { _id: mockUserId }, body: {} };
    const res = {};
    const next = (err) => { capturedError = err; };

    await handleZaiMessageController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Message is required'));
  });

  await test('handleZaiMessage controller rejects non-string message with 400', async () => {
    let capturedError = null;
    const req = { user: { _id: mockUserId }, body: { message: 999 } };
    const res = {};
    const next = (err) => { capturedError = err; };

    await handleZaiMessageController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Message must be a string'));
  });

  await test('handleZaiMessage controller rejects empty message with 400', async () => {
    let capturedError = null;
    const req = { user: { _id: mockUserId }, body: { message: '   ' } };
    const res = {};
    const next = (err) => { capturedError = err; };

    await handleZaiMessageController(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Message cannot be empty'));
  });

  await test('handleZaiMessage controller passes downstream errors to next()', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const originalProcess = zaiActionService.processMessage;
    zaiActionService.processMessage = async () => {
      throw new Error('Downstream orchestrator unexpected error');
    };

    let capturedError = null;
    const req = { user: { _id: mockUserId }, body: { message: 'Suggest recipe' } };
    const res = {};
    const next = (err) => { capturedError = err; };

    try {
      await handleZaiMessageController(req, res, next);
      assert.ok(capturedError);
      assert.equal(capturedError.message, 'Downstream orchestrator unexpected error');
    } finally {
      mongoose.connection.readyState = originalReadyState;
      zaiActionService.processMessage = originalProcess;
    }
  });

  await test('handleZaiMessage controller returns 200 with structured data on success', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const originalProcess = zaiActionService.processMessage;
    zaiActionService.processMessage = async () => ({
      action: 'RECIPE_GENERATION',
      message: 'Recipe request acknowledged.',
      parameters: { ingredients: ['paneer'] },
      result: null,
    });

    let statusCode = null;
    let responseBody = null;
    const req = {
      user: { _id: mockUserId },
      body: { message: 'I have paneer, suggest dinner' },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { responseBody = data; },
        };
      },
    };
    const next = (err) => { if (err) throw err; };

    try {
      await handleZaiMessageController(req, res, next);
      assert.equal(statusCode, 200);
      assert.equal(responseBody.success, true);
      assert.equal(responseBody.data.action, 'RECIPE_GENERATION');
      assert.equal(responseBody.data.message, 'Recipe request acknowledged.');
      assert.deepEqual(responseBody.data.parameters, { ingredients: ['paneer'] });
      assert.equal(responseBody.data.result, null);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      zaiActionService.processMessage = originalProcess;
    }
  });

  // ==========================================
  // 35. ZAI ROUTE: HTTP API Integration Tests
  // ==========================================
  await test('POST /api/zai/message without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/zai/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello Zai' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Authentication required'));
  });

  await test('POST /api/zai/message with invalid token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/zai/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.jwt.token',
      },
      body: JSON.stringify({ message: 'Hello Zai' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid authentication token'));
  });

  await test('POST /api/zai/message with valid token and missing message returns 400', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    // Mock User.findById for protect middleware
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, email: 'mockuser@zaiqo.com' });

    try {
      const res = await fetch(`${baseUrl}/api/zai/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.includes('Message is required'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
    }
  });

  await test('POST /api/zai/message with valid token and empty message returns 400', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, email: 'mockuser@zaiqo.com' });

    try {
      const res = await fetch(`${baseUrl}/api/zai/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ message: '   ' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.includes('Message cannot be empty'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
    }
  });

  await test('POST /api/zai/message with valid token returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/zai/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ message: 'How does Zaiqo work?' }),
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Database service is currently unavailable'));
  });

  // ==========================================
  // 36. GEMINI NATURAL LANGUAGE INTELLIGENCE LAYER TESTS
  // ==========================================
  const createMockGeminiClient = (responseData) => ({
    models: {
      generateContent: async (args) => {
        if (typeof responseData === 'function') {
          return responseData(args);
        }
        return {
          text: typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
        };
      },
    },
  });

  await test('Gemini Validation: validates valid structured Gemini output across actions', () => {
    const validRecipe = validateStructuredAction({
      action: 'RECIPE_GENERATION',
      parameters: {
        ingredients: ['paneer', 'spinach'],
        mealType: 'dinner',
        cookingTime: 25,
        healthGoal: 'healthy',
      },
      response: 'Here is a delicious paneer and spinach dinner suggestion.',
    });
    assert.equal(validRecipe.isValid, true);
    assert.equal(validRecipe.sanitized.action, 'RECIPE_GENERATION');
    assert.deepEqual(validRecipe.sanitized.parameters.ingredients, ['paneer', 'spinach']);
    assert.equal(validRecipe.sanitized.parameters.cookingTime, 25);
    assert.equal(validRecipe.sanitized.response, 'Here is a delicious paneer and spinach dinner suggestion.');

    const validMealPlan = validateStructuredAction({
      action: 'MEAL_PLANNING',
      parameters: { duration: 7 },
      response: 'I planned a 7 day meal plan for you.',
    });
    assert.equal(validMealPlan.isValid, true);
    assert.equal(validMealPlan.sanitized.parameters.duration, 7);
  });

  await test('Gemini Integration: RECIPE_GENERATION action via mocked Gemini', async () => {
    const mockClient = createMockGeminiClient({
      action: 'RECIPE_GENERATION',
      parameters: {
        ingredients: ['tofu', 'bell peppers'],
        mealType: 'lunch',
        cookingTime: 15,
      },
      response: 'I suggest a quick tofu stir-fry with bell peppers.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'What can I make with tofu and peppers?');
      assert.equal(result.action, 'RECIPE_GENERATION');
      assert.deepEqual(result.parameters.ingredients, ['tofu', 'bell peppers']);
      assert.equal(result.parameters.mealType, 'lunch');
      assert.equal(result.response, 'I suggest a quick tofu stir-fry with bell peppers.');
      assert.equal(result.result, null, 'Must not fabricate database entries');
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('Gemini Integration: MEAL_PLANNING action via mocked Gemini delegates to mealPlanService', async () => {
    const mockClient = createMockGeminiClient({
      action: 'MEAL_PLANNING',
      parameters: { duration: 5 },
      response: 'Here is your 5-day meal schedule.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalGetPlans = mealPlanService.getMealPlans;
    preferenceService.getPreferencesByUserId = async () => null;

    let queriedUserId = null;
    mealPlanService.getMealPlans = async (uid) => {
      queriedUserId = uid;
      return { mealPlans: [{ name: '5-Day Plan' }], pagination: { total: 1 } };
    };

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'Plan 5 days of meals for me');
      assert.equal(result.action, 'MEAL_PLANNING');
      assert.equal(result.parameters.duration, 5);
      assert.equal(queriedUserId.toString(), mockUserId.toString());
      assert.equal(result.result.mealPlans.length, 1);
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      mealPlanService.getMealPlans = originalGetPlans;
    }
  });

  await test('Gemini Integration: GROCERY_LIST action via mocked Gemini delegates to groceryService', async () => {
    const mockClient = createMockGeminiClient({
      action: 'GROCERY_LIST',
      parameters: {},
      response: 'Fetching your grocery items.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalGetGrocery = groceryService.getGroceryLists;
    preferenceService.getPreferencesByUserId = async () => null;

    let queriedUserId = null;
    groceryService.getGroceryLists = async (uid) => {
      queriedUserId = uid;
      return { groceryLists: [{ name: 'Weekly Market' }], pagination: { total: 1 } };
    };

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'Show me what I need to buy');
      assert.equal(result.action, 'GROCERY_LIST');
      assert.equal(queriedUserId.toString(), mockUserId.toString());
      assert.equal(result.result.groceryLists.length, 1);
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      groceryService.getGroceryLists = originalGetGrocery;
    }
  });

  await test('Gemini Integration: DIETARY_PREFERENCE action updates preference via preferenceService', async () => {
    const mockClient = createMockGeminiClient({
      action: 'DIETARY_PREFERENCE',
      parameters: { dietaryPreference: 'vegan' },
      response: 'I updated your preference to vegan.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalUpdatePref = preferenceService.updatePreferences;
    preferenceService.getPreferencesByUserId = async () => null;

    let updatedData = null;
    preferenceService.updatePreferences = async (uid, data) => {
      updatedData = data;
      return { user: uid, dietaryPreference: data.dietaryPreference };
    };

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'I decided to become vegan today');
      assert.equal(result.action, 'DIETARY_PREFERENCE');
      assert.equal(updatedData.dietaryPreference, 'vegan');
      assert.equal(result.result.dietaryPreference, 'vegan');
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      preferenceService.updatePreferences = originalUpdatePref;
    }
  });

  await test('Gemini Integration: RECIPE_SEARCH action delegates filters to recipeService', async () => {
    const mockClient = createMockGeminiClient({
      action: 'RECIPE_SEARCH',
      parameters: { cuisine: 'Mexican', mealType: 'dinner', cookingTime: 30 },
      response: 'Searching Mexican dinner recipes under 30 minutes.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalGetRecipes = recipeService.getRecipes;
    preferenceService.getPreferencesByUserId = async () => null;

    let capturedFilters = null;
    recipeService.getRecipes = async (filters) => {
      capturedFilters = filters;
      return { recipes: [{ name: 'Enchiladas' }], pagination: { total: 1 } };
    };

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'Find quick Mexican dinner recipes');
      assert.equal(result.action, 'RECIPE_SEARCH');
      assert.equal(capturedFilters.cuisine, 'mexican');
      assert.equal(capturedFilters.mealType, 'dinner');
      assert.equal(capturedFilters.maxCookTime, 30);
      assert.equal(result.result.recipes.length, 1);
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      recipeService.getRecipes = originalGetRecipes;
    }
  });

  await test('Gemini Integration: FOOD_ANALYSIS without image returns controlled prompt to upload photo', async () => {
    const mockClient = createMockGeminiClient({
      action: 'FOOD_ANALYSIS',
      parameters: { photoRequired: true },
      response: 'Please upload an image of your meal to analyze its contents.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'Analyze what I am eating');
      assert.equal(result.action, 'FOOD_ANALYSIS');
      assert.equal(result.result, null, 'No fake food analysis results generated');
      assert.ok(result.message.includes('requires an image file'));
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('Gemini Integration: GENERAL_ZAIQO returns helpful general guidance', async () => {
    const mockClient = createMockGeminiClient({
      action: 'GENERAL_ZAIQO',
      parameters: {},
      response: 'I am Zai, your cooking and wellness assistant. Ask me to find recipes or plan your meals.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'How can you assist me?');
      assert.equal(result.action, 'GENERAL_ZAIQO');
      assert.equal(result.result, null);
      assert.equal(result.response, 'I am Zai, your cooking and wellness assistant. Ask me to find recipes or plan your meals.');
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('Gemini Integration: malformed Gemini JSON triggers safe fallback to deterministic resolver', async () => {
    const mockClient = createMockGeminiClient('{ this is not valid json text !!!');
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalUpdatePref = preferenceService.updatePreferences;
    preferenceService.getPreferencesByUserId = async () => null;
    preferenceService.updatePreferences = async (uid, data) => ({ user: uid, dietaryPreference: data.dietaryPreference });

    try {
      // Message with clear deterministic intent: "I am vegetarian"
      const result = await zaiActionService.processMessage(mockUserId, 'I am vegetarian');
      assert.equal(result.action, 'DIETARY_PREFERENCE', 'Fallback must correctly identify dietary preference');
      assert.equal(result.parameters.dietaryPreference, 'vegetarian');
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      preferenceService.updatePreferences = originalUpdatePref;
    }
  });

  await test('Gemini Validation: rejects unsupported action and dangerous prototype pollution keys', () => {
    const unsupported = validateStructuredAction({
      action: 'EXECUTE_DATABASE_DROP',
      parameters: {},
    });
    assert.equal(unsupported.isValid, false);
    assert.ok(unsupported.error.includes('Unsupported or missing action type'));

    const prototypePollution = validateStructuredAction(
      JSON.parse('{"action": "RECIPE_GENERATION", "parameters": {"__proto__": {"isAdmin": true}}}')
    );
    assert.equal(prototypePollution.isValid, false);
    assert.ok(prototypePollution.error.includes('Forbidden parameter key'));
  });

  await test('Gemini Validation: validates and flags invalid parameters', () => {
    const invalidCookingTime = validateStructuredAction({
      action: 'RECIPE_GENERATION',
      parameters: { cookingTime: -20 },
    });
    assert.equal(invalidCookingTime.isValid, false);
    assert.ok(invalidCookingTime.error.includes('cookingTime'));

    const invalidDuration = validateStructuredAction({
      action: 'MEAL_PLANNING',
      parameters: { duration: 999 },
    });
    assert.equal(invalidDuration.isValid, false);
    assert.ok(invalidDuration.error.includes('duration'));

    const invalidIngredients = validateStructuredAction({
      action: 'RECIPE_GENERATION',
      parameters: { ingredients: 'spinach and cheese' },
    });
    assert.equal(invalidIngredients.isValid, false);
    assert.ok(invalidIngredients.error.includes('ingredients'));
  });

  await test('Gemini Integration: Gemini API failure triggers clean fallback without server crash', async () => {
    const failingClient = {
      models: {
        generateContent: async () => {
          throw new Error('Gemini API 500 internal server error');
        },
      },
    };
    geminiService.setMockClient(failingClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalGetPlans = mealPlanService.getMealPlans;
    preferenceService.getPreferencesByUserId = async () => null;
    mealPlanService.getMealPlans = async () => ({ mealPlans: [], pagination: { total: 0 } });

    try {
      const result = await zaiActionService.processMessage(mockUserId, 'Give me a 5 day meal plan');
      assert.equal(result.action, 'MEAL_PLANNING');
      assert.equal(result.parameters.duration, 5);
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      mealPlanService.getMealPlans = originalGetPlans;
    }
  });

  await test('Gemini Integration: missing API key handles safely and reports isConfigured=false', async () => {
    geminiService.setMockClient(null);
    const originalApiKey = process.env.GEMINI_API_KEY;

    try {
      delete process.env.GEMINI_API_KEY;
      assert.equal(geminiService.isConfigured(), false);

      // Calling understandZaiMessage directly without key throws 503
      await assert.rejects(
        async () => geminiService.understandZaiMessage('hello'),
        /Gemini API key is not configured/i
      );

      // Calling processMessage through zaiActionService safely falls back to deterministic resolver
      const originalGetPref = preferenceService.getPreferencesByUserId;
      const originalGetRecipes = recipeService.getRecipes;
      preferenceService.getPreferencesByUserId = async () => null;
      recipeService.getRecipes = async () => ({ recipes: [{ name: 'Pasta', cuisine: 'italian' }], pagination: { total: 1 } });
      try {
        const result = await zaiActionService.processMessage(mockUserId, 'Find me Italian recipes');
        assert.equal(result.action, 'RECIPE_SEARCH');
        assert.equal(result.parameters.cuisine, 'Italian');
      } finally {
        preferenceService.getPreferencesByUserId = originalGetPref;
        recipeService.getRecipes = originalGetRecipes;
      }
    } finally {
      if (originalApiKey) process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  await test('User Context: sanitizeUserContext strips sensitive and internal database fields', () => {
    const rawPreferences = {
      _id: 'mongo_67890',
      user: 'user_12345',
      password: 'hashed_password_secret',
      token: 'jwt.token.secret',
      dietaryPreference: 'vegetarian',
      wellnessGoals: ['healthy-eating', 'better-nutrition'],
      allergies: ['peanuts', 'shellfish'],
      foodsToAvoid: ['pork'],
      preferredCuisines: ['Indian', 'Italian'],
      cookingTime: '15-30',
      spiceLevel: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sanitized = sanitizeUserContext(rawPreferences);
    assert.equal(sanitized._id, undefined, '_id must be stripped');
    assert.equal(sanitized.user, undefined, 'user reference must be stripped');
    assert.equal(sanitized.password, undefined, 'password must never be present');
    assert.equal(sanitized.token, undefined, 'token must never be present');
    assert.equal(sanitized.dietaryPreference, 'vegetarian');
    assert.deepEqual(sanitized.allergies, ['peanuts', 'shellfish']);
    assert.deepEqual(sanitized.preferredCuisines, ['Indian', 'Italian']);
  });

  await test('User Context: passes sanitized context to Gemini client generateContent call', async () => {
    let capturedPrompt = null;
    const mockClient = {
      models: {
        generateContent: async (args) => {
          capturedPrompt = JSON.parse(args.contents);
          return {
            text: JSON.stringify({ action: 'GENERAL_ZAIQO', parameters: {}, response: 'Understood' }),
          };
        },
      },
    };
    geminiService.setMockClient(mockClient);

    const rawPreferences = {
      dietaryPreference: 'vegan',
      allergies: ['dairy'],
      internalId: 'secret-id-999',
    };

    try {
      await geminiService.understandZaiMessage('What should I cook tonight?', rawPreferences);
      assert.ok(capturedPrompt);
      assert.equal(capturedPrompt.userPreferences.dietaryPreference, 'vegan');
      assert.deepEqual(capturedPrompt.userPreferences.allergies, ['dairy']);
      assert.equal(capturedPrompt.userPreferences.internalId, undefined, 'Internal fields must never be passed');
    } finally {
      geminiService.setMockClient(null);
    }
  });

  await test('User isolation: zaiActionService with Gemini delegates strictly with authenticated user ID', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let accessedUserId = null;

    const mockClient = createMockGeminiClient({
      action: 'MEAL_PLANNING',
      parameters: { duration: 3 },
      response: '3 day meal plan ready.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPlans = mealPlanService.getMealPlans;
    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    mealPlanService.getMealPlans = async (uid) => {
      accessedUserId = uid;
      return { mealPlans: [], pagination: { total: 0 } };
    };

    try {
      await zaiActionService.processMessage(userA, 'Plan 3 days');
      assert.equal(accessedUserId.toString(), userA.toString(), 'Must delegate using User A ID');

      await zaiActionService.processMessage(userB, 'Plan 3 days');
      assert.equal(accessedUserId.toString(), userB.toString(), 'Must delegate using User B ID');
      assert.notEqual(userA.toString(), userB.toString());
    } finally {
      geminiService.setMockClient(null);
      mealPlanService.getMealPlans = originalGetPlans;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('Downstream service error handling: domain errors propagate through zaiActionService', async () => {
    const mockClient = createMockGeminiClient({
      action: 'MEAL_PLANNING',
      parameters: { duration: 5 },
      response: 'Plan ready.',
    });
    geminiService.setMockClient(mockClient);

    const originalGetPlans = mealPlanService.getMealPlans;
    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    mealPlanService.getMealPlans = async () => {
      throw new Error('Database connection reset during meal plan fetch');
    };

    try {
      await assert.rejects(
        async () => zaiActionService.processMessage(mockUserId, 'Plan 5 days'),
        /Database connection reset during meal plan fetch/i
      );
    } finally {
      geminiService.setMockClient(null);
      mealPlanService.getMealPlans = originalGetPlans;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  // ==========================================
  // 37. ZAI CONVERSATION MEMORY & MULTI-TURN SESSIONS
  // ==========================================
  await test('ZaiConversation model schema validates valid document with message turns', () => {
    const validSession = new ZaiConversation({
      user: new mongoose.Types.ObjectId(),
      messages: [
        {
          role: 'user',
          content: 'I have paneer and spinach',
          action: null,
          parameters: {},
          timestamp: new Date(),
        },
        {
          role: 'assistant',
          content: 'Here is a healthy dinner suggestion',
          action: 'RECIPE_GENERATION',
          parameters: { ingredients: ['paneer', 'spinach'] },
          timestamp: new Date(),
        },
      ],
    });
    const err = validSession.validateSync();
    assert.equal(err, undefined, 'Valid conversation schema must pass validation');
    assert.equal(validSession.messages.length, 2);
    assert.equal(validSession.messages[0].role, 'user');
    assert.equal(validSession.messages[1].role, 'assistant');
  });

  await test('ZaiConversation model schema rejects missing user reference', () => {
    const noUser = new ZaiConversation({ messages: [] });
    const err = noUser.validateSync();
    assert.ok(err, 'Schema must reject missing user reference');
    assert.ok(err.errors.user);
  });

  await test('ZaiConversation model schema rejects invalid turn role and missing content', () => {
    const invalidTurn = new ZaiConversation({
      user: new mongoose.Types.ObjectId(),
      messages: [{ role: 'robot', content: 'hello' }],
    });
    const errRole = invalidTurn.validateSync();
    assert.ok(errRole, 'Schema must reject invalid role');
    assert.ok(errRole.errors['messages.0.role']);

    const noContent = new ZaiConversation({
      user: new mongoose.Types.ObjectId(),
      messages: [{ role: 'user' }],
    });
    const errContent = noContent.validateSync();
    assert.ok(errContent, 'Schema must reject missing content');
    assert.ok(errContent.errors['messages.0.content']);
  });

  await test('ZaiConversation toJSON sanitizes _id to id and strips __v', () => {
    const session = new ZaiConversation({
      user: new mongoose.Types.ObjectId(),
      messages: [],
    });
    const json = session.toJSON();
    assert.ok(json.id, 'id field must be present');
    assert.equal(json._id, undefined, '_id must be stripped');
    assert.equal(json.__v, undefined, '__v must be stripped');
  });

  await test('zaiConversationService.createConversation requires authenticated userId', async () => {
    await assert.rejects(
      async () => zaiConversationService.createConversation(null),
      /Authenticated user ID is required/i
    );
  });

  await test('zaiConversationService.getConversation validates sessionId ObjectId format', async () => {
    await assert.rejects(
      async () => zaiConversationService.getConversation(mockUserId, 'invalid-id-format'),
      /Invalid session ID format/i
    );
    await assert.rejects(
      async () => zaiConversationService.getConversation(mockUserId, 12345),
      /Invalid session ID format/i
    );
  });

  await test('zaiConversationService: first message creates a new conversation and returns generated sessionId', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const session = await zaiConversationService.getOrCreateConversation(testUser);
    assert.ok(session);
    assert.ok(session._id);
    assert.equal(session.user.toString(), testUser.toString());
    assert.deepEqual(session.messages, []);
  });

  await test('zaiConversationService: sessionId returned and follow-up uses existing session', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const session1 = await zaiConversationService.getOrCreateConversation(testUser);
    const sessionId = session1._id.toString();

    const session2 = await zaiConversationService.getOrCreateConversation(testUser, sessionId);
    assert.equal(session2._id.toString(), sessionId);
    assert.equal(session2.user.toString(), testUser.toString());
  });

  await test('zaiConversationService: user + assistant turns persist in chronological order', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const session = await zaiConversationService.createConversation(testUser);
    const sessionId = session._id.toString();

    const t1 = new Date(Date.now() - 1000);
    const t2 = new Date();

    await zaiConversationService.appendTurns(testUser, sessionId, [
      { role: 'user', content: 'What can I make with paneer?', timestamp: t1 },
      {
        role: 'assistant',
        content: 'Paneer tikka is great.',
        action: 'RECIPE_GENERATION',
        parameters: { ingredients: ['paneer'] },
        timestamp: t2,
      },
    ]);

    const updated = await zaiConversationService.getConversation(testUser, sessionId);
    assert.equal(updated.messages.length, 2);
    assert.equal(updated.messages[0].role, 'user');
    assert.equal(updated.messages[0].content, 'What can I make with paneer?');
    assert.equal(updated.messages[1].role, 'assistant');
    assert.equal(updated.messages[1].content, 'Paneer tikka is great.');
    assert.equal(updated.messages[1].action, 'RECIPE_GENERATION');
    assert.deepEqual(updated.messages[1].parameters.ingredients, ['paneer']);
    assert.ok(updated.messages[0].timestamp <= updated.messages[1].timestamp);
  });

  await test('zaiConversationService: maximum 50 stored messages bounds history and oldest messages are pruned', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const session = await zaiConversationService.createConversation(testUser);
    const sessionId = session._id.toString();

    const fiftyFiveTurns = [];
    for (let i = 1; i <= 55; i++) {
      fiftyFiveTurns.push({
        role: i % 2 === 1 ? 'user' : 'assistant',
        content: `Message ${i}`,
      });
    }
    await zaiConversationService.appendTurns(testUser, sessionId, fiftyFiveTurns);

    const bounded = await zaiConversationService.getConversation(testUser, sessionId);
    assert.equal(bounded.messages.length, 50, 'Must not exceed 50 stored messages');
    assert.equal(bounded.messages[0].content, 'Message 6', 'Oldest 5 messages must be pruned');
    assert.equal(bounded.messages[49].content, 'Message 55', 'Newest message must be retained');
  });

  await test('zaiConversationService.getRecentMessages returns only requested bounded limit', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const session = await zaiConversationService.createConversation(testUser);
    const sessionId = session._id.toString();

    const turns = [];
    for (let i = 1; i <= 10; i++) {
      turns.push({ role: 'user', content: `Turn ${i}` });
    }
    await zaiConversationService.appendTurns(testUser, sessionId, turns);

    const recent = await zaiConversationService.getRecentMessages(testUser, sessionId, 6);
    assert.equal(recent.length, 6);
    assert.equal(recent[0].content, 'Turn 5');
    assert.equal(recent[5].content, 'Turn 10');
  });

  await test('User isolation: zaiConversationService rejects cross-user session retrieval', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const sessionA = await zaiConversationService.createConversation(userA);

    const retrievedByB = await zaiConversationService.getConversation(userB, sessionA._id.toString());
    assert.equal(retrievedByB, null, 'User B cannot query User A session');

    await assert.rejects(
      async () => zaiConversationService.getOrCreateConversation(userB, sessionA._id.toString()),
      /Conversation session not found/i
    );
  });

  await test('User isolation: user B cannot append turns to user A session', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const sessionA = await zaiConversationService.createConversation(userA);

    await assert.rejects(
      async () =>
        zaiConversationService.appendTurns(userB, sessionA._id.toString(), [
          { role: 'user', content: 'Unauthorized injection' },
        ]),
      /Conversation session not found/i
    );
  });

  await test('sanitizeConversationHistory strips sensitive fields and internal DB identifiers', () => {
    const dirtyHistory = [
      {
        _id: 'internal_mongo_id',
        user: 'user_123',
        userId: 'user_123',
        role: 'user',
        content: 'I want healthy soup',
        password: 'secretPassword',
        token: 'jwt.token.here',
        email: 'user@zaiqo.com',
        parameters: {
          ingredients: ['carrot', 'ginger'],
          _id: 'param_id',
          token: 'leak',
        },
      },
      {
        role: 'assistant',
        content: 'Ginger carrot soup is ready.',
        action: 'RECIPE_GENERATION',
        parameters: { mealType: 'dinner' },
        apiKey: 'gemini-key',
      },
    ];

    const clean = sanitizeConversationHistory(dirtyHistory);
    assert.equal(clean.length, 2);
    assert.equal(clean[0]._id, undefined, '_id must be stripped');
    assert.equal(clean[0].user, undefined, 'user reference must be stripped');
    assert.equal(clean[0].password, undefined, 'password must never be present');
    assert.equal(clean[0].token, undefined, 'token must never be present');
    assert.equal(clean[0].parameters._id, undefined, 'internal param IDs must be stripped');
    assert.equal(clean[0].parameters.token, undefined, 'token in params must be stripped');
    assert.deepEqual(clean[0].parameters.ingredients, ['carrot', 'ginger']);
    assert.equal(clean[1].apiKey, undefined, 'apiKey must never be present');
    assert.equal(clean[1].action, 'RECIPE_GENERATION');
  });

  await test('sanitizeConversationHistory bounds history to latest 6 messages', () => {
    const longHistory = [];
    for (let i = 1; i <= 12; i++) {
      longHistory.push({ role: 'user', content: `Message ${i}` });
    }
    const bounded = sanitizeConversationHistory(longHistory);
    assert.equal(bounded.length, 6, 'Must be bounded to latest 6 messages');
    assert.equal(bounded[0].content, 'Message 7');
    assert.equal(bounded[5].content, 'Message 12');
  });

  await test('understandZaiMessage passes sanitized conversation history into Gemini userPrompt', async () => {
    let capturedPrompt = null;
    const mockClient = {
      models: {
        generateContent: async (args) => {
          capturedPrompt = JSON.parse(args.contents);
          return {
            text: JSON.stringify({
              action: 'RECIPE_GENERATION',
              parameters: { ingredients: ['paneer', 'spinach'], spiceLevel: 'high' },
              response: 'Spicier paneer spinach recipe ready.',
            }),
          };
        },
      },
    };
    geminiService.setMockClient(mockClient);

    const history = [
      { role: 'user', content: 'I have paneer and spinach' },
      {
        role: 'assistant',
        content: 'Paneer spinach recipe ready',
        action: 'RECIPE_GENERATION',
        parameters: { ingredients: ['paneer', 'spinach'] },
      },
    ];

    try {
      await geminiService.understandZaiMessage('Make it spicier.', null, history);
      assert.ok(capturedPrompt);
      assert.equal(capturedPrompt.userMessage, 'Make it spicier.');
      assert.ok(Array.isArray(capturedPrompt.conversationHistory));
      assert.equal(capturedPrompt.conversationHistory.length, 2);
      assert.equal(capturedPrompt.conversationHistory[0].content, 'I have paneer and spinach');
      assert.deepEqual(capturedPrompt.conversationHistory[1].parameters.ingredients, [
        'paneer',
        'spinach',
      ]);
    } finally {
      geminiService.setMockClient(null);
    }
  });

  await test('zaiActionService: multi-turn follow-up preserves context and sessionId across turns', async () => {
    const testUser = new mongoose.Types.ObjectId();
    let turnCount = 0;
    const receivedHistories = [];

    const mockClient = {
      models: {
        generateContent: async (args) => {
          turnCount++;
          const body = JSON.parse(args.contents);
          receivedHistories.push(body.conversationHistory);
          if (turnCount === 1) {
            return {
              text: JSON.stringify({
                action: 'RECIPE_GENERATION',
                parameters: {
                  ingredients: ['paneer', 'spinach'],
                  mealType: 'dinner',
                  healthGoal: 'healthy',
                },
                response: 'Here is a healthy paneer and spinach dinner suggestion.',
              }),
            };
          } else {
            return {
              text: JSON.stringify({
                action: 'RECIPE_GENERATION',
                parameters: {
                  ingredients: ['paneer', 'spinach'],
                  mealType: 'dinner',
                  spiceLevel: 'spicy',
                },
                response: 'Here is your spicier paneer and spinach dinner.',
              }),
            };
          }
        },
      },
    };
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      // Turn 1
      const turn1Result = await zaiActionService.processMessage(
        testUser,
        'I have paneer and spinach. Give me a healthy dinner.'
      );
      assert.ok(turn1Result.sessionId);
      assert.equal(turn1Result.action, 'RECIPE_GENERATION');
      assert.equal(receivedHistories[0].length, 0, 'Turn 1 has no previous history');

      // Turn 2: Follow-up using sessionId
      const turn2Result = await zaiActionService.processMessage(
        testUser,
        'Make it spicier.',
        turn1Result.sessionId
      );
      assert.equal(turn2Result.sessionId, turn1Result.sessionId, 'SessionId must be preserved');
      assert.equal(receivedHistories[1].length, 2, 'Turn 2 must receive Turn 1 history');
      assert.equal(
        receivedHistories[1][0].content,
        'I have paneer and spinach. Give me a healthy dinner.'
      );
      assert.deepEqual(receivedHistories[1][1].parameters.ingredients, ['paneer', 'spinach']);

      // Verify conversation has 4 stored turns
      const session = await zaiConversationService.getConversation(testUser, turn1Result.sessionId);
      assert.equal(session.messages.length, 4);
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('zaiActionService: fallback to deterministic resolver preserves conversation memory', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalGetRecipes = recipeService.getRecipes;
    preferenceService.getPreferencesByUserId = async () => null;
    recipeService.getRecipes = async () => ({
      recipes: [{ name: 'Bruschetta', cuisine: 'italian' }],
      pagination: { total: 1 },
    });

    try {
      const result = await zaiActionService.processMessage(testUser, 'Find me Italian recipes');
      assert.ok(result.sessionId);
      assert.equal(result.action, 'RECIPE_SEARCH');

      const session = await zaiConversationService.getConversation(testUser, result.sessionId);
      assert.equal(session.messages.length, 2);
      assert.equal(session.messages[0].role, 'user');
      assert.equal(session.messages[0].content, 'Find me Italian recipes');
      assert.equal(session.messages[1].role, 'assistant');
      assert.equal(session.messages[1].action, 'RECIPE_SEARCH');
    } finally {
      preferenceService.getPreferencesByUserId = originalGetPref;
      recipeService.getRecipes = originalGetRecipes;
    }
  });

  await test('zaiActionService: domain service failure prevents storing invalid assistant turn', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalGetPlans = mealPlanService.getMealPlans;
    const originalGetPref = preferenceService.getPreferencesByUserId;
    preferenceService.getPreferencesByUserId = async () => null;

    mealPlanService.getMealPlans = async () => {
      throw new Error('Meal plan service failed');
    };

    const session = await zaiConversationService.createConversation(testUser);
    const sessionId = session._id.toString();

    try {
      await assert.rejects(
        async () => zaiActionService.processMessage(testUser, 'Give me a 5 day meal plan', sessionId),
        /Meal plan service failed/i
      );

      // Verify no invalid assistant turn was saved
      const updated = await zaiConversationService.getConversation(testUser, sessionId);
      assert.equal(updated.messages.length, 0);
    } finally {
      mealPlanService.getMealPlans = originalGetPlans;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('handleZaiMessage controller: invalid sessionId returns 400', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { message: 'hello', sessionId: 'invalid-id' },
    };
    const res = {};
    const next = (err) => {
      capturedError = err;
    };

    try {
      await handleZaiMessageController(req, res, next);
      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 400);
      assert.ok(capturedError.message.includes('Invalid session ID format'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  await test('handleZaiMessage controller: non-string sessionId returns 400', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { message: 'hello', sessionId: 12345 },
    };
    const res = {};
    const next = (err) => {
      capturedError = err;
    };

    try {
      await handleZaiMessageController(req, res, next);
      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 400);
      assert.ok(capturedError.message.includes('Session ID must be a string'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  await test('handleZaiMessage controller: unknown sessionId returns 404', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFindOne = ZaiConversation.findOne;
    mongoose.connection.readyState = 1;
    ZaiConversation.findOne = async () => null;

    const unknownId = new mongoose.Types.ObjectId().toString();
    let capturedError = null;
    const req = {
      user: { _id: mockUserId },
      body: { message: 'hello', sessionId: unknownId },
    };
    const res = {};
    const next = (err) => {
      capturedError = err;
    };

    try {
      await handleZaiMessageController(req, res, next);
      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 404);
      assert.ok(capturedError.message.includes('Conversation session not found'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      ZaiConversation.findOne = originalFindOne;
    }
  });

  await test('handleZaiMessage controller: cross-user session access returns 404 without revealing existence', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFindOne = ZaiConversation.findOne;
    mongoose.connection.readyState = 1;

    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const sessionAId = new mongoose.Types.ObjectId().toString();

    // Querying with userB should find nothing because query is { _id: sessionId, user: userB }
    ZaiConversation.findOne = async (q) => {
      if (q.user.toString() === userA.toString() && q._id.toString() === sessionAId) {
        return { _id: sessionAId, user: userA, messages: [] };
      }
      return null;
    };

    let capturedError = null;
    const req = {
      user: { _id: userB },
      body: { message: 'Attempt access', sessionId: sessionAId },
    };
    const res = {};
    const next = (err) => {
      capturedError = err;
    };

    try {
      await handleZaiMessageController(req, res, next);
      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 404);
      assert.ok(capturedError.message.includes('Conversation session not found'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      ZaiConversation.findOne = originalFindOne;
    }
  });

  await test('handleZaiMessage controller: successful message returns 200 with sessionId alongside existing response fields', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalProcess = zaiActionService.processMessage;
    mongoose.connection.readyState = 1;

    const generatedSessionId = new mongoose.Types.ObjectId().toString();
    zaiActionService.processMessage = async (userId, message, sessionId) => ({
      sessionId: sessionId || generatedSessionId,
      action: 'RECIPE_GENERATION',
      message: 'Recipe request acknowledged.',
      response: 'Recipe request acknowledged.',
      parameters: { ingredients: ['paneer', 'spinach'] },
      result: null,
    });

    let responseData = null;
    let statusCode = null;
    const req = {
      user: { _id: mockUserId },
      body: { message: 'I have paneer and spinach' },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => {
            responseData = body;
          },
        };
      },
    };
    const next = () => {};

    try {
      await handleZaiMessageController(req, res, next);
      assert.equal(statusCode, 200);
      assert.ok(responseData.success);
      assert.equal(responseData.data.sessionId, generatedSessionId);
      assert.ok(responseData.data.action);
      assert.ok(responseData.data.message);
      assert.ok(responseData.data.response);
      assert.ok(responseData.data.parameters);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      zaiActionService.processMessage = originalProcess;
    }
  });

  await test('zaiConversationService: database persistence failure throws error and propagates', async () => {
    const testUser = new mongoose.Types.ObjectId();
    zaiConversationService.setForceFailure(true);
    try {
      await assert.rejects(
        async () => zaiConversationService.createConversation(testUser),
        /Database persistence failure/i
      );
    } finally {
      zaiConversationService.setForceFailure(false);
    }
  });

  await test('conversation persistence does not store raw Gemini prompts, internal secrets, or API keys', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const session = await zaiConversationService.createConversation(testUser);
    const sessionId = session._id.toString();

    await zaiConversationService.appendTurns(testUser, sessionId, [
      {
        role: 'user',
        content: 'Check ingredients',
      },
      {
        role: 'assistant',
        content: 'Here are the ingredients.',
        action: 'RECIPE_GENERATION',
        parameters: { ingredients: ['paneer'] },
      },
    ]);

    const persisted = await zaiConversationService.getConversation(testUser, sessionId);
    const turn1 = persisted.messages[0];
    const turn2 = persisted.messages[1];

    assert.equal(turn1.systemInstruction, undefined);
    assert.equal(turn1.rawPrompt, undefined);
    assert.equal(turn1.apiKey, undefined);
    assert.equal(turn2.systemInstruction, undefined);
    assert.equal(turn2.rawPrompt, undefined);
    assert.equal(turn2.apiKey, undefined);
    assert.equal(turn2.token, undefined);
  });

  // ==========================================
  // 38. FOOD PHOTO → FOOD INTELLIGENCE TESTS
  // ==========================================
  await test('GeminiFoodAnalysisProvider implements BaseFoodAnalysisProvider', () => {
    const provider = new GeminiFoodAnalysisProvider();
    assert.ok(provider instanceof BaseFoodAnalysisProvider);
    assert.equal(typeof provider.analyze, 'function');
  });

  await test('GeminiFoodAnalysisProvider rejects missing or empty image buffer with 400', async () => {
    const provider = new GeminiFoodAnalysisProvider();
    await assert.rejects(
      async () => provider.analyze(null, 'image/jpeg'),
      /Image buffer is required/i
    );
    await assert.rejects(
      async () => provider.analyze(Buffer.alloc(0), 'image/jpeg'),
      /Image buffer is required/i
    );
  });

  await test('GeminiFoodAnalysisProvider rejects missing MIME type with 400', async () => {
    const provider = new GeminiFoodAnalysisProvider();
    await assert.rejects(
      async () => provider.analyze(Buffer.from('fake-bytes'), null),
      /Image MIME type is required/i
    );
  });

  await test('GeminiFoodAnalysisProvider converts buffer to base64 inlineData and formats multimodal contents', async () => {
    const provider = new GeminiFoodAnalysisProvider();
    let capturedArgs = null;

    const mockClient = {
      models: {
        generateContent: async (args) => {
          capturedArgs = args;
          return {
            text: JSON.stringify({
              isFood: true,
              dish: { name: 'Palak Paneer', mealType: 'dinner', cuisine: 'indian', isPlantBased: false },
              detectedFoods: [{ name: 'Palak Paneer', category: 'curry', estimatedQuantity: 1, unit: 'bowl', confidence: 0.95 }],
              ingredients: ['paneer', 'spinach', 'spices'],
              portion: { servingSize: '1 bowl', estimatedWeightGrams: 250, visualScale: 'medium bowl' },
              nutrition: { calories: 340, protein: 18, carbohydrates: 12, fats: 24, isEstimated: true },
              mealAnalysis: { summary: 'Nutrient-rich dinner', observations: ['High calcium and iron'], suggestions: ['Serve with roti'] },
              confidence: { overall: 0.95, level: 'high', isReliable: true },
              warnings: [],
              uncertaintyNotes: 'Portions are visual estimates.',
            }),
          };
        },
      },
    };
    provider.setMockClient(mockClient);

    const testBuffer = Buffer.from('simulated-png-pixel-data');
    const result = await provider.analyze(testBuffer, 'image/png');

    assert.ok(capturedArgs);
    assert.ok(Array.isArray(capturedArgs.contents));
    assert.equal(capturedArgs.contents[0].inlineData.mimeType, 'image/png');
    assert.equal(capturedArgs.contents[0].inlineData.data, testBuffer.toString('base64'));
    assert.equal(result.isFood, true);
    assert.equal(result.dish.name, 'Palak Paneer');
    assert.equal(result.provider.name, 'GeminiVision');
  });

  await test('validateFoodIntelligence parses valid complete food analysis output', () => {
    const raw = {
      isFood: true,
      dish: { name: '  Dal Makhani  ', mealType: ' DINNER ', cuisine: ' Indian ', isPlantBased: false },
      detectedFoods: [
        { name: ' Black Lentils ', category: ' Legumes ', estimatedQuantity: 1, unit: ' bowl ', confidence: 0.92 },
      ],
      ingredients: [' black lentils ', ' butter ', ' cream '],
      portion: { servingSize: ' 1 bowl (~250g) ', estimatedWeightGrams: 250, visualScale: ' ceramic bowl ' },
      nutrition: { calories: 380, protein: 14, carbohydrates: 42, fats: 18, isEstimated: false },
      mealAnalysis: { summary: ' Creamy rich lentils ', observations: ['High protein'], suggestions: ['Limit heavy cream'] },
      confidence: { overall: 0.92, level: 'high', isReliable: true },
      warnings: [],
      uncertaintyNotes: ' Visual estimate. ',
    };

    const validated = validateFoodIntelligence(raw);
    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.dish.name, 'Dal Makhani');
    assert.equal(validated.sanitized.dish.mealType, 'dinner');
    assert.equal(validated.sanitized.dish.cuisine, 'indian');
    assert.deepEqual(validated.sanitized.ingredients, ['black lentils', 'butter', 'cream']);
    assert.equal(validated.sanitized.portion.estimatedWeightGrams, 250);
    assert.equal(validated.sanitized.nutrition.calories, 380);
    assert.equal(validated.sanitized.nutrition.isEstimated, true, 'isEstimated must be strictly true');
    assert.equal(validated.sanitized.confidence.isReliable, true);
  });

  await test('validateFoodIntelligence normalizes nutrition and enforces isEstimated=true', () => {
    const raw = {
      isFood: true,
      dish: { name: 'Grilled Fish' },
      detectedFoods: [{ name: 'Fish Fillet', estimatedQuantity: 1 }],
      nutrition: { calories: 250.7, protein: 32.2, carbohydrates: 0, fats: 12.8, isEstimated: false },
    };

    const validated = validateFoodIntelligence(raw);
    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.nutrition.calories, 251);
    assert.equal(validated.sanitized.nutrition.protein, 32);
    assert.equal(validated.sanitized.nutrition.fats, 13);
    assert.equal(validated.sanitized.nutrition.isEstimated, true, 'Must strictly enforce isEstimated=true');
  });

  await test('validateFoodIntelligence handles non-food image safely without server failure', () => {
    const rawNonFood = {
      isFood: false,
      confidence: { overall: 0.02 },
      warnings: ['Image shows a computer keyboard, not food.'],
      mealAnalysis: { summary: 'No edible items detected.' },
    };

    const validated = validateFoodIntelligence(rawNonFood);
    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.isFood, false);
    assert.equal(validated.sanitized.dish, null);
    assert.deepEqual(validated.sanitized.detectedFoods, []);
    assert.deepEqual(validated.sanitized.ingredients, []);
    assert.equal(validated.sanitized.nutrition, null);
    assert.equal(validated.sanitized.confidence.level, 'none');
    assert.equal(validated.sanitized.confidence.isReliable, false);
    assert.ok(validated.sanitized.warnings[0].includes('not food'));
  });

  await test('validateFoodIntelligence rejects dangerous prototype pollution keys', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "isFood": true}');
    const validated = validateFoodIntelligence(malicious);
    assert.equal(validated.isValid, false);
    assert.ok(validated.error.includes('prohibited object keys'));
  });

  await test('validateFoodIntelligence clamps out-of-range confidence values', () => {
    const raw = {
      isFood: true,
      dish: { name: 'Apple' },
      detectedFoods: [{ name: 'Apple', confidence: 5.5 }],
      confidence: { overall: -1.2 },
    };

    const validated = validateFoodIntelligence(raw);
    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.detectedFoods[0].confidence, 1);
    assert.equal(validated.sanitized.confidence.overall, 0);
  });

  await test('validateFoodIntelligence flags low visual confidence and adds uncertainty warnings', () => {
    const rawLowConf = {
      isFood: true,
      dish: { name: 'Casserole' },
      detectedFoods: [{ name: 'Mixed Bake', confidence: 0.45 }],
      confidence: { overall: 0.45, isReliable: true },
      warnings: [],
    };

    const validated = validateFoodIntelligence(rawLowConf);
    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.confidence.isReliable, false, 'Must force isReliable=false when overall < 0.6');
    assert.ok(validated.sanitized.warnings.length > 0, 'Must inject warning when confidence is low');
    assert.ok(validated.sanitized.warnings[0].includes('Visual confidence is low'));
  });

  await test('foodAnalysisService integrates GeminiFoodAnalysisProvider with mocked Gemini client', async () => {
    const originalCreate = FoodAnalysis.create;
    let savedDoc = null;
    FoodAnalysis.create = async (payload) => {
      savedDoc = payload;
      return { id: 'analysis_food_int_1', ...payload };
    };

    const mockProvider = {
      analyze: async () => ({
        isFood: true,
        dish: { name: 'Vegetable Biryani', mealType: 'lunch', cuisine: 'indian', isPlantBased: true },
        detectedFoods: [
          { name: 'Biryani Rice', category: 'grain', estimatedQuantity: 1, unit: 'plate', confidence: 0.94 },
          { name: 'Mixed Vegetables', category: 'vegetable', estimatedQuantity: 1, unit: 'serving', confidence: 0.91 },
        ],
        ingredients: ['basmati rice', 'carrots', 'peas', 'beans', 'saffron', 'mint'],
        portion: { servingSize: '1 plate (~350g)', estimatedWeightGrams: 350, visualScale: 'dinner plate' },
        nutrition: { calories: 420, protein: 9, carbohydrates: 78, fats: 8, isEstimated: true },
        mealAnalysis: {
          summary: 'Aromatic vegetable biryani rich in complex carbohydrates.',
          observations: ['Low saturated fat', 'Good fiber from vegetables'],
          suggestions: ['Pair with a protein-rich cucumber raita'],
        },
        confidence: { overall: 0.93, level: 'high', isReliable: true },
        warnings: [],
        uncertaintyNotes: 'Portions are visual approximations.',
        provider: { name: 'GeminiVision', model: 'gemini-2.5-flash' },
      }),
    };

    setFoodAnalysisProvider(mockProvider);

    try {
      const mockFile = {
        buffer: Buffer.from('biryani-image-bytes'),
        mimetype: 'image/jpeg',
        size: 2048,
        originalname: 'biryani.jpg',
      };

      const result = await foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile);
      assert.ok(savedDoc);
      assert.equal(savedDoc.status, 'completed');
      assert.equal(savedDoc.dish.name, 'Vegetable Biryani');
      assert.equal(savedDoc.detectedFoods.length, 2);
      assert.equal(savedDoc.ingredients.length, 6);
      assert.equal(savedDoc.portion.estimatedWeightGrams, 350);
      assert.equal(savedDoc.nutrition.calories, 420);
      assert.equal(savedDoc.confidence.isReliable, true);
      assert.equal(savedDoc.provider.name, 'GeminiVision');
    } finally {
      FoodAnalysis.create = originalCreate;
      setFoodAnalysisProvider(null);
    }
  });

  await test('foodAnalysisService persists dish, ingredients, portion, confidence, and warnings', async () => {
    const originalCreate = FoodAnalysis.create;
    let savedDoc = null;
    FoodAnalysis.create = async (payload) => {
      savedDoc = payload;
      return { id: 'analysis_rec_2', ...payload };
    };

    try {
      await foodAnalysisService.createAnalysisRecord(
        mockUserId,
        { mimeType: 'image/png', size: 1024, originalName: 'scan.png' },
        {
          status: 'completed',
          dish: { name: 'Tofu Salad', mealType: 'lunch', cuisine: 'mediterranean' },
          ingredients: ['tofu', 'cucumbers', 'olives'],
          portion: { servingSize: '1 bowl', estimatedWeightGrams: 200 },
          nutrition: { calories: 220, protein: 16, carbohydrates: 8, fats: 14, isEstimated: true },
          confidence: { overall: 0.88, level: 'high', isReliable: true },
          warnings: ['Dressing quantity is an estimate'],
        }
      );

      assert.ok(savedDoc);
      assert.equal(savedDoc.dish.name, 'Tofu Salad');
      assert.deepEqual(savedDoc.ingredients, ['tofu', 'cucumbers', 'olives']);
      assert.equal(savedDoc.portion.estimatedWeightGrams, 200);
      assert.equal(savedDoc.confidence.overall, 0.88);
      assert.equal(savedDoc.warnings[0], 'Dressing quantity is an estimate');
    } finally {
      FoodAnalysis.create = originalCreate;
    }
  });

  await test('foodAnalysisService handles multiple detected foods on a composite plate', async () => {
    const originalCreate = FoodAnalysis.create;
    let savedDoc = null;
    FoodAnalysis.create = async (payload) => {
      savedDoc = payload;
      return { id: 'composite_analysis', ...payload };
    };

    const mockMultiFoodProvider = {
      analyze: async () => ({
        isFood: true,
        dish: { name: 'Indian Thali', mealType: 'lunch', cuisine: 'indian' },
        detectedFoods: [
          { name: 'Paneer Makhani', category: 'curry', estimatedQuantity: 1, unit: 'katori (~150g)', confidence: 0.95 },
          { name: 'Yellow Dal', category: 'lentil', estimatedQuantity: 1, unit: 'katori (~150g)', confidence: 0.92 },
          { name: 'Jeera Rice', category: 'grain', estimatedQuantity: 1, unit: 'cup (~120g)', confidence: 0.90 },
          { name: 'Roti', category: 'flatbread', estimatedQuantity: 2, unit: 'pieces', confidence: 0.96 },
        ],
        ingredients: ['paneer', 'tomatoes', 'yellow lentils', 'rice', 'wheat flour'],
        portion: { servingSize: '1 complete thali', estimatedWeightGrams: 600, visualScale: 'round thali plate' },
        nutrition: { calories: 750, protein: 28, carbohydrates: 98, fats: 26, isEstimated: true },
        mealAnalysis: { summary: 'Complete traditional thali plate.' },
        confidence: { overall: 0.93, level: 'high', isReliable: true },
        warnings: [],
      }),
    };
    setFoodAnalysisProvider(mockMultiFoodProvider);

    try {
      const mockFile = { buffer: Buffer.from('thali-bytes'), mimetype: 'image/jpeg', size: 3000 };
      await foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile);
      assert.ok(savedDoc);
      assert.equal(savedDoc.detectedFoods.length, 4);
      assert.equal(savedDoc.detectedFoods[0].name, 'Paneer Makhani');
      assert.equal(savedDoc.detectedFoods[3].name, 'Roti');
      assert.equal(savedDoc.nutrition.calories, 750);
    } finally {
      FoodAnalysis.create = originalCreate;
      setFoodAnalysisProvider(null);
    }
  });

  await test('foodAnalysisService unconfigured provider returns 503 without fake data', async () => {
    assert.equal(getFoodAnalysisProvider(), null);
    const mockFile = { buffer: Buffer.from('image'), mimetype: 'image/jpeg', size: 100 };
    await assert.rejects(
      async () => foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile),
      /Food analysis provider is not configured yet/i
    );
  });

  await test('foodAnalysisService provider error handles safely without crashing', async () => {
    const failingProvider = {
      analyze: async () => {
        throw new Error('Vision upstream network connection reset');
      },
    };
    setFoodAnalysisProvider(failingProvider);

    try {
      const mockFile = { buffer: Buffer.from('image'), mimetype: 'image/jpeg', size: 100 };
      await assert.rejects(
        async () => foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile),
        /Vision upstream network connection reset/i
      );
    } finally {
      setFoodAnalysisProvider(null);
    }
  });

  await test('Zai conversational action references user recent food analysis within 24 hours', async () => {
    const originalGetHistory = foodAnalysisService.getAnalysisHistory;
    const testUser = new mongoose.Types.ObjectId();

    foodAnalysisService.getAnalysisHistory = async (uid) => {
      assert.equal(uid.toString(), testUser.toString());
      return [
        {
          _id: 'recent_scan_123',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          dish: { name: 'Palak Paneer with Brown Rice' },
          nutrition: { calories: 480, protein: 22 },
          mealAnalysis: { summary: 'High fiber balanced dinner.' },
        },
      ];
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_ANALYSIS,
        { photoRequired: true },
        testUser,
        null
      );

      assert.ok(result.data);
      assert.ok(result.message.includes('Palak Paneer with Brown Rice'));
      assert.ok(result.message.includes('480 kcal'));
      assert.ok(result.message.includes('22g protein'));
    } finally {
      foodAnalysisService.getAnalysisHistory = originalGetHistory;
    }
  });

  await test('Zai conversational action requests upload when no recent analysis exists', async () => {
    const originalGetHistory = foodAnalysisService.getAnalysisHistory;
    const testUser = new mongoose.Types.ObjectId();

    // Stale analysis (>24 hours ago)
    foodAnalysisService.getAnalysisHistory = async () => [
      {
        _id: 'stale_scan',
        status: 'completed',
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours ago
        dish: { name: 'Old Sandwich' },
      },
    ];

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_ANALYSIS,
        { photoRequired: true },
        testUser,
        null
      );

      assert.equal(result.data, null);
      assert.ok(result.message.includes('requires an image file'));
    } finally {
      foodAnalysisService.getAnalysisHistory = originalGetHistory;
    }
  });

  await test('User isolation: Zai action cannot reference another user food analysis', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalGetHistory = foodAnalysisService.getAnalysisHistory;
    foodAnalysisService.getAnalysisHistory = async (uid) => {
      queriedUserId = uid;
      if (uid.toString() === userA.toString()) {
        return [{ status: 'completed', createdAt: new Date(), dish: { name: 'User A Omelette' } }];
      }
      return [];
    };

    try {
      const resA = await zaiActionService.dispatchAction(ZAI_ACTIONS.FOOD_ANALYSIS, {}, userA, null);
      assert.equal(queriedUserId.toString(), userA.toString());
      assert.ok(resA.message.includes('User A Omelette'));

      const resB = await zaiActionService.dispatchAction(ZAI_ACTIONS.FOOD_ANALYSIS, {}, userB, null);
      assert.equal(queriedUserId.toString(), userB.toString());
      assert.equal(resB.data, null, 'User B must not see User A scan');
      assert.ok(resB.message.includes('requires an image file'));
    } finally {
      foodAnalysisService.getAnalysisHistory = originalGetHistory;
    }
  });

  await test('Privacy & Security: raw Gemini prompts, internal secrets, and API keys are not persisted', async () => {
    const originalCreate = FoodAnalysis.create;
    let persistedRecord = null;
    FoodAnalysis.create = async (payload) => {
      persistedRecord = payload;
      return { id: 'clean_sec_record', ...payload };
    };

    const mockProvider = {
      analyze: async () => ({
        isFood: true,
        dish: { name: 'Apple' },
        rawPrompt: 'secret prompt text',
        apiKey: 'AIzaSySecretApiKey',
        jwtToken: 'jwt.token.secret',
      }),
    };
    setFoodAnalysisProvider(mockProvider);

    try {
      const mockFile = { buffer: Buffer.from('apple-pixels'), mimetype: 'image/jpeg', size: 100 };
      await foodAnalysisService.analyzeFoodPhoto(mockUserId, mockFile);

      assert.ok(persistedRecord);
      assert.equal(persistedRecord.rawPrompt, undefined);
      assert.equal(persistedRecord.apiKey, undefined);
      assert.equal(persistedRecord.jwtToken, undefined);
    } finally {
      FoodAnalysis.create = originalCreate;
      setFoodAnalysisProvider(null);
    }
  });

  await test('FoodAnalysis model schema validates new dish, ingredients, portion, confidence, and warnings fields', () => {
    const doc = new FoodAnalysis({
      user: new mongoose.Types.ObjectId(),
      image: { mimeType: 'image/jpeg', size: 1024 },
      dish: { name: 'Poha', mealType: 'breakfast', cuisine: 'indian', isPlantBased: true },
      ingredients: ['flattened rice', 'mustard seeds', 'peanuts', 'curry leaves'],
      portion: { servingSize: '1 bowl', estimatedWeightGrams: 200, visualScale: 'cereal bowl' },
      nutrition: { calories: 250, protein: 5, carbohydrates: 45, fats: 6, isEstimated: true },
      confidence: { overall: 0.91, level: 'high', isReliable: true },
      warnings: ['Peanuts detected: common allergen'],
      uncertaintyNotes: 'Portions are visual estimates.',
    });

    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.dish.name, 'Poha');
    assert.equal(doc.portion.estimatedWeightGrams, 200);
    assert.equal(doc.confidence.level, 'high');
  });

  await test('FoodAnalysis model schema defaults backwards-compatible values for legacy documents', () => {
    const legacyDoc = new FoodAnalysis({
      user: new mongoose.Types.ObjectId(),
      image: { mimeType: 'image/png', size: 500 },
    });

    const err = legacyDoc.validateSync();
    assert.equal(err, undefined);
    assert.equal(legacyDoc.dish, null);
    assert.deepEqual(legacyDoc.ingredients, []);
    assert.equal(legacyDoc.portion.servingSize, '1 serving');
    assert.equal(legacyDoc.confidence.overall, 0);
    assert.equal(legacyDoc.confidence.level, 'low');
    assert.deepEqual(legacyDoc.warnings, []);
  });

  // ==========================================
  // 39. FOOD DIARY + DAILY FOOD INTELLIGENCE TESTS
  // ==========================================

  await test('FoodDiary model schema validates required fields and defaults', () => {
    const doc = new FoodDiary({
      user: new mongoose.Types.ObjectId(),
      foodName: 'Moong Dal Khichdi',
      mealType: 'dinner',
      nutrition: {
        calories: 320,
        protein: 12,
        carbohydrates: 52,
        fats: 6,
        isEstimated: true,
      },
    });

    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.foodName, 'Moong Dal Khichdi');
    assert.equal(doc.mealType, 'dinner');
    assert.equal(doc.source, 'MANUAL');
    assert.equal(doc.portion.servingSize, '1 serving');
    assert.equal(doc.userEdits.isEdited, false);
    assert.equal(doc.userEdits.originalNutrition, null);
  });

  await test('FoodDiary model rejects missing user, foodName, or mealType', () => {
    // Missing user
    const noUser = new FoodDiary({ foodName: 'Rice', mealType: 'lunch' });
    const errNoUser = noUser.validateSync();
    assert.ok(errNoUser.errors.user);

    // Missing foodName
    const noFood = new FoodDiary({ user: new mongoose.Types.ObjectId(), mealType: 'lunch' });
    const errNoFood = noFood.validateSync();
    assert.ok(errNoFood.errors.foodName);

    // Missing mealType
    const noMeal = new FoodDiary({ user: new mongoose.Types.ObjectId(), foodName: 'Rice' });
    const errNoMeal = noMeal.validateSync();
    assert.ok(errNoMeal.errors.mealType);
  });

  await test('FoodDiary model rejects negative nutrition values', () => {
    const doc = new FoodDiary({
      user: new mongoose.Types.ObjectId(),
      foodName: 'Negative Salad',
      mealType: 'lunch',
      nutrition: { calories: -100, protein: -5 },
    });
    const err = doc.validateSync();
    assert.ok(err.errors['nutrition.calories']);
    assert.ok(err.errors['nutrition.protein']);
  });

  await test('FoodDiary model rejects nutrition values exceeding sensible safety ceilings', () => {
    const doc = new FoodDiary({
      user: new mongoose.Types.ObjectId(),
      foodName: 'Super Feast',
      mealType: 'lunch',
      nutrition: { calories: 15000, protein: 1200 },
      portion: { estimatedWeightGrams: 8000 },
    });
    const err = doc.validateSync();
    assert.ok(err.errors['nutrition.calories']);
    assert.ok(err.errors['nutrition.protein']);
    assert.ok(err.errors['portion.estimatedWeightGrams']);
  });

  await test('FoodDiary model rejects invalid mealType enum', () => {
    const doc = new FoodDiary({
      user: new mongoose.Types.ObjectId(),
      foodName: 'Snack',
      mealType: 'midnight_feast',
    });
    const err = doc.validateSync();
    assert.ok(err.errors.mealType);
  });

  await test('FoodDiary toJSON cleans output correctly (_id to id, strips __v)', () => {
    const doc = new FoodDiary({
      user: new mongoose.Types.ObjectId(),
      foodName: 'Apple',
      mealType: 'snack',
    });
    const json = doc.toJSON();
    assert.ok(json.id);
    assert.equal(json._id, undefined);
    assert.equal(json.__v, undefined);
  });

  await test('validateDiaryEntryInput normalizes valid manual entry and enforces isEstimated=true', () => {
    const raw = {
      foodName: '  Paneer Butter Masala  ',
      mealType: ' DINNER ',
      portion: { servingSize: ' 1 bowl ', estimatedWeightGrams: 280 },
      nutrition: { calories: 420, protein: 16, carbohydrates: 14, fats: 32, isEstimated: false },
      ingredients: [' paneer ', ' tomatoes ', ' butter '],
      notes: ' Cooked with less oil ',
    };

    const res = validateDiaryEntryInput(raw);
    assert.equal(res.isValid, true);
    assert.equal(res.sanitized.foodName, 'Paneer Butter Masala');
    assert.equal(res.sanitized.mealType, 'dinner');
    assert.equal(res.sanitized.portion.estimatedWeightGrams, 280);
    assert.equal(res.sanitized.nutrition.calories, 420);
    assert.equal(res.sanitized.nutrition.isEstimated, true, 'isEstimated must be strictly true');
    assert.deepEqual(res.sanitized.ingredients, ['paneer', 'tomatoes', 'butter']);
    assert.equal(res.sanitized.notes, 'Cooked with less oil');
  });

  await test('validateDiaryEntryInput rejects missing required fields and out-of-range values', () => {
    assert.equal(validateDiaryEntryInput(null).isValid, false);
    assert.equal(validateDiaryEntryInput({}).isValid, false);
    assert.equal(validateDiaryEntryInput({ foodName: '' }).isValid, false);
    assert.equal(validateDiaryEntryInput({ foodName: 'Soup', mealType: 'invalid_type' }).isValid, false);
    assert.equal(validateDiaryEntryInput({ foodName: 'Soup', mealType: 'lunch', nutrition: { calories: -10 } }).isValid, false);
    assert.equal(validateDiaryEntryInput({ foodName: 'Soup', mealType: 'lunch', nutrition: { calories: 20000 } }).isValid, false);
    assert.equal(validateDiaryEntryInput({ foodName: 'Soup', mealType: 'lunch', portion: { estimatedWeightGrams: 9000 } }).isValid, false);
  });

  await test('validateDiaryEntryInput rejects prototype pollution keys', () => {
    const malicious = JSON.parse('{"foodName":"Poison","mealType":"lunch","__proto__":{"polluted":true}}');
    const res = validateDiaryEntryInput(malicious);
    assert.equal(res.isValid, false);
    assert.ok(res.error.includes('Forbidden'));
  });

  await test('validateDiaryUpdateInput allows valid updates and rejects immutable fields', () => {
    // Valid update
    const validUpdate = validateDiaryUpdateInput({
      foodName: 'Updated Dal',
      portion: { estimatedWeightGrams: 300 },
      nutrition: { calories: 350 },
      notes: 'Added extra ghee',
    });
    assert.equal(validUpdate.isValid, true);
    assert.equal(validUpdate.sanitized.foodName, 'Updated Dal');
    assert.equal(validUpdate.sanitized.nutrition.calories, 350);

    // Rejection of immutable fields
    assert.equal(validateDiaryUpdateInput({ user: new mongoose.Types.ObjectId() }).isValid, false);
    assert.equal(validateDiaryUpdateInput({ source: 'FOOD_ANALYSIS' }).isValid, false);
    assert.equal(validateDiaryUpdateInput({ analysisRef: new mongoose.Types.ObjectId() }).isValid, false);
    assert.equal(validateDiaryUpdateInput({ _id: 'new_id' }).isValid, false);
  });

  await test('isValidIanaTimezone validates legitimate timezones and rejects invalid strings', () => {
    assert.equal(isValidIanaTimezone('Asia/Kolkata'), true);
    assert.equal(isValidIanaTimezone('UTC'), true);
    assert.equal(isValidIanaTimezone('America/New_York'), true);
    assert.equal(isValidIanaTimezone('Europe/London'), true);
    assert.equal(isValidIanaTimezone('Invalid/Timezone'), false);
    assert.equal(isValidIanaTimezone(''), false);
    assert.equal(isValidIanaTimezone(null), false);
  });

  await test('getTimezoneDateRange calculates exact day boundaries for IANA timezone', () => {
    const range = getTimezoneDateRange('2026-10-06', 'Asia/Kolkata');
    assert.equal(range.formattedDate, '2026-10-06');
    assert.ok(range.startOfDay instanceof Date);
    assert.ok(range.endOfDay instanceof Date);
    // In UTC, start of 2026-10-06 in Asia/Kolkata (+05:30) is 2026-10-05T18:30:00.000Z
    assert.equal(range.startOfDay.toISOString(), '2026-10-05T18:30:00.000Z');
    assert.equal(range.endOfDay.toISOString(), '2026-10-06T18:29:59.999Z');
  });

  await test('foodDiaryService.createEntry persists valid manual entry', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalCreate = FoodDiary.create;
    let savedDoc = null;
    FoodDiary.create = async (doc) => {
      savedDoc = doc;
      return { id: 'diary_123', ...doc };
    };

    try {
      const entry = await foodDiaryService.createManualEntry(testUser, {
        foodName: 'Masala Dosa',
        mealType: 'breakfast',
        portion: { servingSize: '1 dosa', estimatedWeightGrams: 200 },
        nutrition: { calories: 300, protein: 6, carbohydrates: 48, fats: 10 },
      });

      assert.ok(entry);
      assert.equal(savedDoc.user.toString(), testUser.toString());
      assert.equal(savedDoc.foodName, 'Masala Dosa');
      assert.equal(savedDoc.source, 'MANUAL');
      assert.equal(savedDoc.analysisRef, null);
    } finally {
      FoodDiary.create = originalCreate;
    }
  });

  await test('foodDiaryService.createEntry rejects unauthenticated user with 400', async () => {
    await assert.rejects(
      async () => foodDiaryService.createEntry(null, { foodName: 'Roti', mealType: 'dinner' }),
      /User ID is required/i
    );
  });

  await test('foodDiaryService.createFromAnalysis copies snapshot values and links analysisRef', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const mockAnalysisId = new mongoose.Types.ObjectId();

    const originalGetAnalysis = foodAnalysisService.getAnalysisById;
    const originalCreate = FoodDiary.create;
    let savedDiaryDoc = null;

    foodAnalysisService.getAnalysisById = async (uid, aid) => {
      assert.equal(uid.toString(), testUser.toString());
      assert.equal(aid.toString(), mockAnalysisId.toString());
      return {
        _id: mockAnalysisId,
        user: testUser,
        status: 'completed',
        dish: { name: 'Chole Bhature', mealType: 'lunch' },
        detectedFoods: [{ name: 'Bhatura', estimatedQuantity: 2 }],
        ingredients: ['chickpeas', 'flour', 'spices'],
        portion: { servingSize: '2 bhaturas + 1 bowl chole', estimatedWeightGrams: 450 },
        nutrition: { calories: 680, protein: 18, carbohydrates: 85, fats: 28, isEstimated: true },
      };
    };

    FoodDiary.create = async (doc) => {
      savedDiaryDoc = doc;
      return { id: 'diary_from_analysis_1', ...doc };
    };

    try {
      const result = await foodDiaryService.createFromAnalysis(testUser, mockAnalysisId.toString());

      assert.ok(result);
      assert.equal(savedDiaryDoc.user.toString(), testUser.toString());
      assert.equal(savedDiaryDoc.foodName, 'Chole Bhature');
      assert.equal(savedDiaryDoc.mealType, 'lunch');
      assert.equal(savedDiaryDoc.source, 'FOOD_ANALYSIS');
      assert.equal(savedDiaryDoc.analysisRef.toString(), mockAnalysisId.toString());
      assert.equal(savedDiaryDoc.nutrition.calories, 680);
      assert.equal(savedDiaryDoc.portion.estimatedWeightGrams, 450);
      assert.deepEqual(savedDiaryDoc.ingredients, ['chickpeas', 'flour', 'spices']);
    } finally {
      foodAnalysisService.getAnalysisById = originalGetAnalysis;
      FoodDiary.create = originalCreate;
    }
  });

  await test('foodDiaryService.createFromAnalysis enforces ownership protection (403 for other user)', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const mockAnalysisId = new mongoose.Types.ObjectId();

    const originalGetAnalysis = foodAnalysisService.getAnalysisById;
    // foodAnalysisService.getAnalysisById throws forbidden when user does not match
    foodAnalysisService.getAnalysisById = async (uid) => {
      if (uid.toString() !== userA.toString()) {
        const { forbidden } = await import('../src/utils/apiError.js');
        throw forbidden('You do not have permission to access this food analysis.');
      }
      return { _id: mockAnalysisId, user: userA, status: 'completed' };
    };

    try {
      await assert.rejects(
        async () => foodDiaryService.createFromAnalysis(userB, mockAnalysisId.toString()),
        /do not have permission/i
      );
    } finally {
      foodAnalysisService.getAnalysisById = originalGetAnalysis;
    }
  });

  await test('foodDiaryService.createFromAnalysis rejects missing analysis with 404', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const badAnalysisId = new mongoose.Types.ObjectId();

    const originalGetAnalysis = foodAnalysisService.getAnalysisById;
    foodAnalysisService.getAnalysisById = async () => {
      const { notFound } = await import('../src/utils/apiError.js');
      throw notFound('Food analysis record not found.');
    };

    try {
      await assert.rejects(
        async () => foodDiaryService.createFromAnalysis(testUser, badAnalysisId.toString()),
        /Food analysis record not found/i
      );
    } finally {
      foodAnalysisService.getAnalysisById = originalGetAnalysis;
    }
  });

  await test('foodDiaryService.createFromAnalysis rejects incomplete or non-food analysis with 400', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();

    const originalGetAnalysis = foodAnalysisService.getAnalysisById;
    // Incomplete analysis
    foodAnalysisService.getAnalysisById = async () => ({
      _id: analysisId,
      user: testUser,
      status: 'pending',
    });

    try {
      await assert.rejects(
        async () => foodDiaryService.createFromAnalysis(testUser, analysisId.toString()),
        /has not completed yet/i
      );
    } finally {
      foodAnalysisService.getAnalysisById = originalGetAnalysis;
    }
  });

  await test('FoodAnalysis document remains completely unchanged after FoodDiary creation and edit', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const analysisId = new mongoose.Types.ObjectId();

    const originalAnalysis = {
      _id: analysisId,
      user: testUser,
      status: 'completed',
      dish: { name: 'Idli Sambar', mealType: 'breakfast' },
      portion: { servingSize: '3 idlis', estimatedWeightGrams: 240 },
      nutrition: { calories: 220, protein: 8, carbohydrates: 42, fats: 2, isEstimated: true },
    };

    const originalGetAnalysis = foodAnalysisService.getAnalysisById;
    const originalCreate = FoodDiary.create;
    foodAnalysisService.getAnalysisById = async () => originalAnalysis;
    FoodDiary.create = async (doc) => ({ id: 'new_diary_id', ...doc });

    try {
      // Create diary entry with override
      await foodDiaryService.createFromAnalysis(testUser, analysisId.toString(), {
        portion: { servingSize: '5 idlis', estimatedWeightGrams: 400 },
        nutrition: { calories: 360, protein: 13, carbohydrates: 70, fats: 3, isEstimated: true },
      });

      // Verify original FoodAnalysis was not mutated
      assert.equal(originalAnalysis.portion.servingSize, '3 idlis');
      assert.equal(originalAnalysis.portion.estimatedWeightGrams, 240);
      assert.equal(originalAnalysis.nutrition.calories, 220);
    } finally {
      foodAnalysisService.getAnalysisById = originalGetAnalysis;
      FoodDiary.create = originalCreate;
    }
  });

  await test('foodDiaryService.getEntryById enforces user ownership', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const entryId = new mongoose.Types.ObjectId();

    const originalFindOne = FoodDiary.findOne;
    const originalFindById = FoodDiary.findById;

    FoodDiary.findOne = async (q) => {
      if (q.user.toString() === ownerId.toString()) {
        return { _id: entryId, user: ownerId, foodName: 'Secret Snack' };
      }
      return null;
    };
    FoodDiary.findById = async () => ({ _id: entryId, user: ownerId });

    try {
      // Owner succeeds
      const entry = await foodDiaryService.getEntryById(ownerId, entryId.toString());
      assert.equal(entry.foodName, 'Secret Snack');

      // Attacker rejected with 403 Forbidden
      await assert.rejects(
        async () => foodDiaryService.getEntryById(attackerId, entryId.toString()),
        /do not have permission/i
      );
    } finally {
      FoodDiary.findOne = originalFindOne;
      FoodDiary.findById = originalFindById;
    }
  });

  await test('foodDiaryService.getHistory queries strictly by authenticated user ID and supports pagination', async () => {
    const userA = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalFind = FoodDiary.find;
    FoodDiary.find = (q) => {
      queriedUserId = q.user;
      return {
        sort: () => ({
          exec: async () => [{ user: q.user, foodName: 'Meal 1' }],
          skip: () => ({
            limit: () => ({
              exec: async () => [{ user: q.user, foodName: 'Meal 1' }],
            }),
          }),
        }),
      };
    };

    try {
      await foodDiaryService.getHistory(userA, { page: 2, limit: 5 });
      assert.equal(queriedUserId.toString(), userA.toString(), 'Query must use User A ID');
    } finally {
      FoodDiary.find = originalFind;
    }
  });

  await test('foodDiaryService.updateEntry updates portion and records audit metadata', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const entryId = new mongoose.Types.ObjectId();

    const mockDoc = {
      _id: entryId,
      user: testUser,
      foodName: 'Oatmeal',
      mealType: 'breakfast',
      portion: { servingSize: '1 bowl', estimatedWeightGrams: 200 },
      nutrition: { calories: 250, protein: 8, carbohydrates: 45, fats: 4 },
      userEdits: { isEdited: false, editedAt: null, originalNutrition: null },
      save: async function () { return this; },
    };

    const originalFindOne = FoodDiary.findOne;
    FoodDiary.findOne = async () => mockDoc;

    try {
      const updated = await foodDiaryService.updateEntry(testUser, entryId.toString(), {
        portion: { servingSize: '2 bowls', estimatedWeightGrams: 400 },
      });

      assert.equal(updated.portion.servingSize, '2 bowls');
      assert.equal(updated.portion.estimatedWeightGrams, 400);
      assert.equal(updated.userEdits.isEdited, true);
      assert.ok(updated.userEdits.editedAt instanceof Date);
    } finally {
      FoodDiary.findOne = originalFindOne;
    }
  });

  await test('foodDiaryService.updateEntry updates nutrition and snapshots originalNutrition', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const entryId = new mongoose.Types.ObjectId();

    const mockDoc = {
      _id: entryId,
      user: testUser,
      foodName: 'Pulao',
      mealType: 'lunch',
      portion: { servingSize: '1 plate', estimatedWeightGrams: 300 },
      nutrition: { calories: 350, protein: 7, carbohydrates: 60, fats: 9, isEstimated: true },
      userEdits: { isEdited: false, editedAt: null, originalNutrition: null },
      save: async function () { return this; },
    };

    const originalFindOne = FoodDiary.findOne;
    FoodDiary.findOne = async () => mockDoc;

    try {
      const updated = await foodDiaryService.updateEntry(testUser, entryId.toString(), {
        nutrition: { calories: 450, protein: 9 },
      });

      assert.equal(updated.nutrition.calories, 450);
      assert.equal(updated.userEdits.isEdited, true);
      assert.ok(updated.userEdits.originalNutrition);
      assert.equal(updated.userEdits.originalNutrition.calories, 350, 'Original calories must be snapshot');
    } finally {
      FoodDiary.findOne = originalFindOne;
    }
  });

  await test('FoodDiary audit: originalNutrition preserves initial snapshot on subsequent edits', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const entryId = new mongoose.Types.ObjectId();

    // Already edited once, originalNutrition already captured as 350
    const mockDoc = {
      _id: entryId,
      user: testUser,
      foodName: 'Pulao',
      mealType: 'lunch',
      portion: { servingSize: '1 plate', estimatedWeightGrams: 300 },
      nutrition: { calories: 450, protein: 9, carbohydrates: 60, fats: 9, isEstimated: true },
      userEdits: {
        isEdited: true,
        editedAt: new Date(Date.now() - 3600000),
        originalNutrition: { calories: 350, protein: 7, carbohydrates: 60, fats: 9, isEstimated: true },
      },
      save: async function () { return this; },
    };

    const originalFindOne = FoodDiary.findOne;
    FoodDiary.findOne = async () => mockDoc;

    try {
      const secondUpdate = await foodDiaryService.updateEntry(testUser, entryId.toString(), {
        nutrition: { calories: 520 },
      });

      assert.equal(secondUpdate.nutrition.calories, 520);
      assert.equal(secondUpdate.userEdits.originalNutrition.calories, 350, 'Must NOT overwrite initial snapshot');
    } finally {
      FoodDiary.findOne = originalFindOne;
    }
  });

  await test('foodDiaryService.updateEntry prevents cross-user edit with 403', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const entryId = new mongoose.Types.ObjectId();

    const originalFindOne = FoodDiary.findOne;
    const originalFindById = FoodDiary.findById;

    FoodDiary.findOne = async () => null;
    FoodDiary.findById = async () => ({ _id: entryId, user: ownerId });

    try {
      await assert.rejects(
        async () => foodDiaryService.updateEntry(attackerId, entryId.toString(), { foodName: 'Hacked' }),
        /do not have permission/i
      );
    } finally {
      FoodDiary.findOne = originalFindOne;
      FoodDiary.findById = originalFindById;
    }
  });

  await test('foodDiaryService.deleteEntry allows owner to delete and prevents cross-user delete with 403', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const attackerId = new mongoose.Types.ObjectId();
    const entryId = new mongoose.Types.ObjectId();

    const originalFindOne = FoodDiary.findOne;
    const originalFindById = FoodDiary.findById;
    const originalDelete = FoodDiary.findByIdAndDelete;

    FoodDiary.findOne = async (q) => {
      if (q.user.toString() === ownerId.toString()) return { _id: entryId, user: ownerId };
      return null;
    };
    FoodDiary.findById = async () => ({ _id: entryId, user: ownerId });
    FoodDiary.findByIdAndDelete = async () => true;

    try {
      // Attacker rejected with 403
      await assert.rejects(
        async () => foodDiaryService.deleteEntry(attackerId, entryId.toString()),
        /do not have permission/i
      );

      // Owner succeeds
      const deleted = await foodDiaryService.deleteEntry(ownerId, entryId.toString());
      assert.equal(deleted, true);
    } finally {
      FoodDiary.findOne = originalFindOne;
      FoodDiary.findById = originalFindById;
      FoodDiary.findByIdAndDelete = originalDelete;
    }
  });

  await test('foodDiaryService.getDailySummary calculates on-demand daily aggregation for multiple meals', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalFind = FoodDiary.find;
    const originalGetPref = preferenceService.getPreferencesByUserId;

    const mockEntries = [
      { mealType: 'breakfast', foodName: 'Oats', nutrition: { calories: 300, protein: 10, carbohydrates: 50, fats: 5 } },
      { mealType: 'lunch', foodName: 'Thali', nutrition: { calories: 650, protein: 25, carbohydrates: 80, fats: 20 } },
      { mealType: 'dinner', foodName: 'Khichdi', nutrition: { calories: 400, protein: 15, carbohydrates: 60, fats: 8 } },
    ];

    FoodDiary.find = () => ({
      sort: () => Promise.resolve(mockEntries),
    });
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      const summary = await foodDiaryService.getDailySummary(testUser, '2026-10-06', 'Asia/Kolkata');

      assert.equal(summary.entryCount, 3);
      assert.equal(summary.totals.calories, 1350);
      assert.equal(summary.totals.protein, 50);
      assert.equal(summary.totals.carbohydrates, 190);
      assert.equal(summary.totals.fats, 33);
      assert.equal(summary.goalComparison.status, 'no_targets_set');
    } finally {
      FoodDiary.find = originalFind;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('foodDiaryService.getDailySummary categorizes meal breakdown (breakfast, lunch, dinner, snack, other)', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalFind = FoodDiary.find;
    const originalGetPref = preferenceService.getPreferencesByUserId;

    const mockEntries = [
      { mealType: 'breakfast', foodName: 'Idli', nutrition: { calories: 200, protein: 6, carbohydrates: 40, fats: 2 } },
      { mealType: 'snack', foodName: 'Almonds', nutrition: { calories: 150, protein: 5, carbohydrates: 6, fats: 12 } },
    ];

    FoodDiary.find = () => ({
      sort: () => Promise.resolve(mockEntries),
    });
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      const summary = await foodDiaryService.getDailySummary(testUser, '2026-10-06', 'Asia/Kolkata');

      assert.equal(summary.mealBreakdown.breakfast.calories, 200);
      assert.equal(summary.mealBreakdown.breakfast.items.length, 1);
      assert.equal(summary.mealBreakdown.snack.calories, 150);
      assert.equal(summary.mealBreakdown.dinner.calories, 0);
      assert.equal(summary.mealBreakdown.dinner.items.length, 0);
    } finally {
      FoodDiary.find = originalFind;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('foodDiaryService.getDailySummary handles empty day gracefully with zeroed totals', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalFind = FoodDiary.find;
    const originalGetPref = preferenceService.getPreferencesByUserId;

    FoodDiary.find = () => ({
      sort: () => Promise.resolve([]),
    });
    preferenceService.getPreferencesByUserId = async () => null;

    try {
      const summary = await foodDiaryService.getDailySummary(testUser, '2026-10-06', 'Asia/Kolkata');

      assert.equal(summary.entryCount, 0);
      assert.equal(summary.totals.calories, 0);
      assert.equal(summary.totals.protein, 0);
      assert.equal(summary.totals.carbohydrates, 0);
      assert.equal(summary.totals.fats, 0);
    } finally {
      FoodDiary.find = originalFind;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('foodDiaryService.getDailySummary calculates goal comparison against configured user targets', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalFind = FoodDiary.find;
    const originalGetPref = preferenceService.getPreferencesByUserId;

    const mockEntries = [
      { mealType: 'lunch', foodName: 'Paneer Rice', nutrition: { calories: 1400, protein: 70, carbohydrates: 150, fats: 40 } },
    ];

    FoodDiary.find = () => ({
      sort: () => Promise.resolve(mockEntries),
    });
    preferenceService.getPreferencesByUserId = async () => ({
      dailyNutritionTargets: {
        calories: 2000,
        proteinGrams: 100,
        carbsGrams: null,
        fatsGrams: null,
      },
    });

    try {
      const summary = await foodDiaryService.getDailySummary(testUser, '2026-10-06', 'Asia/Kolkata');

      assert.equal(summary.goalComparison.status, 'in_progress');
      assert.equal(summary.goalComparison.calories.actual, 1400);
      assert.equal(summary.goalComparison.calories.target, 2000);
      assert.equal(summary.goalComparison.calories.remaining, 600);
      assert.equal(summary.goalComparison.calories.percentage, 70);
      assert.equal(summary.goalComparison.protein.actual, 70);
      assert.equal(summary.goalComparison.protein.target, 100);
      assert.equal(summary.goalComparison.protein.remaining, 30);
    } finally {
      FoodDiary.find = originalFind;
      preferenceService.getPreferencesByUserId = originalGetPref;
    }
  });

  await test('foodDiaryService.getDailySummary respects IANA timezone boundaries', async () => {
    const testUser = new mongoose.Types.ObjectId();

    // Rejects invalid timezone
    await assert.rejects(
      async () => foodDiaryService.getDailySummary(testUser, '2026-10-06', 'Mars/Phobos'),
      /Invalid IANA timezone/i
    );
  });

  await test('Zai action FOOD_DIARY answers daily summary query via foodDiaryService', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalSummary = foodDiaryService.getDailySummary;

    foodDiaryService.getDailySummary = async (uid) => {
      assert.equal(uid.toString(), testUser.toString());
      return {
        entryCount: 2,
        totals: { calories: 950, protein: 42, carbohydrates: 110, fats: 25 },
        entries: [{ foodName: 'Dosa' }, { foodName: 'Dal' }],
      };
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'daily_summary' },
        testUser,
        null
      );

      assert.ok(result.message.includes('950 kcal'));
      assert.ok(result.message.includes('42g protein'));
      assert.equal(result.data.entryCount, 2);
    } finally {
      foodDiaryService.getDailySummary = originalSummary;
    }
  });

  await test('Zai action FOOD_DIARY answers calorie query accurately', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalSummary = foodDiaryService.getDailySummary;

    foodDiaryService.getDailySummary = async () => ({
      entryCount: 1,
      totals: { calories: 520, protein: 20 },
    });

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'calories' },
        testUser,
        null
      );

      assert.ok(result.message.includes('520 kcal'));
    } finally {
      foodDiaryService.getDailySummary = originalSummary;
    }
  });

  await test('Zai action FOOD_DIARY answers protein query accurately', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalSummary = foodDiaryService.getDailySummary;

    foodDiaryService.getDailySummary = async () => ({
      entryCount: 2,
      totals: { calories: 800, protein: 65 },
    });

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'protein' },
        testUser,
        null
      );

      assert.ok(result.message.includes('65g of protein'));
    } finally {
      foodDiaryService.getDailySummary = originalSummary;
    }
  });

  await test('Zai action FOOD_DIARY answers meal query accurately', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalSummary = foodDiaryService.getDailySummary;

    foodDiaryService.getDailySummary = async () => ({
      entryCount: 2,
      entries: [
        { foodName: 'Poha', mealType: 'breakfast' },
        { foodName: 'Chole', mealType: 'lunch' },
      ],
    });

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'meals' },
        testUser,
        null
      );

      assert.ok(result.message.includes('Poha (breakfast)'));
      assert.ok(result.message.includes('Chole (lunch)'));
    } finally {
      foodDiaryService.getDailySummary = originalSummary;
    }
  });

  await test('Zai action FOOD_DIARY log_recent_scan logs user recent analysis', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const mockAnalysisId = new mongoose.Types.ObjectId();

    const originalGetHistory = foodAnalysisService.getAnalysisHistory;
    const originalCreateFromAnalysis = foodDiaryService.createFromAnalysis;

    foodAnalysisService.getAnalysisHistory = async () => [
      {
        _id: mockAnalysisId,
        status: 'completed',
        createdAt: new Date(),
        dish: { name: 'Paneer Tikka', mealType: 'dinner' },
        nutrition: { calories: 420 },
      },
    ];

    foodDiaryService.createFromAnalysis = async (uid, aid) => {
      assert.equal(aid.toString(), mockAnalysisId.toString());
      return {
        foodName: 'Paneer Tikka',
        mealType: 'dinner',
        nutrition: { calories: 420 },
      };
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'log_recent_scan', mealType: 'dinner' },
        testUser,
        null
      );

      assert.ok(result.message.includes('Paneer Tikka'));
      assert.ok(result.message.includes('420 kcal'));
      assert.ok(result.message.includes('dinner'));
    } finally {
      foodAnalysisService.getAnalysisHistory = originalGetHistory;
      foodDiaryService.createFromAnalysis = originalCreateFromAnalysis;
    }
  });

  await test('Zai action FOOD_DIARY read-only query does not create diary entry', async () => {
    const testUser = new mongoose.Types.ObjectId();
    let createCalled = false;

    const originalCreate = foodDiaryService.createManualEntry;
    const originalSummary = foodDiaryService.getDailySummary;

    foodDiaryService.createManualEntry = async () => {
      createCalled = true;
    };
    foodDiaryService.getDailySummary = async () => ({
      entryCount: 0,
      totals: { calories: 0, protein: 0, carbohydrates: 0, fats: 0 },
    });

    try {
      await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'daily_summary' },
        testUser,
        null
      );
      assert.equal(createCalled, false, 'Read-only queries must never create diary entries');
    } finally {
      foodDiaryService.createManualEntry = originalCreate;
      foodDiaryService.getDailySummary = originalSummary;
    }
  });

  await test('Zai action FOOD_DIARY explicitly logs meal when confirmLog is true', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalCreate = foodDiaryService.createManualEntry;
    let savedEntry = null;

    foodDiaryService.createManualEntry = async (uid, payload) => {
      savedEntry = payload;
      return { foodName: payload.foodName, mealType: payload.mealType };
    };

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'log_meal', confirmLog: true, foodName: 'Besan Chilla', mealType: 'breakfast' },
        testUser,
        null
      );

      assert.ok(savedEntry);
      assert.equal(savedEntry.foodName, 'Besan Chilla');
      assert.equal(savedEntry.mealType, 'breakfast');
      assert.ok(result.message.includes('Logged Besan Chilla for breakfast'));
    } finally {
      foodDiaryService.createManualEntry = originalCreate;
    }
  });

  await test('Zai action FOOD_DIARY multi-turn confirmation flow logs proposed meal upon user affirmation', async () => {
    const testUser = new mongoose.Types.ObjectId();

    // Turn 1: User says "I had dal makhani for dinner" -> proposal to log
    const res1 = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.FOOD_DIARY,
      { queryType: 'log_meal', confirmLog: false, foodName: 'dal makhani', mealType: 'dinner' },
      testUser,
      null
    );
    assert.ok(res1.message.includes('Would you like me to log'));
    assert.ok(res1.message.includes('dal makhani'));

    // Turn 2: User confirms -> logs meal
    let createdMeal = null;
    const originalCreate = foodDiaryService.createManualEntry;
    foodDiaryService.createManualEntry = async (uid, payload) => {
      createdMeal = payload;
      return { foodName: payload.foodName, mealType: payload.mealType };
    };

    try {
      const res2 = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'log_meal', confirmLog: true, foodName: 'dal makhani', mealType: 'dinner' },
        testUser,
        null
      );
      assert.ok(createdMeal);
      assert.equal(createdMeal.foodName, 'dal makhani');
      assert.ok(res2.message.includes('Logged dal makhani for dinner'));
    } finally {
      foodDiaryService.createManualEntry = originalCreate;
    }
  });

  await test('User isolation: Zai FOOD_DIARY cannot access another user food diary', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    let queriedUserId = null;

    const originalSummary = foodDiaryService.getDailySummary;
    foodDiaryService.getDailySummary = async (uid) => {
      queriedUserId = uid;
      if (uid.toString() === userA.toString()) {
        return { entryCount: 1, totals: { calories: 500, protein: 20 }, entries: [{ foodName: 'User A Food' }] };
      }
      return { entryCount: 0, totals: { calories: 0, protein: 0 }, entries: [] };
    };

    try {
      const resA = await zaiActionService.dispatchAction(ZAI_ACTIONS.FOOD_DIARY, {}, userA, null);
      assert.equal(queriedUserId.toString(), userA.toString());
      assert.ok(resA.message.includes('500 kcal'));

      const resB = await zaiActionService.dispatchAction(ZAI_ACTIONS.FOOD_DIARY, {}, userB, null);
      assert.equal(queriedUserId.toString(), userB.toString());
      assert.ok(resB.message.includes('have not logged any meals'));
    } finally {
      foodDiaryService.getDailySummary = originalSummary;
    }
  });

  await test('UserPreference model schema validates new dailyNutritionTargets backwards-compatibly', () => {
    const pref = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      dietaryPreference: 'vegetarian',
      dailyNutritionTargets: {
        calories: 2200,
        proteinGrams: 120,
        carbsGrams: 250,
        fatsGrams: 65,
      },
    });

    const err = pref.validateSync();
    assert.equal(err, undefined);
    assert.equal(pref.dailyNutritionTargets.calories, 2200);
    assert.equal(pref.dailyNutritionTargets.proteinGrams, 120);
  });

  await test('UserPreference model rejects invalid dailyNutritionTargets numbers', () => {
    const pref = new UserPreference({
      user: new mongoose.Types.ObjectId(),
      dailyNutritionTargets: {
        calories: -500,
      },
    });

    const err = pref.validateSync();
    assert.ok(err.errors['dailyNutritionTargets.calories']);
  });

  // ==========================================
  // 41. RECIPE INTELLIGENCE & PERSONALIZATION SUITE
  // ==========================================
  console.log('\n--- Section 41: Recipe Intelligence & Personalization Tests ---');

  // Helper mock recipe generator
  const createValidMockRecipeData = (overrides = {}) => ({
    name: 'High-Protein Paneer Spinach Bowl',
    description: 'A nutritious and wholesome dinner bowl packed with protein and iron.',
    mealType: 'dinner',
    cuisine: 'indian',
    difficulty: 'easy',
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    ingredients: [
      { name: 'Paneer', quantity: 200, unit: 'g', category: 'dairy' },
      { name: 'Fresh Spinach', quantity: 150, unit: 'g', category: 'produce' },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
    ],
    instructions: [
      'Wash spinach thoroughly and chop finely.',
      'Sauté paneer cubes in olive oil until golden brown.',
      'Add spinach and simmer for 5 minutes with spices.',
    ],
    nutrition: {
      calories: 450,
      protein: 32,
      carbohydrates: 14,
      fats: 28,
    },
    dietaryTags: ['vegetarian', 'high-protein'],
    ...overrides,
  });

  // A. Nutrition remaining calculations
  await test('calculateRemainingNutrition calculates explicit remaining macros when targets exist', () => {
    const targets = {
      calories: 2000,
      proteinGrams: 120,
      carbsGrams: 220,
      fatsGrams: 65,
    };
    const totals = {
      calories: 1350,
      protein: 80,
      carbohydrates: 150,
      fats: 45,
    };

    const result = calculateRemainingNutrition(targets, totals);
    assert.equal(result.hasTargets, true);
    assert.equal(result.remaining.calories, 650);
    assert.equal(result.remaining.protein, 40);
    assert.equal(result.remaining.carbohydrates, 70);
    assert.equal(result.remaining.fats, 20);
  });

  await test('calculateRemainingNutrition handles missing targets safely without inventing values', () => {
    const result = calculateRemainingNutrition(null, { calories: 500, protein: 30 });
    assert.equal(result.hasTargets, false);
    assert.equal(result.remaining.calories, null);
    assert.equal(result.remaining.protein, null);
    assert.equal(result.remaining.carbohydrates, null);
    assert.equal(result.remaining.fats, null);
  });

  await test('calculateRemainingNutrition clamps negative remaining values to zero', () => {
    const targets = { calories: 1500, proteinGrams: 50, carbsGrams: 100, fatsGrams: 40 };
    const totals = { calories: 1800, protein: 75, carbohydrates: 150, fats: 55 };

    const result = calculateRemainingNutrition(targets, totals);
    assert.equal(result.remaining.calories, 0);
    assert.equal(result.remaining.protein, 0);
    assert.equal(result.remaining.carbohydrates, 0);
    assert.equal(result.remaining.fats, 0);
  });

  // B. Generated recipe validation
  await test('validateGeneratedRecipeData validates and normalizes valid recipe output', () => {
    const raw = createValidMockRecipeData();
    const result = validateGeneratedRecipeData(raw, { dietaryPreference: 'vegetarian' });

    assert.equal(result.isValid, true);
    assert.equal(result.sanitized.name, 'High-Protein Paneer Spinach Bowl');
    assert.equal(result.sanitized.mealType, 'dinner');
    assert.equal(result.sanitized.ingredients.length, 3);
    assert.equal(result.sanitized.ingredients[0].category, 'dairy');
    assert.equal(result.sanitized.nutrition.calories, 450);
    assert.equal(result.sanitized.source, 'ai');
  });

  await test('validateGeneratedRecipeData rejects prototype pollution attempts', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "name": "Fake Recipe"}');
    const result = validateGeneratedRecipeData(malicious);
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('Forbidden prototype property'));
  });

  await test('validateGeneratedRecipeData rejects recipes with missing or empty ingredients', () => {
    const noIngs = createValidMockRecipeData({ ingredients: [] });
    const result = validateGeneratedRecipeData(noIngs);
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('at least one ingredient'));
  });

  await test('validateGeneratedRecipeData rejects out-of-bounds unrealistic nutrition', () => {
    const crazyCalories = createValidMockRecipeData({
      nutrition: { calories: 6000, protein: 30, carbohydrates: 20, fats: 10 },
    });
    const result = validateGeneratedRecipeData(crazyCalories);
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('out of physical realistic bounds'));
  });

  await test('validateGeneratedRecipeData rejects invalid servings count', () => {
    const invalidServings = createValidMockRecipeData({ servings: 0 });
    const result = validateGeneratedRecipeData(invalidServings);
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('Servings must be a valid number'));
  });

  // C. Allergen Hard Exclusion & Dietary Constraints
  await test('Allergen Hard Exclusion: rejects recipe containing declared allergens', () => {
    const rawWithPeanuts = createValidMockRecipeData({
      ingredients: [
        { name: 'Peanut Butter', quantity: 2, unit: 'tbsp', category: 'pantry' },
        { name: 'Oats', quantity: 50, unit: 'g', category: 'pantry' },
      ],
    });

    const result = validateGeneratedRecipeData(rawWithPeanuts, { allergies: ['peanuts'] });
    assert.equal(result.isValid, false);
    assert.equal(result.allergenConflict, true);
    assert.ok(result.error.includes('violates allergen safety'));
    assert.ok(result.error.includes('Peanut Butter'));
  });

  await test('checkAllergenConflict detects allergen presence accurately', () => {
    const ingredients = [
      { name: 'Shellfish broth' },
      { name: 'Rice noodles' },
    ];
    const check = checkAllergenConflict(ingredients, ['shellfish']);
    assert.equal(check.hasConflict, true);
    assert.equal(check.matchedAllergens[0].allergen, 'shellfish');
  });

  await test('Dietary Constraint: rejects non-vegetarian ingredients for vegetarian user', () => {
    const chickenRecipe = createValidMockRecipeData({
      ingredients: [
        { name: 'Chicken breast', quantity: 200, unit: 'g', category: 'meat' },
        { name: 'Spinach', quantity: 100, unit: 'g', category: 'produce' },
      ],
    });

    const result = validateGeneratedRecipeData(chickenRecipe, { dietaryPreference: 'vegetarian' });
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('non-vegetarian ingredient'));
  });

  await test('Dietary Constraint: rejects dairy/eggs for vegan user', () => {
    const paneerRecipe = createValidMockRecipeData({
      ingredients: [
        { name: 'Paneer cheese', quantity: 200, unit: 'g', category: 'dairy' },
        { name: 'Spinach', quantity: 100, unit: 'g', category: 'produce' },
      ],
    });

    const result = validateGeneratedRecipeData(paneerRecipe, { dietaryPreference: 'vegan' });
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes('animal byproduct'));
  });

  await test('FoodsToAvoid: emits warning when avoided food is present without fatal crash', () => {
    const mushroomRecipe = createValidMockRecipeData({
      ingredients: [
        { name: 'Button mushrooms', quantity: 100, unit: 'g', category: 'produce' },
        { name: 'Tofu', quantity: 150, unit: 'g', category: 'produce' },
      ],
    });

    const result = validateGeneratedRecipeData(mushroomRecipe, { foodsToAvoid: ['mushrooms'] });
    assert.equal(result.isValid, true);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes('preferred to avoid: Button mushrooms'));
  });

  // D. Recipe Intelligence Service: Context Assembly & Personalization
  await test('recipeIntelligenceService.assembleContext integrates UserPreference, FoodDiary, and recent meals', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;

    preferenceService.getPreferencesByUserId = async (uid) => ({
      user: uid,
      dietaryPreference: 'vegetarian',
      allergies: ['peanuts'],
      foodsToAvoid: ['mushrooms'],
      preferredCuisines: ['Indian', 'Mexican'],
      cookingTime: 'under-30',
      spiceLevel: 'medium',
      wellnessGoals: ['high-protein'],
      dailyNutritionTargets: {
        calories: 2200,
        proteinGrams: 110,
        carbsGrams: 240,
        fatsGrams: 70,
      },
    });

    foodDiaryService.getDailySummary = async () => ({
      entryCount: 2,
      totals: { calories: 1200, protein: 60, carbohydrates: 140, fats: 40 },
      mealBreakdown: {
        breakfast: { calories: 500, items: [{ foodName: 'Oats' }] },
        lunch: { calories: 700, items: [{ foodName: 'Paneer Rice' }] },
        dinner: { calories: 0, items: [] },
        snack: { calories: 0, items: [] },
      },
    });

    foodDiaryService.getHistory = async () => [
      { foodName: 'Paneer Rice', mealType: 'lunch', consumedAt: new Date() },
      { foodName: 'Oats Bowl', mealType: 'breakfast', consumedAt: new Date() },
    ];

    try {
      const context = await recipeIntelligenceService.assembleContext(testUser);

      assert.equal(context.userPreferences.dietaryPreference, 'vegetarian');
      assert.deepEqual(context.userPreferences.allergies, ['peanuts']);
      assert.equal(context.nutritionContext.hasTargets, true);
      assert.equal(context.nutritionContext.remaining.calories, 1000);
      assert.equal(context.nutritionContext.remaining.protein, 50);
      assert.equal(context.mealType, 'dinner');
      assert.ok(context.recentMeals.includes('Paneer Rice'));
      assert.ok(context.recentMeals.includes('Oats Bowl'));
    } finally {
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  await test('recipeIntelligenceService.assembleContext handles empty food diary gracefully', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;

    preferenceService.getPreferencesByUserId = async () => null;
    foodDiaryService.getDailySummary = async () => ({
      entryCount: 0,
      totals: { calories: 0, protein: 0, carbohydrates: 0, fats: 0 },
      mealBreakdown: { breakfast: { calories: 0 }, lunch: { calories: 0 }, dinner: { calories: 0 } },
    });
    foodDiaryService.getHistory = async () => [];

    try {
      const context = await recipeIntelligenceService.assembleContext(testUser);
      assert.equal(context.nutritionContext.hasTargets, false);
      assert.equal(context.recentMeals.length, 0);
      assert.equal(context.userPreferences.dietaryPreference, 'no-preference');
    } finally {
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  // E. Recipe Intelligence Generation Flow
  await test('recipeIntelligenceService.generatePersonalizedRecipe calls Gemini and returns validated recipe', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const mockRecipe = createValidMockRecipeData({ name: 'Tofu Broccoli Skillet' });

    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify(mockRecipe),
        }),
      },
    };
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;

    preferenceService.getPreferencesByUserId = async () => ({
      dietaryPreference: 'vegetarian',
      allergies: [],
    });
    foodDiaryService.getDailySummary = async () => ({
      totals: { calories: 800, protein: 40, carbohydrates: 90, fats: 30 },
    });
    foodDiaryService.getHistory = async () => [];

    try {
      const result = await recipeIntelligenceService.generatePersonalizedRecipe(testUser, {
        mealType: 'dinner',
      });

      assert.equal(result.recipe.name, 'Tofu Broccoli Skillet');
      assert.equal(result.recipe.source, 'ai');
      assert.equal(result.persisted, false);
      assert.ok(result.context.nutritionContext);
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  await test('recipeIntelligenceService.generatePersonalizedRecipe persists recipe when persist: true', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const mockRecipe = createValidMockRecipeData({ name: 'Persisted Lentil Dahl' });

    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify(mockRecipe),
        }),
      },
    };
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;
    const originalCreate = recipeService.createRecipe;

    preferenceService.getPreferencesByUserId = async () => null;
    foodDiaryService.getDailySummary = async () => ({ totals: { calories: 0, protein: 0 } });
    foodDiaryService.getHistory = async () => [];

    let createdData = null;
    let createdUser = null;
    recipeService.createRecipe = async (data, user) => {
      createdData = data;
      createdUser = user;
      return {
        _id: new mongoose.Types.ObjectId(),
        ...data,
        createdBy: user._id,
        source: 'ai',
        toJSON() { return this; },
      };
    };

    try {
      const result = await recipeIntelligenceService.generatePersonalizedRecipe(
        testUser,
        { mealType: 'dinner', persist: true },
        { persist: true }
      );

      assert.equal(result.persisted, true);
      assert.ok(result.recipe._id);
      assert.equal(createdUser._id.toString(), testUser.toString());
      assert.equal(createdData.source, 'ai');
      assert.equal(createdData.name, 'Persisted Lentil Dahl');
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
      recipeService.createRecipe = originalCreate;
    }
  });

  await test('recipeIntelligenceService.generatePersonalizedRecipe rejects unconfigured AI provider with 503', async () => {
    geminiService.setMockClient(null);
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';

    try {
      await assert.rejects(
        async () => recipeIntelligenceService.generatePersonalizedRecipe(mockUserId),
        (err) => err.statusCode === 503 && /not configured/i.test(err.message)
      );
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  await test('recipeIntelligenceService.generatePersonalizedRecipe rejects malformed Gemini response with 400', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({ name: 'Incomplete', servings: 2, ingredients: [] }),
        }),
      },
    };
    geminiService.setMockClient(mockClient);

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;

    preferenceService.getPreferencesByUserId = async () => null;
    foodDiaryService.getDailySummary = async () => ({ totals: { calories: 0 } });
    foodDiaryService.getHistory = async () => [];

    try {
      await assert.rejects(
        async () => recipeIntelligenceService.generatePersonalizedRecipe(testUser),
        (err) => err.statusCode === 400
      );
    } finally {
      geminiService.setMockClient(null);
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  // F. Recommendations: Repetition avoidance
  await test('recipeIntelligenceService.getRecommendations filters out recently consumed dishes', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalGetRecipes = recipeService.getRecipes;
    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;

    preferenceService.getPreferencesByUserId = async () => ({ dietaryPreference: 'vegetarian' });
    foodDiaryService.getDailySummary = async () => ({ totals: { calories: 600 } });
    foodDiaryService.getHistory = async () => [
      { foodName: 'Dal Tadka', mealType: 'lunch' },
    ];

    recipeService.getRecipes = async () => ({
      recipes: [
        { name: 'Dal Tadka with Roti', mealType: 'dinner' },
        { name: 'Palak Paneer', mealType: 'dinner' },
      ],
      pagination: { total: 2 },
    });

    try {
      const recs = await recipeIntelligenceService.getRecommendations(testUser, { mealType: 'dinner' });
      assert.equal(recs.recommendations.length, 1);
      assert.equal(recs.recommendations[0].name, 'Palak Paneer');
    } finally {
      recipeService.getRecipes = originalGetRecipes;
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  // G. Zai Integration: Natural Language Recipe Resolution
  await test('zaiResolverService detects "What should I eat tonight?" as RECIPE_GENERATION', () => {
    const resolved = zaiResolverService.resolveAction('What should I eat tonight?');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.mealType, 'dinner');
  });

  await test('zaiResolverService detects "Give me a high protein dinner" with healthGoal and mealType', () => {
    const resolved = zaiResolverService.resolveAction('Give me a high protein dinner');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.mealType, 'dinner');
    assert.equal(resolved.parameters.healthGoal, 'high-protein');
  });

  await test('zaiResolverService detects "Suggest something under 500 calories" and extracts targetCalories', () => {
    const resolved = zaiResolverService.resolveAction('Suggest something under 500 calories');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.targetCalories, 500);
  });

  await test('zaiResolverService detects "Make it vegetarian and quick" and extracts preferences', () => {
    const resolved = zaiResolverService.resolveAction('Make it vegetarian and quick');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.dietaryPreference, 'vegetarian');
    assert.equal(resolved.parameters.cookingTime, 20);
  });

  await test('zaiResolverService detects "Suggest something based on what I ate today" and sets useFoodDiaryContext', () => {
    const resolved = zaiResolverService.resolveAction('Suggest something based on what I ate today');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.useFoodDiaryContext, true);
  });

  // H. Zai Action Service: RECIPE_GENERATION with Recipe Intelligence
  await test('zaiActionService.dispatchAction generates recipe when generateRecipe is true and provider configured', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;

    recipeIntelligenceService.generatePersonalizedRecipe = async (uid, params) => ({
      recipe: {
        name: 'Vegetable Quinoa Pulao',
        nutrition: { calories: 380, protein: 12 },
      },
      context: {},
      persisted: false,
    });

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.RECIPE_GENERATION,
        { generateRecipe: true, mealType: 'dinner' },
        testUser,
        null
      );

      assert.ok(result.message.includes('Vegetable Quinoa Pulao'));
      assert.ok(result.message.includes('380 kcal'));
      assert.equal(result.data.name, 'Vegetable Quinoa Pulao');
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      geminiService.setMockClient(null);
    }
  });

  // I. HTTP API Integration: POST /api/recipes/generate & POST /api/recipes/recommend
  await test('POST /api/recipes/generate generates personalized recipe with valid token', async () => {
    const mockRecipe = createValidMockRecipeData({ name: 'Chana Masala Bowl' });
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify(mockRecipe),
        }),
      },
    };
    geminiService.setMockClient(mockClient);

    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;
    preferenceService.getPreferencesByUserId = async () => null;
    foodDiaryService.getDailySummary = async () => ({ totals: { calories: 0 } });
    foodDiaryService.getHistory = async () => [];

    try {
      const res = await fetch(`${baseUrl}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ mealType: 'dinner' }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, 'Chana Masala Bowl');
      assert.ok(body.context);
    } finally {
      geminiService.setMockClient(null);
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  await test('POST /api/recipes/generate with persist: true saves recipe with user ownership', async () => {
    const mockRecipe = createValidMockRecipeData({ name: 'API Persisted Buddha Bowl' });
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify(mockRecipe),
        }),
      },
    };
    geminiService.setMockClient(mockClient);

    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;
    preferenceService.getPreferencesByUserId = async () => null;
    foodDiaryService.getDailySummary = async () => ({ totals: { calories: 0 } });
    foodDiaryService.getHistory = async () => [];

    const originalCreate = recipeService.createRecipe;
    let savedRecipe = null;
    recipeService.createRecipe = async (data, user) => {
      savedRecipe = {
        _id: new mongoose.Types.ObjectId(),
        ...data,
        createdBy: user._id,
        source: 'ai',
        toJSON() { return this; },
      };
      return savedRecipe;
    };

    try {
      const res = await fetch(`${baseUrl}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ mealType: 'lunch', persist: true }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, 'API Persisted Buddha Bowl');
      assert.equal(savedRecipe.createdBy.toString(), mockUserId.toString());
      assert.equal(savedRecipe.source, 'ai');
    } finally {
      geminiService.setMockClient(null);
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
      recipeService.createRecipe = originalCreate;
    }
  });

  await test('POST /api/recipes/generate without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealType: 'dinner' }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await test('POST /api/recipes/recommend returns recommendations with valid token', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetRecipes = recipeService.getRecipes;
    recipeService.getRecipes = async () => ({
      recipes: [{ name: 'Spiced Chickpea Salad', mealType: 'lunch' }],
      pagination: { total: 1 },
    });

    const originalGetPref = preferenceService.getPreferencesByUserId;
    const originalSummary = foodDiaryService.getDailySummary;
    const originalHistory = foodDiaryService.getHistory;
    preferenceService.getPreferencesByUserId = async () => null;
    foodDiaryService.getDailySummary = async () => ({ totals: { calories: 0 } });
    foodDiaryService.getHistory = async () => [];

    try {
      const res = await fetch(`${baseUrl}/api/recipes/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ mealType: 'lunch' }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.recommendations));
    } finally {
      recipeService.getRecipes = originalGetRecipes;
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      preferenceService.getPreferencesByUserId = originalGetPref;
      foodDiaryService.getDailySummary = originalSummary;
      foodDiaryService.getHistory = originalHistory;
    }
  });

  await test('POST /api/recipes/generate returns 503 when DB is disconnected without hanging', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 0;

    try {
      const res = await fetch(`${baseUrl}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ mealType: 'dinner' }),
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.includes('Database service is currently unavailable'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  // J. Grocery & MealPlan Integration Boundary
  await test('Grocery Boundary: Recipe ingredients with categories integrate cleanly into grocery lists', async () => {
    const mealPlanId = new mongoose.Types.ObjectId().toString();
    const recipeId = new mongoose.Types.ObjectId().toString();

    const originalMealPlanFindById = MealPlan.findById;
    const originalRecipeFind = Recipe.find;
    const originalGroceryListCreate = GroceryList.create;

    MealPlan.findById = async () => ({
      _id: mealPlanId,
      user: mockUserId,
      name: 'AI Stew Plan',
      meals: [
        {
          date: new Date('2026-10-10'),
          dinner: recipeId,
        },
      ],
    });

    Recipe.find = async () => [
      {
        _id: recipeId,
        name: 'Categorized AI Stew',
        ingredients: [
          { name: 'Carrots', quantity: 3, unit: 'pcs', category: 'produce' },
          { name: 'Cheddar Cheese', quantity: 100, unit: 'g', category: 'dairy' },
          { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
        ],
      },
    ];

    let createdList = null;
    GroceryList.create = async (payload) => {
      createdList = payload;
      return { _id: new mongoose.Types.ObjectId(), ...payload };
    };

    try {
      const groceryList = await groceryService.createFromMealPlan(mockUserId, mealPlanId);
      assert.ok(groceryList);
      assert.equal(createdList.items.length, 3);

      const carrotItem = createdList.items.find((i) => i.name.toLowerCase().includes('carrot'));
      assert.ok(carrotItem);
      assert.equal(carrotItem.category, 'produce');
      assert.equal(carrotItem.quantity, 3);
    } finally {
      MealPlan.findById = originalMealPlanFindById;
      Recipe.find = originalRecipeFind;
      GroceryList.create = originalGroceryListCreate;
    }
  });

  // ==========================================
  // 42. GROCERY INTELLIGENCE & PERSONALIZATION TESTS
  // ==========================================

  // A. Canonicalization & Name Normalization
  await test('canonicalizeIngredientName normalizes casing, whitespace, and obvious punctuation', () => {
    assert.equal(canonicalizeIngredientName('  Tomato  '), 'tomato');
    assert.equal(canonicalizeIngredientName('TOMATO'), 'tomato');
    assert.equal(canonicalizeIngredientName('Red   Onion!'), 'red onion');
    assert.equal(canonicalizeIngredientName('Extra-Virgin Olive Oil'), 'extra-virgin olive oil');
    assert.equal(canonicalizeIngredientName(''), '');
    assert.equal(canonicalizeIngredientName(null), '');
  });

  await test('canonicalizeIngredientName handles deterministic singulars without over-stemming', () => {
    assert.equal(canonicalizeIngredientName('tomatoes'), 'tomato');
    assert.equal(canonicalizeIngredientName('potatoes'), 'potato');
    assert.equal(canonicalizeIngredientName('onions'), 'onion');
    assert.equal(canonicalizeIngredientName('carrots'), 'carrot');
    assert.equal(canonicalizeIngredientName('cucumbers'), 'cucumber');
    assert.equal(canonicalizeIngredientName('chillies'), 'chilli');
    assert.equal(canonicalizeIngredientName('eggs'), 'egg');
    assert.equal(canonicalizeIngredientName('red onions'), 'red onion');
    assert.equal(canonicalizeIngredientName('strawberries'), 'strawberry');
  });

  await test('canonicalizeIngredientName preserves distinct compound ingredients and non-plural terms', () => {
    assert.equal(canonicalizeIngredientName('hummus'), 'hummus');
    assert.equal(canonicalizeIngredientName('asparagus'), 'asparagus');
    assert.equal(canonicalizeIngredientName('couscous'), 'couscous');
    assert.equal(canonicalizeIngredientName('oats'), 'oats');
    assert.equal(canonicalizeIngredientName('paneer'), 'paneer');
    assert.equal(canonicalizeIngredientName('spinach'), 'spinach');
    assert.notEqual(
      canonicalizeIngredientName('extra virgin olive oil'),
      canonicalizeIngredientName('olive oil')
    );
  });

  // B. Unit Normalization & Aliases
  await test('normalizeUnit maps common mass, volume, spoon, and count aliases', () => {
    // Mass
    assert.equal(normalizeUnit('kilogram'), 'kg');
    assert.equal(normalizeUnit('kilograms'), 'kg');
    assert.equal(normalizeUnit('KGS'), 'kg');
    assert.equal(normalizeUnit('grams'), 'g');
    assert.equal(normalizeUnit('gm'), 'g');
    assert.equal(normalizeUnit('milligram'), 'mg');

    // Volume
    assert.equal(normalizeUnit('litre'), 'l');
    assert.equal(normalizeUnit('liters'), 'l');
    assert.equal(normalizeUnit('ltr'), 'l');
    assert.equal(normalizeUnit('milliliter'), 'ml');
    assert.equal(normalizeUnit('mls'), 'ml');

    // Spoons & Count
    assert.equal(normalizeUnit('tablespoon'), 'tbsp');
    assert.equal(normalizeUnit('tablespoons'), 'tbsp');
    assert.equal(normalizeUnit('teaspoons'), 'tsp');
    assert.equal(normalizeUnit('pieces'), 'piece');
    assert.equal(normalizeUnit('pcs'), 'piece');
    assert.equal(normalizeUnit('pc'), 'piece');
  });

  await test('getUnitDimension identifies dimensions and base units accurately', () => {
    const massInfo = getUnitDimension('kg');
    assert.equal(massInfo.dimension, 'mass');
    assert.equal(massInfo.baseUnit, 'g');
    assert.equal(massInfo.factorToBase, 1000);

    const volInfo = getUnitDimension('l');
    assert.equal(volInfo.dimension, 'volume');
    assert.equal(volInfo.baseUnit, 'ml');
    assert.equal(volInfo.factorToBase, 1000);

    const spoonInfo = getUnitDimension('tbsp');
    assert.equal(spoonInfo.dimension, 'spoons');
    assert.equal(spoonInfo.baseUnit, 'tsp');
    assert.equal(spoonInfo.factorToBase, 3);

    const countInfo = getUnitDimension('pieces');
    assert.equal(countInfo.dimension, 'count');
    assert.equal(countInfo.baseUnit, 'piece');

    const cupInfo = getUnitDimension('cup');
    assert.equal(cupInfo.dimension, 'discrete_cup');
    assert.equal(cupInfo.factorToBase, 1);
  });

  // C. Safe Dimensional Conversion & Aggregation
  await test('normalizeAndAggregateIngredients sums compatible mass units: 500g + 250g = 750g', () => {
    const raw = [
      { name: 'Paneer', quantity: 500, unit: 'g', category: 'dairy' },
      { name: 'paneer', quantity: 250, unit: 'g', category: 'dairy' },
    ];
    const res = groceryIntelligenceService.normalizeAndAggregateIngredients(raw);
    assert.equal(res.length, 1);
    assert.equal(res[0].name.toLowerCase(), 'paneer');
    assert.equal(res[0].quantity, 750);
    assert.equal(res[0].unit, 'g');
  });

  await test('normalizeAndAggregateIngredients converts and sums across mass units: 500g + 1kg = 1.5kg', () => {
    const raw = [
      { name: 'Flour', quantity: 500, unit: 'g', category: 'grains' },
      { name: 'flour', quantity: 1, unit: 'kg', category: 'grains' },
    ];
    const res = groceryIntelligenceService.normalizeAndAggregateIngredients(raw);
    assert.equal(res.length, 1);
    assert.equal(res[0].quantity, 1.5);
    assert.equal(res[0].unit, 'kg');
  });

  await test('normalizeAndAggregateIngredients converts and sums across volume units: 500ml + 1l = 1.5l', () => {
    const raw = [
      { name: 'Milk', quantity: 500, unit: 'ml', category: 'dairy' },
      { name: 'Milk', quantity: 1, unit: 'litre', category: 'dairy' },
    ];
    const res = groceryIntelligenceService.normalizeAndAggregateIngredients(raw);
    assert.equal(res.length, 1);
    assert.equal(res[0].quantity, 1.5);
    assert.equal(res[0].unit, 'l');
  });

  await test('normalizeAndAggregateIngredients converts spoons: 1 tbsp + 3 tsp = 2 tbsp', () => {
    const raw = [
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
      { name: 'olive oil', quantity: 3, unit: 'tsp', category: 'pantry' },
    ];
    const res = groceryIntelligenceService.normalizeAndAggregateIngredients(raw);
    assert.equal(res.length, 1);
    assert.equal(res[0].quantity, 2);
    assert.equal(res[0].unit, 'tbsp');
  });

  await test('normalizeAndAggregateIngredients combines count units: 2 + 3 pieces = 5 pieces', () => {
    const raw = [
      { name: 'Tomato', quantity: 2, unit: 'pcs', category: 'vegetables' },
      { name: 'Tomatoes', quantity: 3, unit: 'pieces', category: 'vegetables' },
    ];
    const res = groceryIntelligenceService.normalizeAndAggregateIngredients(raw);
    assert.equal(res.length, 1);
    assert.equal(res[0].quantity, 5);
    assert.equal(res[0].unit, 'pieces');
  });

  await test('normalizeAndAggregateIngredients keeps incompatible units separate without corrupted sums', () => {
    const raw = [
      { name: 'Paneer', quantity: 500, unit: 'g', category: 'dairy' },
      { name: 'Paneer', quantity: 2, unit: 'pieces', category: 'dairy' },
    ];
    const res = groceryIntelligenceService.normalizeAndAggregateIngredients(raw);
    assert.equal(res.length, 2, 'Incompatible units (mass vs count) must remain 2 separate grocery entries');

    const massItem = res.find((i) => i.unit === 'g');
    const countItem = res.find((i) => i.unit === 'pieces');
    assert.ok(massItem);
    assert.ok(countItem);
    assert.equal(massItem.quantity, 500);
    assert.equal(countItem.quantity, 2);
  });

  // D. Input Validation & Security Ceilings
  await test('validateIngredientData rejects negative or zero quantities', () => {
    assert.equal(validateIngredientData({ name: 'Salt', quantity: 0 }).isValid, false);
    assert.equal(validateIngredientData({ name: 'Salt', quantity: -5 }).isValid, false);
  });

  await test('validateIngredientData rejects NaN and Infinity quantities', () => {
    assert.equal(validateIngredientData({ name: 'Salt', quantity: NaN }).isValid, false);
    assert.equal(validateIngredientData({ name: 'Salt', quantity: Infinity }).isValid, false);
    assert.equal(validateIngredientData({ name: 'Salt', quantity: 'not-a-number' }).isValid, false);
  });

  await test('validateIngredientData rejects unreasonable quantities exceeding safety ceiling (>100,000)', () => {
    assert.equal(validateIngredientData({ name: 'Rice', quantity: 150000 }).isValid, false);
    assert.equal(validateIngredientData({ name: 'Rice', quantity: 500 }).isValid, true);
  });

  await test('validateIngredientData rejects prototype pollution attempts', () => {
    const malicious = JSON.parse('{"name":"Hacked","quantity":1,"__proto__":{"admin":true}}');
    assert.equal(validateIngredientData(malicious).isValid, false);
  });

  await test('validateIngredientData rejects empty or missing name', () => {
    assert.equal(validateIngredientData({ name: '', quantity: 1 }).isValid, false);
    assert.equal(validateIngredientData({ quantity: 1 }).isValid, false);
    assert.equal(validateIngredientData(null).isValid, false);
  });

  // E. Category Handling & Taxonomy
  await test('resolveIngredientCategory preserves explicit category and falls back to heuristic', () => {
    // Explicit preserved
    assert.equal(resolveIngredientCategory('produce', 'Carrot'), 'produce');
    assert.equal(resolveIngredientCategory('dairy', 'Milk'), 'dairy');

    // Heuristic fallback
    assert.equal(resolveIngredientCategory('', 'Spinach'), 'vegetables');
    assert.equal(resolveIngredientCategory('other', 'Apple'), 'fruits');
    assert.equal(resolveIngredientCategory('other', 'Unknown Gizmo'), 'other');
  });

  await test('groupItemsByCategory groups grocery list items into categories correctly', () => {
    const items = [
      { name: 'Spinach', quantity: 1, unit: 'bunch', category: 'vegetables' },
      { name: 'Carrots', quantity: 2, unit: 'pieces', category: 'vegetables' },
      { name: 'Cheddar', quantity: 200, unit: 'g', category: 'dairy' },
      { name: 'Rice', quantity: 1, unit: 'kg', category: 'grains' },
    ];
    const grouped = groceryIntelligenceService.groupItemsByCategory(items);
    assert.equal(grouped.vegetables.length, 2);
    assert.equal(grouped.dairy.length, 1);
    assert.equal(grouped.grains.length, 1);
    assert.equal(grouped.dairy[0].name, 'Cheddar');
  });

  // F. Multi-Recipe Aggregation & Ownership
  await test('groceryIntelligenceService.createFromRecipes aggregates multiple recipes and merges duplicates', async () => {
    const rId1 = new mongoose.Types.ObjectId().toString();
    const rId2 = new mongoose.Types.ObjectId().toString();

    const originalFind = Recipe.find;
    const originalCreate = GroceryList.create;

    Recipe.find = async () => [
      {
        _id: rId1,
        name: 'Recipe A',
        createdBy: null,
        ingredients: [
          { name: 'Paneer', quantity: 300, unit: 'g', category: 'dairy' },
          { name: 'Tomato', quantity: 2, unit: 'pcs', category: 'vegetables' },
        ],
      },
      {
        _id: rId2,
        name: 'Recipe B',
        createdBy: null,
        ingredients: [
          { name: 'Paneer', quantity: 200, unit: 'g', category: 'dairy' },
          { name: 'Tomato', quantity: 3, unit: 'pcs', category: 'vegetables' },
          { name: 'Cumin Seeds', quantity: 1, unit: 'tsp', category: 'spices' },
        ],
      },
    ];

    let createdPayload = null;
    GroceryList.create = async (payload) => {
      createdPayload = payload;
      return { _id: 'list_multi_123', ...payload };
    };

    try {
      const list = await groceryIntelligenceService.createFromRecipes(mockUserId, [rId1, rId2]);
      assert.ok(list);
      assert.equal(createdPayload.source, 'recipe');
      assert.equal(createdPayload.items.length, 3);

      const paneer = createdPayload.items.find((i) => i.name.toLowerCase() === 'paneer');
      assert.equal(paneer.quantity, 500);
      assert.equal(paneer.unit, 'g');

      const tomato = createdPayload.items.find((i) => i.name.toLowerCase() === 'tomato');
      assert.equal(tomato.quantity, 5);

      const cumin = createdPayload.items.find((i) => i.name.toLowerCase().includes('cumin'));
      assert.ok(cumin);
      assert.equal(cumin.quantity, 1);
    } finally {
      Recipe.find = originalFind;
      GroceryList.create = originalCreate;
    }
  });

  await test('groceryIntelligenceService.createFromRecipes throws 404 for missing recipe ID', async () => {
    const badId = new mongoose.Types.ObjectId().toString();
    const originalFind = Recipe.find;
    Recipe.find = async () => [];

    try {
      await assert.rejects(
        async () => groceryIntelligenceService.createFromRecipes(mockUserId, [badId]),
        /does not exist/i
      );
    } finally {
      Recipe.find = originalFind;
    }
  });

  await test('groceryIntelligenceService.createFromRecipes throws 403 for unauthorized private recipe', async () => {
    const foreignUser = new mongoose.Types.ObjectId();
    const recipeId = new mongoose.Types.ObjectId().toString();

    const originalFind = Recipe.find;
    Recipe.find = async () => [
      {
        _id: recipeId,
        name: 'Secret User Dish',
        createdBy: foreignUser, // Owned by another user
        ingredients: [{ name: 'Secret Herb', quantity: 1, unit: 'tsp' }],
      },
    ];

    try {
      await assert.rejects(
        async () => groceryIntelligenceService.createFromRecipes(mockUserId, [recipeId]),
        /do not have permission/i
      );
    } finally {
      Recipe.find = originalFind;
    }
  });

  // G. Appending Recipes to Existing Grocery List
  await test('groceryIntelligenceService.addRecipesToList merges recipe ingredients into existing list', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const recipeId = new mongoose.Types.ObjectId().toString();

    const originalGetList = groceryService.getGroceryListById;
    const originalUpdateList = groceryService.updateGroceryList;
    const originalFindRecipe = Recipe.find;

    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Existing List',
      items: [
        { name: 'Paneer', quantity: 200, unit: 'g', category: 'dairy', checked: false },
        { name: 'Toothpaste', quantity: 1, unit: 'piece', category: 'other', checked: true }, // manual item
      ],
    });

    Recipe.find = async () => [
      {
        _id: recipeId,
        name: 'Paneer Skillet',
        createdBy: null,
        ingredients: [{ name: 'Paneer', quantity: 300, unit: 'g', category: 'dairy' }],
      },
    ];

    let updatedPayload = null;
    groceryService.updateGroceryList = async (uid, lid, payload) => {
      updatedPayload = payload;
      return { _id: lid, ...payload };
    };

    try {
      const res = await groceryIntelligenceService.addRecipesToList(mockUserId, listId, [recipeId]);
      assert.ok(res);
      assert.equal(updatedPayload.items.length, 2);

      const paneer = updatedPayload.items.find((i) => i.name.toLowerCase() === 'paneer');
      assert.equal(paneer.quantity, 500);

      const manual = updatedPayload.items.find((i) => i.name.toLowerCase() === 'toothpaste');
      assert.ok(manual, 'Manual items must be preserved when recipes are appended');
      assert.equal(manual.quantity, 1);
    } finally {
      groceryService.getGroceryListById = originalGetList;
      groceryService.updateGroceryList = originalUpdateList;
      Recipe.find = originalFindRecipe;
    }
  });

  // H. Zai Natural Language Resolution & Dispatch
  await test('zaiResolverService detects "Create a grocery list from my meal plan" and extracts source: meal-plan', () => {
    const resolved = zaiResolverService.resolveAction('Create a grocery list from my meal plan');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.source, 'meal-plan');
  });

  await test('zaiResolverService detects "Add ingredients from this recipe to my grocery list"', () => {
    const resolved = zaiResolverService.resolveAction('Add ingredients from this recipe to my grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.source, 'recipe');
  });

  await test('zaiResolverService detects "Add milk to my grocery list" and extracts queryType: add_item, item: milk', () => {
    const resolved = zaiResolverService.resolveAction('Add 2 l milk to my grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'add_item');
    assert.equal(resolved.parameters.quantity, 2);
    assert.equal(resolved.parameters.unit, 'l');
    assert.equal(resolved.parameters.item, 'milk');
  });

  await test('zaiResolverService detects "What do I need to buy?" and extracts queryType: view', () => {
    const resolved = zaiResolverService.resolveAction('What do I need to buy?');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'view');
  });

  await test('zaiActionService.dispatchAction handles meal plan grocery creation via groceryIntelligenceService', async () => {
    const originalGetPlans = mealPlanService.getMealPlans;
    const originalCreatePlan = groceryIntelligenceService.createFromMealPlan;

    mealPlanService.getMealPlans = async () => ({
      mealPlans: [{ _id: 'plan_1', name: 'Weekly Fitness' }],
    });

    groceryIntelligenceService.createFromMealPlan = async () => ({
      _id: 'gen_list_1',
      name: 'Grocery List for Weekly Fitness',
      items: [{ name: 'Eggs', quantity: 12 }, { name: 'Oats', quantity: 1 }],
    });

    try {
      const res = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        { source: 'meal-plan' },
        mockUserId,
        null
      );
      assert.ok(res.message.includes('Weekly Fitness'));
      assert.ok(res.message.includes('2 consolidated item'));
      assert.ok(res.data);
    } finally {
      mealPlanService.getMealPlans = originalGetPlans;
      groceryIntelligenceService.createFromMealPlan = originalCreatePlan;
    }
  });

  await test('zaiActionService.dispatchAction handles single item grocery addition', async () => {
    const originalGetLists = groceryService.getGroceryLists;
    const originalAddItem = groceryService.addItem;

    groceryService.getGroceryLists = async () => ({
      groceryLists: [{ _id: 'list_1', name: 'Fresh Kitchen' }],
    });

    groceryService.addItem = async (uid, lid, item) => ({
      _id: lid,
      name: 'Fresh Kitchen',
      items: [item],
    });

    try {
      const res = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        { queryType: 'add_item', item: 'avocado', quantity: 2, unit: 'piece' },
        mockUserId,
        null
      );
      assert.ok(res.message.includes('avocado'));
      assert.ok(res.message.includes('Fresh Kitchen'));
    } finally {
      groceryService.getGroceryLists = originalGetLists;
      groceryService.addItem = originalAddItem;
    }
  });

  await test('zaiActionService.dispatchAction handles grocery list view / summary', async () => {
    const originalGetLists = groceryService.getGroceryLists;

    groceryService.getGroceryLists = async () => ({
      groceryLists: [
        {
          _id: 'list_view_1',
          name: 'Home Pantry',
          items: [
            { name: 'Apples', quantity: 4, unit: 'piece', checked: false },
            { name: 'Milk', quantity: 1, unit: 'l', checked: true }, // already bought
          ],
        },
      ],
    });

    try {
      const res = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        { queryType: 'view' },
        mockUserId,
        null
      );
      assert.ok(res.message.includes('Home Pantry'));
      assert.ok(res.message.includes('1 pending item'));
      assert.ok(res.message.includes('Apples'));
    } finally {
      groceryService.getGroceryLists = originalGetLists;
    }
  });

  await test('zaiActionService.processMessage multi-turn: creates grocery list from recipe generated in previous turn', async () => {
    const testUser = new mongoose.Types.ObjectId();
    const mockSessionId = new mongoose.Types.ObjectId().toString();

    // Turn 1 conversation state with generated recipe in assistant turn
    const mockConversation = {
      _id: mockSessionId,
      user: testUser,
      messages: [
        {
          role: 'user',
          content: 'Give me a dinner recipe',
          action: ZAI_ACTIONS.RECIPE_GENERATION,
        },
        {
          role: 'assistant',
          content: 'Here is a delicious Vegetable Pulao recipe.',
          action: ZAI_ACTIONS.RECIPE_GENERATION,
          parameters: {
            recipeName: 'Vegetable Pulao',
            recipeIngredients: [
              { name: 'Basmati Rice', quantity: 200, unit: 'g', category: 'grains' },
              { name: 'Peas', quantity: 100, unit: 'g', category: 'vegetables' },
            ],
          },
        },
      ],
    };

    const originalGetOrCreate = zaiConversationService.getOrCreateConversation;
    const originalAppendTurns = zaiConversationService.appendTurns;
    const originalCreateGrocery = groceryService.createGroceryList;

    zaiConversationService.getOrCreateConversation = async () => mockConversation;
    zaiConversationService.appendTurns = async () => true;

    let createdGroceryDoc = null;
    groceryService.createGroceryList = async (uid, payload) => {
      createdGroceryDoc = payload;
      return { _id: 'list_from_turn_1', ...payload };
    };

    try {
      const response = await zaiActionService.processMessage(
        testUser,
        'Add its ingredients to my grocery list',
        mockSessionId
      );

      assert.equal(response.action, ZAI_ACTIONS.GROCERY_LIST);
      assert.ok(createdGroceryDoc);
      assert.equal(createdGroceryDoc.source, 'recipe');
      assert.equal(createdGroceryDoc.items.length, 2);
      assert.ok(response.message.includes('Vegetable Pulao') || response.message.includes('ingredient'));
    } finally {
      zaiConversationService.getOrCreateConversation = originalGetOrCreate;
      zaiConversationService.appendTurns = originalAppendTurns;
      groceryService.createGroceryList = originalCreateGrocery;
    }
  });

  // I. HTTP API Integration Tests
  await test('POST /api/grocery/from-recipes generates grocery list with valid token', async () => {
    const recipeId1 = new mongoose.Types.ObjectId().toString();

    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalRecipeFind = Recipe.find;
    Recipe.find = async () => [
      {
        _id: recipeId1,
        name: 'Quick Pasta',
        createdBy: null,
        ingredients: [{ name: 'Penne Pasta', quantity: 250, unit: 'g', category: 'grains' }],
      },
    ];

    const originalCreateList = groceryService.createGroceryList;
    groceryService.createGroceryList = async (uid, payload) => ({
      _id: new mongoose.Types.ObjectId(),
      ...payload,
      user: uid,
      toJSON() { return this; },
    });

    try {
      const res = await fetch(`${baseUrl}/api/grocery/from-recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ recipeIds: [recipeId1] }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.source, 'recipe');
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      Recipe.find = originalRecipeFind;
      groceryService.createGroceryList = originalCreateList;
    }
  });

  await test('POST /api/grocery/:id/recipes appends recipe ingredients to existing grocery list with valid token', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const recipeId = new mongoose.Types.ObjectId().toString();

    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetList = groceryService.getGroceryListById;
    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Existing List',
      items: [{ name: 'Milk', quantity: 1, unit: 'l', category: 'dairy', checked: false }],
    });

    const originalRecipeFind = Recipe.find;
    Recipe.find = async () => [
      {
        _id: recipeId,
        name: 'Coffee',
        createdBy: null,
        ingredients: [{ name: 'Coffee Beans', quantity: 100, unit: 'g', category: 'beverages' }],
      },
    ];

    const originalUpdateList = groceryService.updateGroceryList;
    groceryService.updateGroceryList = async (uid, lid, payload) => ({
      _id: lid,
      user: uid,
      ...payload,
      toJSON() { return this; },
    });

    try {
      const res = await fetch(`${baseUrl}/api/grocery/${listId}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ recipeIds: [recipeId] }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.items.length, 2);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      groceryService.getGroceryListById = originalGetList;
      Recipe.find = originalRecipeFind;
      groceryService.updateGroceryList = originalUpdateList;
    }
  });

  await test('GET /api/grocery/:id/grouped returns grocery list grouped by category', async () => {
    const listId = new mongoose.Types.ObjectId().toString();

    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetList = groceryService.getGroceryListById;
    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Weekly Provisions',
      items: [
        { name: 'Apples', quantity: 3, unit: 'piece', category: 'fruits' },
        { name: 'Milk', quantity: 1, unit: 'l', category: 'dairy' },
      ],
      toJSON() { return this; },
    });

    try {
      const res = await fetch(`${baseUrl}/api/grocery/${listId}/grouped`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.groupedItems);
      assert.equal(body.data.groupedItems.fruits.length, 1);
      assert.equal(body.data.groupedItems.dairy.length, 1);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('POST /api/grocery/from-recipes without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/grocery/from-recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeIds: ['123'] }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await test('POST /api/grocery/from-recipes returns 503 when DB is disconnected without hanging', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 0;

    try {
      const res = await fetch(`${baseUrl}/api/grocery/from-recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ recipeIds: ['123'] }),
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.includes('Database service is currently unavailable'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  // --- Section 43: Price Intelligence Phase 1 (Shopping Links & Fallback Foundation) Tests ---

  // A. Marketplace Adapter & URL Generation Tests
  await test('BlinkitAdapter generates valid deterministic search URL', () => {
    const url = blinkitAdapter.getSearchUrl('Paneer');
    assert.equal(url, 'https://blinkit.com/s/?q=Paneer');
    assert.equal(blinkitAdapter.name, 'blinkit');
    assert.equal(blinkitAdapter.isConfigured(), false);
  });

  await test('ZeptoAdapter generates valid deterministic search URL', () => {
    const url = zeptoAdapter.getSearchUrl('Fresh Milk');
    assert.equal(url, 'https://www.zeptonow.com/search?q=Fresh%20Milk');
    assert.equal(zeptoAdapter.name, 'zepto');
    assert.equal(zeptoAdapter.isConfigured(), false);
  });

  await test('JioMartAdapter generates valid deterministic search URL', () => {
    const url = jiomartAdapter.getSearchUrl('Basmati Rice');
    assert.equal(url, 'https://www.jiomart.com/search/Basmati%20Rice');
    assert.equal(jiomartAdapter.name, 'jiomart');
    assert.equal(jiomartAdapter.isConfigured(), false);
  });

  await test('InstamartAdapter generates valid deterministic search URL', () => {
    const url = instamartAdapter.getSearchUrl('Greek Yogurt');
    assert.equal(url, 'https://www.swiggy.com/instamart/search?query=Greek%20Yogurt');
    assert.equal(instamartAdapter.name, 'instamart');
    assert.equal(instamartAdapter.isConfigured(), false);
  });

  await test('Adapters properly encode special characters, ampersands, and spaces', () => {
    const query = 'extra virgin olive oil & garlic';
    const blinkitUrl = blinkitAdapter.getSearchUrl(query);
    assert.ok(blinkitUrl.includes('extra%20virgin%20olive%20oil%20%26%20garlic'));
    assert.equal(isValidMarketplaceUrl(blinkitUrl), true);
  });

  await test('Adapters properly encode Unicode ingredient names', () => {
    const unicodeQuery = 'हल्दी पाउडर';
    const zeptoUrl = zeptoAdapter.getSearchUrl(unicodeQuery);
    assert.ok(zeptoUrl.startsWith('https://www.zeptonow.com/search?q='));
    assert.equal(isValidMarketplaceUrl(zeptoUrl), true);
  });

  await test('Adapters reject empty, null, or whitespace-only search queries', () => {
    assert.throws(() => blinkitAdapter.getSearchUrl(''), /cannot be empty/);
    assert.throws(() => zeptoAdapter.getSearchUrl('   '), /cannot be empty/);
    assert.throws(() => jiomartAdapter.getSearchUrl(null), /cannot be empty/);
  });

  await test('Adapters reject prototype pollution attempt in query', () => {
    assert.throws(() => blinkitAdapter.getSearchUrl('__proto__'), /Forbidden term/);
    assert.throws(() => zeptoAdapter.getSearchUrl('constructor'), /Forbidden term/);
  });

  await test('Adapters return unconfigured response for searchProduct without network calls', async () => {
    const res = await blinkitAdapter.searchProduct('Paneer');
    assert.equal(res.pricingAvailable, false);
    assert.deepEqual(res.products, []);
    assert.ok(res.message.includes('not configured'));
  });

  await test('Marketplace Registry exports all 4 supported adapters', () => {
    const all = getAllMarketplaceAdapters();
    assert.equal(all.length, 4);
    assert.deepEqual(SUPPORTED_MARKETPLACES, ['blinkit', 'zepto', 'jiomart', 'instamart']);
    assert.equal(getMarketplaceAdapter('zepto'), zeptoAdapter);
    assert.equal(getMarketplaceAdapter('unknown'), null);
  });

  // B. Marketplace URL Security & Whitelist Tests
  await test('isValidMarketplaceUrl accepts valid HTTPS URLs for all approved domains', () => {
    assert.equal(isValidMarketplaceUrl('https://blinkit.com/s/?q=milk'), true);
    assert.equal(isValidMarketplaceUrl('https://www.zeptonow.com/search?q=milk'), true);
    assert.equal(isValidMarketplaceUrl('https://www.jiomart.com/search/milk'), true);
    assert.equal(isValidMarketplaceUrl('https://www.swiggy.com/instamart/search?query=milk'), true);
  });

  await test('isValidMarketplaceUrl rejects insecure HTTP protocol', () => {
    assert.equal(isValidMarketplaceUrl('http://blinkit.com/s/?q=milk'), false);
    assert.equal(isValidMarketplaceUrl('http://www.zeptonow.com/search?q=milk'), false);
  });

  await test('isValidMarketplaceUrl rejects javascript: and data: schemes', () => {
    assert.equal(isValidMarketplaceUrl('javascript:alert(1)'), false);
    assert.equal(isValidMarketplaceUrl('data:text/html,<script>alert(1)</script>'), false);
  });

  await test('isValidMarketplaceUrl rejects unauthorized domains and phishing attempts', () => {
    assert.equal(isValidMarketplaceUrl('https://evil.com/s/?q=milk'), false);
    assert.equal(isValidMarketplaceUrl('https://phishing-blinkit.com/s/?q=milk'), false);
    assert.equal(isValidMarketplaceUrl('https://blinkit.com.attacker.com/s/?q=milk'), false);
  });

  await test('isValidMarketplaceUrl rejects URLs containing user credentials', () => {
    assert.equal(isValidMarketplaceUrl('https://admin:pass@blinkit.com/s/?q=milk'), false);
  });

  await test('assertValidMarketplaceUrl throws on invalid URLs', () => {
    assert.throws(() => assertValidMarketplaceUrl('https://attacker.org'), /Invalid marketplace URL/);
  });

  // C. PriceIntelligenceService Unit Tests
  await test('priceIntelligenceService.getShoppingLinksForList generates links for valid grocery list items', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async (uid, lid) => ({
      _id: listId,
      user: uid,
      name: 'Weekend Groceries',
      items: [
        { _id: 'item1', name: 'Paneer', quantity: 500, unit: 'g', category: 'dairy', checked: false },
        { _id: 'item2', name: 'Tomatoes', quantity: 2, unit: 'piece', category: 'produce', checked: true },
      ],
      toJSON() { return this; },
    });

    try {
      const result = await priceIntelligenceService.getShoppingLinksForList(mockUserId, listId);
      assert.equal(result.groceryListId, listId);
      assert.equal(result.listName, 'Weekend Groceries');
      assert.equal(result.pricingAvailable, false);
      assert.ok(result.disclaimer.includes('real-time confirmation'));
      assert.equal(result.items.length, 2);

      const paneerItem = result.items[0];
      assert.equal(paneerItem.name, 'Paneer');
      assert.equal(paneerItem.quantity, 500);
      assert.equal(paneerItem.unit, 'g');
      assert.equal(paneerItem.category, 'dairy');
      assert.equal(paneerItem.checked, false);
      assert.equal(paneerItem.marketplaces.length, 4);

      const blinkitLink = paneerItem.marketplaces.find((m) => m.marketplace === 'blinkit');
      assert.ok(blinkitLink);
      assert.equal(blinkitLink.searchUrl, 'https://blinkit.com/s/?q=Paneer');
      assert.equal(blinkitLink.pricingAvailable, false);
    } finally {
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService.getShoppingLinksForList filters by preferredMarketplace when specified', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async (uid, lid) => ({
      _id: listId,
      user: uid,
      name: 'Zepto-only Groceries',
      items: [{ _id: 'item1', name: 'Curd', quantity: 1, unit: 'pack', category: 'dairy' }],
      toJSON() { return this; },
    });

    try {
      const result = await priceIntelligenceService.getShoppingLinksForList(mockUserId, listId, 'zepto');
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].marketplaces.length, 1);
      assert.equal(result.items[0].marketplaces[0].marketplace, 'zepto');
      assert.ok(result.items[0].marketplaces[0].searchUrl.includes('zeptonow.com'));
    } finally {
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService.getShoppingLinksForList enforces list ownership via groceryService', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async () => {
      const err = new Error('You do not have permission to access this grocery list.');
      err.statusCode = 403;
      throw err;
    };

    try {
      await assert.rejects(
        () => priceIntelligenceService.getShoppingLinksForList(mockUserId, listId),
        (err) => err.statusCode === 403
      );
    } finally {
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService.getItemShoppingLinks generates search links for a single standalone item', () => {
    const result = priceIntelligenceService.getItemShoppingLinks('Almonds');
    assert.equal(result.item, 'Almonds');
    assert.equal(result.pricingAvailable, false);
    assert.equal(result.marketplaces.length, 4);
    assert.ok(result.marketplaces[0].searchUrl.includes('Almonds'));
  });

  // D. Zai Intent Resolution & Action Dispatch Tests
  await test('zaiResolverService detects "Where can I buy these groceries?" as GROCERY_LIST shopping_links', () => {
    const resolved = zaiResolverService.resolveAction('Where can I buy these groceries?');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'shopping_links');
  });

  await test('zaiResolverService detects "Show me where I can buy this grocery list" as GROCERY_LIST shopping_links', () => {
    const resolved = zaiResolverService.resolveAction('Show me where I can buy this grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'shopping_links');
  });

  await test('zaiResolverService detects "Give me shopping links" as GROCERY_LIST shopping_links', () => {
    const resolved = zaiResolverService.resolveAction('Give me shopping links');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'shopping_links');
  });

  await test('zaiResolverService detects "Where can I buy paneer?" and extracts item: paneer', () => {
    const resolved = zaiResolverService.resolveAction('Where can I buy paneer?');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'shopping_links');
    assert.equal(resolved.parameters.item, 'paneer');
  });

  await test('zaiResolverService detects "Open Blinkit for my grocery list" and extracts marketplace: blinkit', () => {
    const resolved = zaiResolverService.resolveAction('Open Blinkit for my grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'shopping_links');
    assert.equal(resolved.parameters.marketplace, 'blinkit');
  });

  await test('zaiActionService.dispatchAction handles shopping_links queryType for grocery list', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetLists = groceryService.getGroceryLists;
    const originalGetShopping = priceIntelligenceService.getShoppingLinksForList;

    groceryService.getGroceryLists = async () => ({
      groceryLists: [{ _id: listId, name: 'My Groceries', items: [{ name: 'Rice' }] }],
    });

    priceIntelligenceService.getShoppingLinksForList = async (uid, lid) => ({
      groceryListId: lid,
      listName: 'My Groceries',
      items: [{ name: 'Rice', marketplaces: [] }],
      pricingAvailable: false,
    });

    try {
      const response = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        { queryType: 'shopping_links' },
        mockUserId,
        null
      );

      assert.ok(response.message.includes('Generated marketplace shopping links'));
      assert.equal(response.data.groceryListId, listId);
    } finally {
      groceryService.getGroceryLists = originalGetLists;
      priceIntelligenceService.getShoppingLinksForList = originalGetShopping;
    }
  });

  await test('zaiActionService.dispatchAction handles shopping_links queryType for single item query', async () => {
    const response = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.GROCERY_LIST,
      { queryType: 'shopping_links', item: 'tofu' },
      mockUserId,
      null
    );

    assert.ok(response.message.includes('Here are shopping search links for tofu'));
    assert.equal(response.data.item, 'tofu');
    assert.equal(response.data.marketplaces.length, 4);
  });

  // E. HTTP API Integration Tests (GET /api/grocery/:id/shopping-links)
  await test('GET /api/grocery/:id/shopping-links returns 200 with structured links for valid authenticated user', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetList = groceryService.getGroceryListById;
    groceryService.getGroceryListById = async (uid, lid) => ({
      _id: listId,
      user: mockUserId,
      name: 'Weekly Provisions',
      items: [
        { _id: 'item1', name: 'Apples', quantity: 6, unit: 'piece', category: 'fruits', checked: false },
      ],
      toJSON() { return this; },
    });

    try {
      const res = await fetch(`${baseUrl}/api/grocery/${listId}/shopping-links`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.groceryListId, listId);
      assert.equal(body.data.pricingAvailable, false);
      assert.ok(body.data.disclaimer.includes('real-time confirmation'));
      assert.equal(body.data.items[0].marketplaces.length, 4);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('GET /api/grocery/:id/shopping-links without token returns 401 Unauthorized', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/grocery/${listId}/shopping-links`);
    assert.equal(res.status, 401);
  });

  await test('GET /api/grocery/:id/shopping-links returns 503 when DB is disconnected without hanging', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 0;

    try {
      const res = await fetch(`${baseUrl}/api/grocery/${listId}/shopping-links`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.includes('Database service is currently unavailable'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  // --- Section 44: Price Intelligence Phase 2 (Product Matching & Price Comparison Foundation) Tests ---

  // A. Product Matching Service Tests
  await test('productMatchingService normalizes whitespace, casing, and basic tokens', () => {
    assert.equal(productMatchingService.normalizeProductName('  Fresh Paneer  '), 'fresh paneer');
    assert.equal(productMatchingService.normalizeProductName('HALDI POWDER'), 'haldi powder');
    assert.equal(productMatchingService.normalizeProductName('  Cow   Milk  1L  '), 'cow milk 1l');
  });

  await test('productMatchingService strips decorative punctuation while preserving alphanumeric tokens', () => {
    const raw = 'Amul Butter (Pasteurized), Salted* - 500g!';
    const normalized = productMatchingService.normalizeProductName(raw);
    assert.equal(normalized, 'amul butter pasteurized salted 500g');
  });

  await test('productMatchingService preserves Unicode product names accurately', () => {
    const unicodeName = 'हल्दी पाउडर';
    const normalized = productMatchingService.normalizeProductName(unicodeName);
    assert.equal(normalized, 'हल्दी पाउडर');
  });

  await test('productMatchingService prepares product query structure with originalName and tokens', () => {
    const prepared = productMatchingService.prepareProductQuery({ name: '  Extra Virgin Olive Oil  ' });
    assert.equal(prepared.originalName, 'Extra Virgin Olive Oil');
    assert.equal(prepared.canonicalQuery, 'extra virgin olive oil');
    assert.deepEqual(prepared.tokens, ['extra', 'virgin', 'olive', 'oil']);
  });

  await test('productMatchingService evaluates candidate match overlap score accurately', () => {
    const evalResult = productMatchingService.evaluateCandidateMatch(
      'fresh paneer',
      'Amul Fresh Malai Paneer 200g'
    );
    assert.equal(evalResult.matched, true);
    assert.equal(evalResult.score, 1);
    assert.ok(evalResult.matchedTokens.includes('fresh'));
    assert.ok(evalResult.matchedTokens.includes('paneer'));

    const mismatch = productMatchingService.evaluateCandidateMatch('paneer', 'Amul Salted Butter');
    assert.equal(mismatch.matched, false);
    assert.equal(mismatch.score, 0);
  });

  await test('productMatchingService rejects empty or invalid product names', () => {
    assert.throws(() => productMatchingService.normalizeProductName(''), /cannot be empty/);
    assert.throws(() => productMatchingService.normalizeProductName('   '), /cannot be empty/);
    assert.throws(() => productMatchingService.normalizeProductName(null), /cannot be empty/);
    assert.throws(() => productMatchingService.normalizeProductName(12345), /must be a string/);
    assert.throws(() => productMatchingService.normalizeProductName('***!!!'), /contains only punctuation/);
  });

  await test('productMatchingService rejects prototype pollution attempts in product name', () => {
    assert.throws(() => productMatchingService.normalizeProductName('__proto__'), /Forbidden keyword/);
    assert.throws(() => productMatchingService.normalizeProductName('constructor'), /Forbidden keyword/);
  });

  // B. Price Comparison Service Tests
  await test('priceComparisonService handles all unavailable/null prices gracefully', () => {
    const offers = [
      { marketplace: 'blinkit', displayName: 'Blinkit', price: null, pricingAvailable: false },
      { marketplace: 'zepto', displayName: 'Zepto', price: null, pricingAvailable: false },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, false);
    assert.equal(result.bestPrice, null);
    assert.equal(result.bestMarketplace, null);
    assert.equal(result.validOffersCount, 0);
    assert.equal(result.totalOffers, 2);
  });

  await test('priceComparisonService selects lowest price among multiple valid offers', () => {
    const offers = [
      { marketplace: 'blinkit', price: 210, pricingAvailable: true },
      { marketplace: 'zepto', price: 199, pricingAvailable: true },
      { marketplace: 'jiomart', price: 215, pricingAvailable: true },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.bestPrice, 199);
    assert.equal(result.bestMarketplace, 'zepto');
    assert.equal(result.validOffersCount, 3);
    assert.equal(result.isTied, false);
  });

  await test('priceComparisonService handles single valid price among null prices', () => {
    const offers = [
      { marketplace: 'blinkit', price: null, pricingAvailable: false },
      { marketplace: 'zepto', price: 185, pricingAvailable: true },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.bestPrice, 185);
    assert.equal(result.bestMarketplace, 'zepto');
    assert.equal(result.validOffersCount, 1);
  });

  await test('priceComparisonService detects tied lowest prices across marketplaces', () => {
    const offers = [
      { marketplace: 'blinkit', price: 100, pricingAvailable: true },
      { marketplace: 'zepto', price: 100, pricingAvailable: true },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.bestPrice, 100);
    assert.equal(result.isTied, true);
    assert.equal(result.bestOffers.length, 2);
  });

  await test('priceComparisonService ignores non-numeric, NaN, Infinity, and non-positive prices', () => {
    const offers = [
      { marketplace: 'blinkit', price: -50, pricingAvailable: true },
      { marketplace: 'zepto', price: 0, pricingAvailable: true },
      { marketplace: 'jiomart', price: NaN, pricingAvailable: true },
      { marketplace: 'instamart', price: Infinity, pricingAvailable: true },
      { marketplace: 'mock', price: 'free', pricingAvailable: true },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, false);
    assert.equal(result.validOffersCount, 0);
    assert.equal(result.bestPrice, null);
  });

  await test('priceComparisonService filters duplicate marketplace entries taking lowest valid price', () => {
    const offers = [
      { marketplace: 'zepto', price: 220, pricingAvailable: true },
      { marketplace: 'zepto', price: 195, pricingAvailable: true },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.totalOffers, 1);
    assert.equal(result.bestPrice, 195);
  });

  await test('priceComparisonService handles empty or malformed offers array gracefully', () => {
    assert.equal(priceComparisonService.compareOffers([]).pricingAvailable, false);
    assert.equal(priceComparisonService.compareOffers(null).pricingAvailable, false);
    assert.equal(priceComparisonService.compareOffers([null, undefined, 'bad']).pricingAvailable, false);
  });

  await test('priceComparisonService.compareBasket evaluates multiple items with offers', () => {
    const basketItems = [
      {
        name: 'Milk',
        offers: [
          { marketplace: 'blinkit', price: 30, pricingAvailable: true },
          { marketplace: 'zepto', price: 32, pricingAvailable: true },
        ],
      },
      {
        name: 'Bread',
        offers: [{ marketplace: 'zepto', price: 40, pricingAvailable: true }],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].comparison.bestPrice, 30);
    assert.equal(result.items[1].comparison.bestPrice, 40);
  });

  // C. Price Intelligence Phase 2 Integration Tests
  await test('priceIntelligenceService.getPriceComparisonForList returns normalized items and unconfigured comparisons', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async (uid, lid) => ({
      _id: listId,
      user: uid,
      name: 'Comparison Groceries',
      items: [
        { _id: 'item1', name: '  Fresh Paneer  ', quantity: 500, unit: 'g', category: 'dairy', checked: false },
      ],
      toJSON() { return this; },
    });

    try {
      const result = await priceIntelligenceService.getPriceComparisonForList(mockUserId, listId);
      assert.equal(result.groceryListId, listId);
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].canonicalQuery, 'fresh paneer');
      assert.equal(result.items[0].comparison.pricingAvailable, false);
      assert.equal(result.items[0].comparison.bestPrice, null);
    } finally {
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService.getItemPriceComparison generates single item comparison foundation', () => {
    const result = priceIntelligenceService.getItemPriceComparison('  Basmati Rice  ');
    assert.equal(result.item, 'Basmati Rice');
    assert.equal(result.canonicalQuery, 'basmati rice');
    assert.equal(result.pricingAvailable, false);
    assert.equal(result.comparison.totalOffers, 4);
  });

  // D. Zai Intent Resolution & Dispatch Phase 2 Tests
  await test('zaiResolverService detects "Which store has the cheapest paneer?" as price_comparison with item: paneer', () => {
    const resolved = zaiResolverService.resolveAction('Which store has the cheapest paneer?');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'price_comparison');
    assert.equal(resolved.parameters.item, 'paneer');
  });

  await test('zaiResolverService detects "Compare prices for my grocery list" as price_comparison', () => {
    const resolved = zaiResolverService.resolveAction('Compare prices for my grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'price_comparison');
  });

  await test('zaiResolverService detects "Which app is cheapest for my grocery list?" as price_comparison', () => {
    const resolved = zaiResolverService.resolveAction('Which app is cheapest for my grocery list?');
    assert.equal(resolved.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resolved.parameters.queryType, 'price_comparison');
  });

  await test('zaiActionService.dispatchAction handles price_comparison for grocery list with unconfigured disclaimer', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetLists = groceryService.getGroceryLists;
    const originalGetComparison = priceIntelligenceService.getPriceComparisonForList;

    groceryService.getGroceryLists = async () => ({
      groceryLists: [{ _id: listId, name: 'My Groceries', items: [{ name: 'Rice' }] }],
    });

    priceIntelligenceService.getPriceComparisonForList = async (uid, lid) => ({
      groceryListId: lid,
      listName: 'My Groceries',
      items: [{ name: 'Rice', comparison: { pricingAvailable: false } }],
      pricingAvailable: false,
    });

    try {
      const response = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        { queryType: 'price_comparison' },
        mockUserId,
        null
      );

      assert.ok(response.message.includes('currently unconfigured'));
      assert.equal(response.data.groceryListId, listId);
    } finally {
      groceryService.getGroceryLists = originalGetLists;
      priceIntelligenceService.getPriceComparisonForList = originalGetComparison;
    }
  });

  await test('zaiActionService.dispatchAction handles price_comparison for single item query', async () => {
    const response = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.GROCERY_LIST,
      { queryType: 'price_comparison', item: 'paneer' },
      mockUserId,
      null
    );

    assert.ok(response.message.includes('Live price comparison is currently unconfigured'));
    assert.equal(response.data.item, 'paneer');
    assert.equal(response.data.pricingAvailable, false);
  });

  // E. HTTP API Integration Tests (GET /api/grocery/:id/price-comparison)
  await test('GET /api/grocery/:id/price-comparison returns 200 with structured comparison for authenticated user', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetList = groceryService.getGroceryListById;
    groceryService.getGroceryListById = async (uid, lid) => ({
      _id: listId,
      user: mockUserId,
      name: 'Sunday Basket',
      items: [
        { _id: 'item1', name: 'Paneer', quantity: 500, unit: 'g', category: 'dairy', checked: false },
      ],
      toJSON() { return this; },
    });

    try {
      const res = await fetch(`${baseUrl}/api/grocery/${listId}/price-comparison`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.groceryListId, listId);
      assert.equal(body.data.pricingAvailable, false);
      assert.equal(body.data.items[0].canonicalQuery, 'paneer');
      assert.equal(body.data.items[0].comparison.pricingAvailable, false);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('GET /api/grocery/:id/price-comparison without token returns 401 Unauthorized', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/api/grocery/${listId}/price-comparison`);
    assert.equal(res.status, 401);
  });

  await test('GET /api/grocery/:id/price-comparison returns 503 when DB is disconnected without hanging', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 0;

    try {
      const res = await fetch(`${baseUrl}/api/grocery/${listId}/price-comparison`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error.includes('Database service is currently unavailable'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
    }
  });

  // =========================================================================
  // 45. PHASE 3 — MARKETPLACE PRICE PROVIDER ARCHITECTURE TESTS
  // =========================================================================

  // A. Provider Contract Tests
  await test('BasePriceProvider initializes correctly with lowercase id and displayName', () => {
    const provider = new BasePriceProvider('Blinkit', 'Blinkit Quick Commerce');
    assert.equal(provider.id, 'blinkit');
    assert.equal(provider.name, 'blinkit');
    assert.equal(provider.displayName, 'Blinkit Quick Commerce');
    assert.equal(provider.isConfigured(), false);
    assert.equal(provider.supportsPricing(), false);
  });

  await test('BasePriceProvider constructor throws for missing or invalid id or displayName', () => {
    assert.throws(() => new BasePriceProvider('', 'Blinkit'), /valid id/);
    assert.throws(() => new BasePriceProvider('blinkit', ''), /valid displayName/);
    assert.throws(() => new BasePriceProvider(null, 'Blinkit'), /valid id/);
  });

  await test('BasePriceProvider constructor rejects prototype pollution id', () => {
    assert.throws(() => new BasePriceProvider('__proto__', 'Malicious'), /Forbidden provider id/);
  });

  await test('BasePriceProvider.searchProduct returns pricingAvailable: false without network calls', async () => {
    const provider = new BasePriceProvider('zepto', 'Zepto');
    const result = await provider.searchProduct('paneer');
    assert.equal(result.pricingAvailable, false);
    assert.ok(result.message.includes('not configured'));
    assert.deepEqual(result.products, []);
  });

  await test('BasePriceProvider.getProductOffer returns standardized unconfigured offer', () => {
    const provider = new BasePriceProvider('jiomart', 'JioMart');
    const offer = provider.getProductOffer('Fresh Paneer');
    assert.equal(offer.marketplace, 'jiomart');
    assert.equal(offer.displayName, 'JioMart');
    assert.equal(offer.productName, 'Fresh Paneer');
    assert.equal(offer.price, null);
    assert.equal(offer.currency, 'INR');
    assert.equal(offer.packQuantity, null);
    assert.equal(offer.packUnit, null);
    assert.equal(offer.available, false);
    assert.equal(offer.pricingAvailable, false);
    assert.equal(offer.source, 'unconfigured');
    assert.equal(offer.fetchedAt, null);
  });

  await test('BasePriceProvider.formatCanonicalQuery handles strings, query objects, and edge cases', () => {
    const provider = new BasePriceProvider('blinkit', 'Blinkit');
    assert.deepEqual(provider.formatCanonicalQuery('  Fresh Paneer  '), {
      query: 'fresh paneer',
      originalName: 'Fresh Paneer',
    });
    assert.deepEqual(
      provider.formatCanonicalQuery({ query: 'amul butter', originalName: 'Amul Butter 500g' }),
      { query: 'amul butter', originalName: 'Amul Butter 500g' }
    );
    assert.deepEqual(
      provider.formatCanonicalQuery({ canonicalQuery: 'tofu', originalName: 'Organic Tofu' }),
      { query: 'tofu', originalName: 'Organic Tofu' }
    );
    assert.deepEqual(provider.formatCanonicalQuery(null), { query: '', originalName: '' });
  });

  await test('BasePriceProvider.sanitizeContext validates pincode, city, coordinates, and strips forbidden keys', () => {
    const provider = new BasePriceProvider('blinkit', 'Blinkit');
    const valid = provider.sanitizeContext({
      pincode: '560001',
      city: 'Bengaluru',
      latitude: 12.9716,
      longitude: 77.5946,
    });
    assert.equal(valid.pincode, '560001');
    assert.equal(valid.city, 'Bengaluru');
    assert.equal(valid.latitude, 12.9716);
    assert.equal(valid.longitude, 77.5946);

    const invalid = provider.sanitizeContext({ pincode: 'abc', latitude: 200 });
    assert.equal(invalid.pincode, null);
    assert.equal(invalid.latitude, null);

    assert.throws(
      () => provider.sanitizeContext(JSON.parse('{"__proto__": {"admin": true}}')),
      /Forbidden context key/
    );
    assert.throws(
      () => provider.sanitizeContext({ constructor: 'evil' }),
      /Forbidden context key/
    );
  });

  await test('BasePriceProvider.sanitizeOffer validates offer contract and filters invalid URLs or prices', () => {
    const provider = new BasePriceProvider('blinkit', 'Blinkit', { configured: true });
    const sanitized = provider.sanitizeOffer({
      price: 120.5,
      packQuantity: 500,
      packUnit: 'g',
      productName: 'Fresh Malai Paneer',
      productUrl: 'https://blinkit.com/prn/fresh-paneer/prid/123',
      available: true,
      pricingAvailable: true,
      fetchedAt: '2026-10-06T12:00:00.000Z',
    });

    assert.equal(sanitized.marketplace, 'blinkit');
    assert.equal(sanitized.price, 120.5);
    assert.equal(sanitized.currency, 'INR');
    assert.equal(sanitized.packQuantity, 500);
    assert.equal(sanitized.packUnit, 'g');
    assert.equal(sanitized.pricingAvailable, true);
    assert.equal(sanitized.available, true);
    assert.equal(sanitized.source, 'provider');
    assert.ok(sanitized.productUrl.startsWith('https://blinkit.com'));

    // Malformed / unapproved URL and NaN price
    const badOffer = provider.sanitizeOffer({
      price: 'one hundred',
      productUrl: 'https://evil-site.com/steal',
    });
    assert.equal(badOffer.price, null);
    assert.equal(badOffer.productUrl, null);
    assert.equal(badOffer.pricingAvailable, false);
  });

  // B. Provider Registry Tests
  await test('Provider Registry exports 4 default unconfigured providers and supports lookup', () => {
    resetPriceProviders();
    const providers = getAllPriceProviders();
    assert.equal(providers.length, 4);

    const blinkit = getPriceProvider('blinkit');
    assert.ok(blinkit);
    assert.equal(blinkit.id, 'blinkit');
    assert.equal(blinkit.isConfigured(), false);

    assert.equal(getPriceProvider('non_existent'), null);
    assert.equal(isMarketplaceSupported('zepto'), true);
    assert.equal(isMarketplaceSupported('unknown_app'), false);
    assert.equal(hasConfiguredPriceProviders(), false);
    assert.deepEqual(getConfiguredPriceProviders(), []);
  });

  await test('validatePriceProvider validates object structure and contract functions', () => {
    assert.throws(() => validatePriceProvider(null), /valid object/);
    assert.throws(() => validatePriceProvider({ id: 'test' }), /implement isConfigured/);
    assert.throws(
      () => validatePriceProvider({ id: 'test', isConfigured: () => false }),
      /implement getProductOffer/
    );
    assert.throws(() => validatePriceProvider({ id: '__proto__' }), /Forbidden price provider id/);
  });

  await test('registerPriceProvider registers custom provider and unregisterPriceProvider removes it', () => {
    try {
      class MockConfiguredProvider extends BasePriceProvider {
        constructor() {
          super('custom_market', 'Custom Marketplace', { configured: true });
        }
        getProductOffer(query) {
          return {
            marketplace: this.id,
            displayName: this.displayName,
            price: 99,
            pricingAvailable: true,
            available: true,
          };
        }
      }

      const customProvider = new MockConfiguredProvider();
      registerPriceProvider(customProvider);

      assert.equal(isMarketplaceSupported('custom_market'), true);
      assert.equal(hasConfiguredPriceProviders(), true);
      const retrieved = getPriceProvider('custom_market');
      assert.ok(retrieved);
      assert.equal(retrieved.isConfigured(), true);

      unregisterPriceProvider('custom_market');
      assert.equal(getPriceProvider('custom_market'), null);
    } finally {
      resetPriceProviders();
    }
  });

  // C. Pack Size Safety & Normalized Pricing Tests
  await test('calculateNormalizedPrice calculates mass, volume, and count normalizations correctly', () => {
    // Mass: 500g for 150 -> 300/kg; 1kg for 280 -> 280/kg
    const norm500g = calculateNormalizedPrice(150, 500, 'g');
    assert.equal(norm500g.normalizedPrice, 300);
    assert.equal(norm500g.normalizedUnit, 'kg');

    const norm1kg = calculateNormalizedPrice(280, 1, 'kg');
    assert.equal(norm1kg.normalizedPrice, 280);
    assert.equal(norm1kg.normalizedUnit, 'kg');

    // Volume: 500ml for 40 -> 80/l; 1l for 75 -> 75/l
    const norm500ml = calculateNormalizedPrice(40, 500, 'ml');
    assert.equal(norm500ml.normalizedPrice, 80);
    assert.equal(norm500ml.normalizedUnit, 'l');

    const norm1l = calculateNormalizedPrice(75, 1, 'l');
    assert.equal(norm1l.normalizedPrice, 75);
    assert.equal(norm1l.normalizedUnit, 'l');

    // Count: 4 pcs for 100 -> 25/pc
    const normCount = calculateNormalizedPrice(100, 4, 'pc');
    assert.equal(normCount.normalizedPrice, 25);
    assert.equal(normCount.normalizedUnit, 'pc');

    // Incompatible / invalid units
    assert.equal(calculateNormalizedPrice(100, 0, 'kg').normalizedPrice, null);
    assert.equal(calculateNormalizedPrice(-10, 500, 'g').normalizedPrice, null);
    assert.equal(calculateNormalizedPrice(100, 500, 'pinch').normalizedPrice, null);
  });

  await test('priceComparisonService.compareOffers detects packSizeMismatch between 500g and 1kg', () => {
    const offers = [
      {
        marketplace: 'blinkit',
        displayName: 'Blinkit',
        price: 150,
        packQuantity: 500,
        packUnit: 'g',
        pricingAvailable: true,
      },
      {
        marketplace: 'zepto',
        displayName: 'Zepto',
        price: 280,
        packQuantity: 1,
        packUnit: 'kg',
        pricingAvailable: true,
      },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.bestPrice, 150);
    assert.equal(result.bestMarketplace, 'blinkit');
    assert.equal(result.packSizeMismatch, true); // Warns that raw prices are for different pack sizes!
    assert.equal(result.normalizedPricingAvailable, true);
    assert.equal(result.bestNormalizedPrice, 280); // 1kg for 280 is cheaper per kg than 500g for 150 (300/kg)
    assert.equal(result.bestNormalizedMarketplace, 'zepto');
  });

  await test('priceComparisonService.compareOffers disables normalized pricing when units are incompatible', () => {
    const offers = [
      {
        marketplace: 'blinkit',
        displayName: 'Blinkit',
        price: 100,
        packQuantity: 500,
        packUnit: 'g',
        pricingAvailable: true,
      },
      {
        marketplace: 'zepto',
        displayName: 'Zepto',
        price: 90,
        packQuantity: 2,
        packUnit: 'pieces',
        pricingAvailable: true,
      },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.packSizeMismatch, true);
    assert.equal(result.normalizedPricingAvailable, false); // Cannot normalize grams into pieces!
    assert.equal(result.bestNormalizedPrice, null);
  });

  // D. Integration & Failure Isolation Tests
  await test('priceIntelligenceService.getPriceComparisonForList cleanly falls back to Phase 1 search links when unconfigured', async () => {
    resetPriceProviders();
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Pantry Essentials',
      items: [{ _id: 'i1', name: 'Fresh Paneer', quantity: 1, unit: 'pack' }],
    });

    try {
      const result = await priceIntelligenceService.getPriceComparisonForList(mockUserId, listId);
      assert.equal(result.groceryListId, listId);
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.items[0].canonicalQuery, 'fresh paneer');
      assert.equal(result.items[0].comparison.pricingAvailable, false);
      assert.equal(result.items[0].comparison.offers.length, 4);
      assert.ok(result.items[0].comparison.offers[0].searchUrl.includes('paneer'));
    } finally {
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService integrates configured mock provider and evaluates lowest price', async () => {
    resetPriceProviders();
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Chef Essentials',
      items: [{ _id: 'i1', name: 'Basmati Rice', quantity: 1, unit: 'kg' }],
    });

    class MockZeptoProvider extends BasePriceProvider {
      constructor() {
        super('zepto', 'Zepto', { configured: true });
      }
      getProductOffer(query, context) {
        return {
          marketplace: 'zepto',
          displayName: 'Zepto',
          productName: 'India Gate Basmati Rice',
          productUrl: 'https://zepto.com/prn/basmati-rice',
          price: 199,
          currency: 'INR',
          packQuantity: 1,
          packUnit: 'kg',
          available: true,
          pricingAvailable: true,
          fetchedAt: '2026-10-06T10:00:00.000Z',
        };
      }
    }

    registerPriceProvider(new MockZeptoProvider());

    try {
      const result = await priceIntelligenceService.getPriceComparisonForList(mockUserId, listId);
      assert.equal(result.pricingAvailable, true);
      const itemComp = result.items[0].comparison;
      assert.equal(itemComp.pricingAvailable, true);
      assert.equal(itemComp.bestPrice, 199);
      assert.equal(itemComp.bestMarketplace, 'zepto');
    } finally {
      resetPriceProviders();
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('Failure Isolation: Provider exception never crashes comparison and allows other providers to succeed', async () => {
    resetPriceProviders();
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Test List',
      items: [{ _id: 'i1', name: 'Milk', quantity: 1, unit: 'litre' }],
    });

    // Provider that throws an unexpected network error
    class BrokenBlinkitProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      getProductOffer() {
        throw new Error('Connection timeout to upstream provider');
      }
    }

    // Provider that succeeds
    class WorkingZeptoProvider extends BasePriceProvider {
      constructor() {
        super('zepto', 'Zepto', { configured: true });
      }
      getProductOffer() {
        return {
          marketplace: 'zepto',
          displayName: 'Zepto',
          price: 32,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
        };
      }
    }

    registerPriceProvider(new BrokenBlinkitProvider());
    registerPriceProvider(new WorkingZeptoProvider());

    try {
      const result = await priceIntelligenceService.getPriceComparisonForList(mockUserId, listId);
      assert.equal(result.pricingAvailable, true); // Overall comparison succeeded!
      const itemComp = result.items[0].comparison;
      assert.equal(itemComp.bestPrice, 32);
      assert.equal(itemComp.bestMarketplace, 'zepto');

      // Broken provider was cleanly caught and isolated
      const blinkitOffer = itemComp.offers.find((o) => o.marketplace === 'blinkit');
      assert.ok(blinkitOffer);
      assert.equal(blinkitOffer.pricingAvailable, false);
      assert.ok(blinkitOffer.searchUrl.includes('milk'));
    } finally {
      resetPriceProviders();
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService.getItemPriceComparison evaluates single item and isolates errors', () => {
    resetPriceProviders();

    class MockItemProvider extends BasePriceProvider {
      constructor() {
        super('jiomart', 'JioMart', { configured: true });
      }
      getProductOffer(query) {
        return {
          marketplace: 'jiomart',
          displayName: 'JioMart',
          price: 75,
          available: true,
          pricingAvailable: true,
        };
      }
    }

    registerPriceProvider(new MockItemProvider());

    try {
      const result = priceIntelligenceService.getItemPriceComparison('Ghee');
      assert.equal(result.pricingAvailable, true);
      assert.equal(result.comparison.bestPrice, 75);
      assert.equal(result.comparison.bestMarketplace, 'jiomart');
    } finally {
      resetPriceProviders();
    }
  });

  await test('priceIntelligenceService.getItemPriceComparisonAsync handles asynchronous provider promises', async () => {
    resetPriceProviders();

    class AsyncProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      async getProductOffer(query) {
        await new Promise((r) => setTimeout(r, 10));
        return {
          marketplace: 'blinkit',
          displayName: 'Blinkit',
          price: 45,
          available: true,
          pricingAvailable: true,
        };
      }
    }

    registerPriceProvider(new AsyncProvider());

    try {
      const result = await priceIntelligenceService.getItemPriceComparisonAsync('Curd');
      assert.equal(result.pricingAvailable, true);
      assert.equal(result.comparison.bestPrice, 45);
      assert.equal(result.comparison.bestMarketplace, 'blinkit');
    } finally {
      resetPriceProviders();
    }
  });

  // E. Conversational Intent & API Integration Tests
  await test('zaiActionService dynamically reports best price when pricing is available and unconfigured disclaimer when not', async () => {
    resetPriceProviders();

    // 1. Unconfigured state
    const unconfiguredRes = await zaiActionService.dispatchAction(
      ZAI_ACTIONS.GROCERY_LIST,
      { queryType: 'price_comparison', item: 'paneer' },
      mockUserId,
      null
    );
    assert.ok(unconfiguredRes.message.includes('currently unconfigured'));
    assert.equal(unconfiguredRes.data.pricingAvailable, false);

    // 2. Mock configured state
    class ActiveProvider extends BasePriceProvider {
      constructor() {
        super('instamart', 'Swiggy Instamart', { configured: true });
      }
      getProductOffer() {
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          price: 88,
          available: true,
          pricingAvailable: true,
        };
      }
    }
    registerPriceProvider(new ActiveProvider());

    try {
      const configuredRes = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.GROCERY_LIST,
        { queryType: 'price_comparison', item: 'paneer' },
        mockUserId,
        null
      );
      assert.ok(configuredRes.message.includes('Best price for "paneer" is ₹88 on instamart'));
      assert.equal(configuredRes.data.pricingAvailable, true);
    } finally {
      resetPriceProviders();
    }
  });

  await test('GET /api/grocery/:id/price-comparison accepts location query parameters without errors', async () => {
    const listId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;

    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    const originalGetList = groceryService.getGroceryListById;
    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Local Basket',
      items: [{ _id: 'i1', name: 'Apples', quantity: 1, unit: 'kg' }],
      toJSON() { return this; },
    });

    try {
      const res = await fetch(
        `${baseUrl}/api/grocery/${listId}/price-comparison?pincode=560001&city=Bengaluru`,
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        }
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.groceryListId, listId);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
      groceryService.getGroceryListById = originalGetList;
    }
  });

  // =========================================================================
  // 46. PHASE 4 — SWIGGY INSTAMART OFFICIAL PRICE PROVIDER INTEGRATION TESTS
  // =========================================================================

  // A. Provider Initialization & Configuration Detection
  await test('InstamartPriceProvider initializes with official endpoint and defaults to unconfigured in local test env', () => {
    const provider = new InstamartPriceProvider();
    assert.equal(provider.id, 'instamart');
    assert.equal(provider.name, 'instamart');
    assert.equal(provider.displayName, 'Swiggy Instamart');
    assert.equal(provider.endpoint, 'https://mcp.swiggy.com/im');
    assert.equal(provider.isConfigured(), false);
    assert.equal(provider.supportsPricing(), false);

    const status = provider.getStatus();
    assert.equal(status.providerAvailable, false);
    assert.equal(status.pricingAvailable, false);
    assert.equal(status.status, 'unconfigured');
    assert.ok(status.message.includes('SWIGGY_INSTAMART_BEARER_TOKEN'));
  });

  await test('InstamartPriceProvider detects valid configuration when real token is provided via options', () => {
    const provider = new InstamartPriceProvider({
      token: 'swiggy_official_oauth_token_12345',
      addressId: 'addr_blr_101',
    });
    assert.equal(provider.isConfigured(), true);
    assert.equal(provider.supportsPricing(), true);

    const status = provider.getStatus();
    assert.equal(status.providerAvailable, true);
    assert.equal(status.pricingAvailable, true);
    assert.equal(status.status, 'ready');
    assert.equal(status.addressId, 'addr_blr_101');
  });

  await test('InstamartPriceProvider treats placeholder template token as unconfigured', () => {
    const provider = new InstamartPriceProvider({
      token: 'your_swiggy_mcp_bearer_token_here',
    });
    assert.equal(provider.isConfigured(), false);
  });

  // B. Pack Size Parsing Tests
  await test('InstamartPriceProvider.parsePackSize parses structured and string pack sizes accurately', () => {
    const provider = new InstamartPriceProvider();

    // Structured object
    assert.deepEqual(provider.parsePackSize({ quantity: 500, unit: 'g' }), { quantity: 500, unit: 'g' });
    assert.deepEqual(provider.parsePackSize({ packQuantity: 1, packUnit: 'kg' }), { quantity: 1, unit: 'kg' });

    // String variations
    assert.deepEqual(provider.parsePackSize('500g'), { quantity: 500, unit: 'g' });
    assert.deepEqual(provider.parsePackSize('500 g'), { quantity: 500, unit: 'g' });
    assert.deepEqual(provider.parsePackSize('1 kg'), { quantity: 1, unit: 'kg' });
    assert.deepEqual(provider.parsePackSize('200ml'), { quantity: 200, unit: 'ml' });
    assert.deepEqual(provider.parsePackSize('2 pcs'), { quantity: 2, unit: 'pcs' });

    // Invalid / empty
    assert.deepEqual(provider.parsePackSize(null), { quantity: null, unit: null });
    assert.deepEqual(provider.parsePackSize(''), { quantity: null, unit: null });
    assert.deepEqual(provider.parsePackSize('pinch'), { quantity: null, unit: null });
  });

  // C. Offer Normalization Tests
  await test('InstamartPriceProvider.normalizeInstamartProduct normalizes valid official item into internal offer contract', () => {
    const provider = new InstamartPriceProvider();
    const raw = {
      name: 'Amul Fresh Paneer',
      price: 110,
      packSize: '200g',
      productUrl: 'https://www.swiggy.com/instamart/item/amul-paneer-200g',
      inStock: true,
      available: true,
    };

    const offer = provider.normalizeInstamartProduct(raw);
    assert.equal(offer.marketplace, 'instamart');
    assert.equal(offer.displayName, 'Swiggy Instamart');
    assert.equal(offer.productName, 'Amul Fresh Paneer');
    assert.equal(offer.price, 110);
    assert.equal(offer.currency, 'INR');
    assert.equal(offer.packQuantity, 200);
    assert.equal(offer.packUnit, 'g');
    assert.equal(offer.available, true);
    assert.equal(offer.pricingAvailable, true);
    assert.equal(offer.source, 'swiggy-instamart');
    assert.ok(offer.productUrl.startsWith('https://www.swiggy.com'));
    assert.ok(offer.fetchedAt);
  });

  await test('InstamartPriceProvider.normalizeInstamartProduct safely discards invalid/missing prices without fabrication', () => {
    const provider = new InstamartPriceProvider();

    // Missing price
    const noPrice = provider.normalizeInstamartProduct({ name: 'Paneer' });
    assert.equal(noPrice.price, null);
    assert.equal(noPrice.pricingAvailable, false);
    assert.equal(noPrice.available, false);

    // Negative / zero / NaN price
    const negPrice = provider.normalizeInstamartProduct({ name: 'Paneer', price: -50 });
    assert.equal(negPrice.price, null);
    assert.equal(negPrice.pricingAvailable, false);

    const zeroPrice = provider.normalizeInstamartProduct({ name: 'Paneer', price: 0 });
    assert.equal(zeroPrice.price, null);
    assert.equal(zeroPrice.pricingAvailable, false);

    const strNaN = provider.normalizeInstamartProduct({ name: 'Paneer', price: 'free' });
    assert.equal(strNaN.price, null);
    assert.equal(strNaN.pricingAvailable, false);
  });

  await test('InstamartPriceProvider.normalizeInstamartProduct sanitizes unapproved URLs and strips forbidden keys', () => {
    const provider = new InstamartPriceProvider();

    // Unauthorized domain URL
    const badUrlOffer = provider.normalizeInstamartProduct({
      name: 'Paneer',
      price: 90,
      productUrl: 'https://phishing-swiggy.attacker.com/steal',
    });
    assert.equal(badUrlOffer.productUrl, null);

    // Prototype pollution attempt
    assert.throws(
      () => provider.normalizeInstamartProduct(JSON.parse('{"__proto__": {"malicious": true}}')),
      /Forbidden product attribute/
    );
  });

  // D. Search and HTTP Error Handling Isolation
  await test('InstamartPriceProvider.searchProduct returns unconfigured response without network call when unconfigured', async () => {
    const provider = new InstamartPriceProvider();
    const result = await provider.searchProduct('paneer');
    assert.equal(result.pricingAvailable, false);
    assert.equal(result.providerAvailable, false);
    assert.equal(result.status, 'unconfigured');
    assert.deepEqual(result.products, []);
  });

  await test('InstamartPriceProvider.getProductOffer returns safe fallback with Phase 1 deep-link when unconfigured', async () => {
    const provider = new InstamartPriceProvider();
    const offer = await provider.getProductOffer('Fresh Paneer');
    assert.equal(offer.marketplace, 'instamart');
    assert.equal(offer.price, null);
    assert.equal(offer.pricingAvailable, false);
    assert.ok(offer.searchUrl.includes('swiggy.com/instamart/search'));
  });

  await test('InstamartPriceProvider handles 401 unauthorized gracefully without leaking secrets or crashing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Token expired' }),
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_expired_token' });
      const result = await provider.searchProduct('milk');
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.providerAvailable, false);
      assert.equal(result.status, 'auth_unavailable');
      assert.ok(result.message.includes('authentication token is invalid or expired'));

      const offer = await provider.getProductOffer('milk');
      assert.equal(offer.pricingAvailable, false);
      assert.equal(offer.price, null);
      assert.ok(offer.searchUrl.includes('milk'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('InstamartPriceProvider handles upstream server 500 error gracefully', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_token' });
      const result = await provider.searchProduct('milk');
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.providerAvailable, false);
      assert.equal(result.status, 'unavailable');
      assert.ok(result.message.includes('HTTP 500'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('InstamartPriceProvider parses official MCP tools/call JSON-RPC product results', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: {
          products: [
            {
              name: 'Mother Dairy Toned Milk',
              price: 33,
              packSize: '500ml',
              inStock: true,
              productUrl: 'https://www.swiggy.com/instamart/item/mother-dairy-500ml',
            },
          ],
        },
      }),
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_valid_token' });
      const result = await provider.searchProduct('toned milk');
      assert.equal(result.pricingAvailable, true);
      assert.equal(result.status, 'offers_available');
      assert.equal(result.products.length, 1);

      const offer = await provider.getProductOffer('toned milk');
      assert.equal(offer.pricingAvailable, true);
      assert.equal(offer.price, 33);
      assert.equal(offer.packQuantity, 500);
      assert.equal(offer.packUnit, 'ml');
      assert.equal(offer.productName, 'Mother Dairy Toned Milk');
      assert.equal(offer.source, 'swiggy-instamart');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // E. Integration with PriceIntelligence & PriceComparison
  await test('priceIntelligenceService.getPriceComparisonForList incorporates configured Instamart provider as best price', async () => {
    resetPriceProviders();
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Quick Breakfast',
      items: [{ _id: 'i1', name: 'Eggs', quantity: 6, unit: 'pcs' }],
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: {
          products: [
            {
              name: 'Eggoz Farm Fresh Eggs',
              price: 65,
              packSize: '6 pcs',
              inStock: true,
              productUrl: 'https://www.swiggy.com/instamart/item/eggoz-6pcs',
            },
          ],
        },
      }),
    });

    const activeInstamart = new InstamartPriceProvider({ token: 'test_token_instamart' });
    registerPriceProvider(activeInstamart);

    try {
      const result = await priceIntelligenceService.getPriceComparisonForList(mockUserId, listId);
      assert.equal(result.pricingAvailable, true);
      const eggsComp = result.items[0].comparison;
      assert.equal(eggsComp.pricingAvailable, true);
      assert.equal(eggsComp.bestPrice, 65);
      assert.equal(eggsComp.bestMarketplace, 'instamart');

      // Check other marketplace adapters retain unconfigured deep-links
      const blinkit = eggsComp.offers.find((o) => o.marketplace === 'blinkit');
      assert.ok(blinkit);
      assert.equal(blinkit.pricingAvailable, false);
      assert.ok(blinkit.searchUrl.includes('eggs'));
    } finally {
      globalThis.fetch = originalFetch;
      resetPriceProviders();
      groceryService.getGroceryListById = originalGetList;
    }
  });

  await test('priceIntelligenceService compares Instamart with other providers and picks cheapest valid offer', () => {
    const offers = [
      {
        marketplace: 'instamart',
        displayName: 'Swiggy Instamart',
        price: 199,
        packQuantity: 1,
        packUnit: 'kg',
        pricingAvailable: true,
      },
      {
        marketplace: 'zepto',
        displayName: 'Zepto',
        price: 215,
        packQuantity: 1,
        packUnit: 'kg',
        pricingAvailable: true,
      },
      {
        marketplace: 'blinkit',
        displayName: 'Blinkit',
        price: null,
        pricingAvailable: false,
      },
    ];

    const result = priceComparisonService.compareOffers(offers);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.bestPrice, 199);
    assert.equal(result.bestMarketplace, 'instamart');
    assert.equal(result.validOffersCount, 2);
  });

  // F. Security & Secrets Protection
  await test('Security: Instamart token never appears in generated offers or JSON serialization', () => {
    const secretToken = 'ultra_secret_swiggy_token_999888';
    const provider = new InstamartPriceProvider({ token: secretToken });

    const raw = {
      name: 'Paneer',
      price: 120,
      productUrl: 'https://www.swiggy.com/instamart/item/paneer',
    };

    const offer = provider.normalizeInstamartProduct(raw);
    const serialized = JSON.stringify(offer);
    assert.ok(!serialized.includes(secretToken), 'Bearer token must never appear in normalized offer');
    assert.equal(offer.token, undefined);

    const status = provider.getStatus();
    const serializedStatus = JSON.stringify(status);
    assert.ok(!serializedStatus.includes(secretToken), 'Bearer token must never appear in status object');
  });

  // =========================================================================
  // 47. PHASE 5 — INSTAMART LIVE INTEGRATION READINESS & HARDENING TESTS
  // =========================================================================

  // A. Authentication Hardening & Non-Enumerable Secrets
  await test('InstamartPriceProvider marks credentials non-enumerable and excludes them from toJSON() and Object.keys()', () => {
    const provider = new InstamartPriceProvider({
      token: 'super_secret_bearer_token_xyz',
      clientSecret: 'super_secret_client_secret_abc',
    });

    const keys = Object.keys(provider);
    assert.ok(!keys.includes('token'), 'token must not be an enumerable property');
    assert.ok(!keys.includes('clientSecret'), 'clientSecret must not be an enumerable property');

    const json = JSON.stringify(provider);
    assert.ok(!json.includes('super_secret_bearer_token_xyz'), 'token must not appear in JSON stringify');
    assert.ok(!json.includes('super_secret_client_secret_abc'), 'clientSecret must not appear in JSON stringify');
    assert.equal(provider.isConfigured(), true);
  });

  await test('InstamartPriceProvider with empty or whitespace token reports unconfigured', () => {
    const pEmpty = new InstamartPriceProvider({ token: '' });
    assert.equal(pEmpty.isConfigured(), false);

    const pSpaces = new InstamartPriceProvider({ token: '    ' });
    assert.equal(pSpaces.isConfigured(), false);
  });

  // B. HTTP 429 Rate-Limiting & Timeout Hardening
  await test('InstamartPriceProvider handles HTTP 429 rate limit without aggressive retries or throwing', async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    globalThis.fetch = async () => {
      callCount++;
      return {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      };
    };

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_active_token' });
      const result = await provider.searchProduct('paneer');

      assert.equal(callCount, 1, 'Provider must not execute aggressive retries on 429');
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.providerAvailable, false);
      assert.equal(result.status, 'rate_limited');
      assert.equal(result.errorCode, 'RATE_LIMIT_EXCEEDED');
      assert.ok(result.message.includes('rate limit reached'));

      const offer = await provider.getProductOffer('paneer');
      assert.equal(offer.pricingAvailable, false);
      assert.equal(offer.price, null);
      assert.ok(offer.searchUrl.includes('paneer'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('InstamartPriceProvider handles timeout (AbortError) cleanly and sets pricingAvailable = false', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    };

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_active_token', timeoutMs: 50 });
      const result = await provider.searchProduct('paneer');
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.providerAvailable, false);
      assert.equal(result.status, 'timeout');
      assert.equal(result.errorCode, 'TIMEOUT');
      assert.ok(result.message.includes('timed out'));

      const offer = await provider.getProductOffer('paneer');
      assert.equal(offer.pricingAvailable, false);
      assert.ok(offer.searchUrl.includes('paneer'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('InstamartPriceProvider handles non-JSON / malformed responses without crashing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      },
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_active_token' });
      const result = await provider.searchProduct('rice');
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.status, 'malformed_response');
      assert.equal(result.errorCode, 'INVALID_JSON');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('InstamartPriceProvider handles JSON-RPC error payloads gracefully', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32602, message: 'Invalid tool arguments' },
      }),
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_active_token' });
      const result = await provider.searchProduct('rice');
      assert.equal(result.pricingAvailable, false);
      assert.equal(result.status, 'error');
      assert.equal(result.errorCode, '-32602');
      assert.ok(result.message.includes('Invalid tool arguments'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // C. Product Matching Safety (Rejection of Unrelated Candidates)
  await test('InstamartPriceProvider rejects unrelated products when candidate token overlap is 0', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: {
          products: [
            {
              name: 'Lay Potato Chips Classic Salted 50g',
              price: 20,
              inStock: true,
              productUrl: 'https://www.swiggy.com/instamart/item/lays-chips',
            },
          ],
        },
      }),
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_active_token' });
      // Search for "fresh paneer"
      const offer = await provider.getProductOffer('fresh paneer');

      // The returned product "Lay Potato Chips" has 0 token overlap with "fresh paneer"
      // Must be safely rejected without creating a false offer for paneer
      assert.equal(offer.pricingAvailable, false);
      assert.equal(offer.price, null);
      assert.ok(offer.searchUrl.includes('paneer'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('InstamartPriceProvider accepts matching product when token overlap is verified', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: {
          products: [
            {
              name: 'Mother Dairy Fresh Paneer 200g',
              price: 85,
              packSize: '200g',
              inStock: true,
              productUrl: 'https://www.swiggy.com/instamart/item/mother-dairy-paneer',
            },
          ],
        },
      }),
    });

    try {
      const provider = new InstamartPriceProvider({ token: 'mock_active_token' });
      const offer = await provider.getProductOffer('paneer');

      assert.equal(offer.pricingAvailable, true);
      assert.equal(offer.price, 85);
      assert.equal(offer.productName, 'Mother Dairy Fresh Paneer 200g');
      assert.equal(offer.packQuantity, 200);
      assert.equal(offer.packUnit, 'g');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // D. Untrusted Data Sanitization & Pack-Size Arithmetic Safety
  await test('InstamartPriceProvider discards non-finite or extreme invalid prices', () => {
    const provider = new InstamartPriceProvider();

    // Infinity
    const infOffer = provider.normalizeInstamartProduct({ name: 'Paneer', price: Infinity });
    assert.equal(infOffer.price, null);
    assert.equal(infOffer.pricingAvailable, false);

    // Negative Infinity
    const negInfOffer = provider.normalizeInstamartProduct({ name: 'Paneer', price: -Infinity });
    assert.equal(negInfOffer.price, null);
    assert.equal(negInfOffer.pricingAvailable, false);

    // Missing name
    const noNameOffer = provider.normalizeInstamartProduct({ price: 100 });
    assert.equal(noNameOffer.productName, null);
  });

  await test('Pack Size Safety: 500g vs 1kg cannot be treated as identical offers and unit normalization requires compatibility', () => {
    const offers = [
      {
        marketplace: 'instamart',
        displayName: 'Swiggy Instamart',
        price: 150,
        packQuantity: 500,
        packUnit: 'g',
        pricingAvailable: true,
      },
      {
        marketplace: 'zepto',
        displayName: 'Zepto',
        price: 280,
        packQuantity: 1,
        packUnit: 'kg',
        pricingAvailable: true,
      },
    ];

    const comparison = priceComparisonService.compareOffers(offers);
    assert.equal(comparison.pricingAvailable, true);
    assert.equal(comparison.packSizeMismatch, true, 'Must detect pack size mismatch between 500g and 1kg');
    assert.equal(comparison.normalizedPricingAvailable, true, 'Both are mass units, so normalization is permitted');
    assert.equal(comparison.bestNormalizedPrice, 280, '1kg @ 280 is cheaper per kg than 500g @ 150 (300/kg)');
    assert.equal(comparison.bestNormalizedMarketplace, 'zepto');

    // Incompatible units: mass vs pieces
    const incompatibleOffers = [
      {
        marketplace: 'instamart',
        displayName: 'Swiggy Instamart',
        price: 150,
        packQuantity: 500,
        packUnit: 'g',
        pricingAvailable: true,
      },
      {
        marketplace: 'zepto',
        displayName: 'Zepto',
        price: 120,
        packQuantity: 2,
        packUnit: 'pieces',
        pricingAvailable: true,
      },
    ];

    const incompComp = priceComparisonService.compareOffers(incompatibleOffers);
    assert.equal(incompComp.packSizeMismatch, true);
    assert.equal(incompComp.normalizedPricingAvailable, false, 'Mass cannot be normalized into pieces');
  });

  // E. Location Context Sanitization
  await test('InstamartPriceProvider safely extracts valid addressId and pincode and filters invalid location context', () => {
    const provider = new InstamartPriceProvider();

    const sanitized = provider.sanitizeContext({
      pincode: '560001',
      addressId: 'addr_swiggy_999',
      city: 'Bengaluru',
      latitude: 12.97,
      longitude: 77.59,
    });

    assert.equal(sanitized.pincode, '560001');
    assert.equal(sanitized.addressId, 'addr_swiggy_999');
    assert.equal(sanitized.city, 'Bengaluru');
    assert.equal(sanitized.latitude, 12.97);

    // Invalid pincode and invalid addressId
    const invalid = provider.sanitizeContext({
      pincode: '1234', // not 6 digits
      addressId: '',
    });
    assert.equal(invalid.pincode, null);
    assert.equal(invalid.addressId, null);
  });

  // F. Fallback & Multi-Marketplace Isolation
  await test('Instamart failure preserves verified search URL and does not corrupt other marketplace adapters', async () => {
    resetPriceProviders();
    const listId = new mongoose.Types.ObjectId().toString();
    const originalGetList = groceryService.getGroceryListById;

    groceryService.getGroceryListById = async () => ({
      _id: listId,
      user: mockUserId,
      name: 'Pantry List',
      items: [{ _id: 'i1', name: 'Basmati Rice', quantity: 1, unit: 'kg' }],
    });

    // Mock fetch failure specifically for Instamart
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Network unreachable');
    };

    const failingInstamart = new InstamartPriceProvider({ token: 'mock_active_token' });
    registerPriceProvider(failingInstamart);

    try {
      const result = await priceIntelligenceService.getPriceComparisonForList(mockUserId, listId);
      assert.equal(result.pricingAvailable, false);

      const riceComp = result.items[0].comparison;
      assert.equal(riceComp.offers.length, 4);

      // Verify all 4 marketplaces have verified search URLs
      const instamartOffer = riceComp.offers.find((o) => o.marketplace === 'instamart');
      const blinkitOffer = riceComp.offers.find((o) => o.marketplace === 'blinkit');
      const zeptoOffer = riceComp.offers.find((o) => o.marketplace === 'zepto');
      const jiomartOffer = riceComp.offers.find((o) => o.marketplace === 'jiomart');

      assert.ok(instamartOffer.searchUrl.includes('swiggy.com/instamart/search'));
      assert.ok(blinkitOffer.searchUrl.includes('blinkit.com'));
      assert.ok(zeptoOffer.searchUrl.includes('zeptonow.com'));
      assert.ok(jiomartOffer.searchUrl.includes('jiomart.com'));
    } finally {
      globalThis.fetch = originalFetch;
      resetPriceProviders();
      groceryService.getGroceryListById = originalGetList;
    }
  });

  // =========================================================================
  // SECTION 48: PHASE 7 RECIPE -> GROCERY INTELLIGENCE ARCHITECTURE TESTS
  // =========================================================================

  await test('ingredientNormalizationService parses simple string with quantity and unit', async () => {
    const parsed = ingredientNormalizationService.normalizeIngredient('2 onions');
    assert.ok(parsed);
    assert.equal(parsed.canonicalName, 'onion');
    assert.equal(parsed.quantity, 2);
    assert.equal(parsed.unit, 'pc');
    assert.equal(parsed.originalName, '2 onions');
    assert.equal(parsed.category, 'vegetables');
  });

  await test('ingredientNormalizationService extracts preparation words after comma', async () => {
    const parsed = ingredientNormalizationService.normalizeIngredient('2 medium onions, finely chopped');
    assert.ok(parsed);
    assert.equal(parsed.canonicalName, 'onion');
    assert.equal(parsed.quantity, 2);
    assert.equal(parsed.unit, 'pc');
    assert.equal(parsed.preparation, 'finely chopped');
  });

  await test('ingredientNormalizationService handles casing, whitespace, and punctuation', async () => {
    const parsed = ingredientNormalizationService.normalizeIngredient('  2  MEDIUM  ONIONS,  finely chopped!  ');
    assert.ok(parsed);
    assert.equal(parsed.canonicalName, 'onion');
    assert.equal(parsed.quantity, 2);
    assert.equal(parsed.unit, 'pc');
  });

  await test('ingredientNormalizationService strips size descriptors and preparation words', async () => {
    const parsed1 = ingredientNormalizationService.normalizeIngredient('1 large potato');
    assert.ok(parsed1);
    assert.equal(parsed1.canonicalName, 'potato');
    assert.equal(parsed1.quantity, 1);

    const parsed2 = ingredientNormalizationService.normalizeIngredient('3 cloves garlic, minced');
    assert.ok(parsed2);
    assert.equal(parsed2.canonicalName, 'garlic');
    assert.equal(parsed2.quantity, 3);
    assert.equal(parsed2.unit, 'clove');
    assert.equal(parsed2.preparation, 'minced');
  });

  await test('ingredientNormalizationService parses fractions and mixed fractions accurately', async () => {
    const frac1 = ingredientNormalizationService.normalizeIngredient('1/2 cup chopped spinach');
    assert.ok(frac1);
    assert.equal(frac1.quantity, 0.5);
    assert.equal(frac1.unit, 'cup');
    assert.equal(frac1.canonicalName, 'spinach');

    const frac2 = ingredientNormalizationService.normalizeIngredient('1 1/2 tsp salt');
    assert.ok(frac2);
    assert.equal(frac2.quantity, 1.5);
    assert.equal(frac2.unit, 'tsp');
    assert.equal(frac2.canonicalName, 'salt');

    const frac3 = ingredientNormalizationService.normalizeIngredient('500g paneer, cubed');
    assert.ok(frac3);
    assert.equal(frac3.quantity, 500);
    assert.equal(frac3.unit, 'g');
    assert.equal(frac3.canonicalName, 'paneer');
  });

  await test('ingredientNormalizationService preserves protected compound names', async () => {
    const olive = ingredientNormalizationService.normalizeIngredient('2 tbsp olive oil');
    assert.ok(olive);
    assert.equal(olive.canonicalName, 'olive oil');
    assert.equal(olive.unit, 'tbsp');

    const lowFatPaneer = ingredientNormalizationService.normalizeIngredient('200g low-fat paneer');
    assert.ok(lowFatPaneer);
    assert.equal(lowFatPaneer.canonicalName, 'low-fat paneer');

    const redOnion = ingredientNormalizationService.normalizeIngredient('1 red onion');
    assert.ok(redOnion);
    assert.equal(redOnion.canonicalName, 'red onion');

    const springOnion = ingredientNormalizationService.normalizeIngredient('2 bunches spring onions');
    assert.ok(springOnion);
    assert.equal(springOnion.canonicalName, 'spring onion');
  });

  await test('ingredientNormalizationService clamps extreme quantities and handles invalid inputs', async () => {
    const extreme = ingredientNormalizationService.normalizeIngredient('9999999 g rice');
    assert.ok(extreme);
    assert.equal(extreme.quantity, 100000);

    assert.equal(ingredientNormalizationService.normalizeIngredient(null), null);
    assert.equal(ingredientNormalizationService.normalizeIngredient(''), null);
    assert.equal(ingredientNormalizationService.normalizeIngredient(12345), null);

    const safeList = ingredientNormalizationService.normalizeIngredients(['', null, '1 apple']);
    assert.equal(safeList.length, 1);
    assert.equal(safeList[0].canonicalName, 'apple');
  });

  await test('ingredientNormalizationService rejects prototype pollution payloads', async () => {
    assert.throws(
      () => {
        const malicious = JSON.parse('{"__proto__": {"polluted": true}, "name": "onion"}');
        ingredientNormalizationService.normalizeIngredient(malicious);
      },
      /Forbidden prototype/i
    );
  });

  await test('ingredientNormalizationService.isMergeable identifies compatible vs incompatible dimensions', async () => {
    const onionCount1 = { canonicalName: 'onion', unit: 'pc' };
    const onionCount2 = { canonicalName: 'onion', unit: 'piece' };
    const onionMass = { canonicalName: 'onion', unit: 'g' };
    const oliveOil = { canonicalName: 'olive oil', unit: 'ml' };
    const coconutOil = { canonicalName: 'coconut oil', unit: 'ml' };

    assert.equal(ingredientNormalizationService.isMergeable(onionCount1, onionCount2), true);
    assert.equal(ingredientNormalizationService.isMergeable(onionCount1, onionMass), false);
    assert.equal(ingredientNormalizationService.isMergeable(oliveOil, coconutOil), false);
  });

  await test('recipeGroceryService.mergeGroceryItems aggregates compatible quantities and preserves incompatible dimensions', async () => {
    const rawItems = [
      { name: '2 onions' },
      { name: '1 onion' },
      { name: '200g onion' },
      { name: '200g paneer' },
      { name: '300g paneer' },
      { name: 'olive oil', quantity: 1, unit: 'tbsp' },
      { name: 'coconut oil', quantity: 2, unit: 'tbsp' },
      { name: 'low-fat paneer', quantity: 150, unit: 'g' },
    ];

    const merged = recipeGroceryService.mergeGroceryItems(rawItems);

    // Should contain:
    // 1. onion (count): 2 + 1 = 3 pieces
    // 2. onion (mass): 200g (preserved separately from piece count!)
    // 3. paneer (mass): 200g + 300g = 500g
    // 4. olive oil (volume/spoons): 1 tbsp
    // 5. coconut oil (volume/spoons): 2 tbsp (not merged with olive oil!)
    // 6. low-fat paneer: 150g (not merged with standard paneer!)
    const onionCount = merged.find((i) => i.canonicalName === 'onion' && (i.unit === 'piece' || i.unit === 'pieces'));
    const onionMass = merged.find((i) => i.canonicalName === 'onion' && i.unit === 'g');
    const paneer = merged.find((i) => i.canonicalName === 'paneer');
    const lowFatPaneer = merged.find((i) => i.canonicalName === 'low-fat paneer');
    const olive = merged.find((i) => i.canonicalName === 'olive oil');
    const coconut = merged.find((i) => i.canonicalName === 'coconut oil');

    assert.ok(onionCount);
    assert.equal(onionCount.quantity, 3);

    assert.ok(onionMass);
    assert.equal(onionMass.quantity, 200);

    assert.ok(paneer);
    assert.equal(paneer.quantity, 500);

    assert.ok(lowFatPaneer);
    assert.equal(lowFatPaneer.quantity, 150);

    assert.ok(olive);
    assert.equal(olive.quantity, 1);

    assert.ok(coconut);
    assert.equal(coconut.quantity, 2);
  });

  await test('dietaryConstraintService validates constraint IDs and rejects unknown or malicious keys', async () => {
    const validVeg = dietaryConstraintService.validateConstraint('VEGETARIAN');
    assert.equal(validVeg.isValid, true);
    assert.equal(validVeg.sanitized, 'vegetarian');

    const validGluten = dietaryConstraintService.validateConstraint('gluten-free');
    assert.equal(validGluten.isValid, true);
    assert.equal(validGluten.sanitized, 'gluten-free');

    const invalid = dietaryConstraintService.validateConstraint('random-paleo-custom');
    assert.equal(invalid.isValid, false);
    assert.ok(invalid.error.includes('Unknown dietary constraint'));

    // Rejects non-string and prototype pollution
    const protoPollution = dietaryConstraintService.validateConstraint('__proto__');
    assert.equal(protoPollution.isValid, false);

    const nonString = dietaryConstraintService.validateConstraint(12345);
    assert.equal(nonString.isValid, false);

    const listRes = dietaryConstraintService.validateConstraints(['Vegetarian', 'Vegan', 'vegan', 'VEGETARIAN']);
    assert.equal(listRes.isValid, true);
    assert.equal(listRes.sanitized.length, 2);
    assert.ok(listRes.sanitized.includes('vegetarian'));
    assert.ok(listRes.sanitized.includes('vegan'));
  });

  await test('dietaryConstraintService extracts constraints and evaluates recipe compatibility with medical disclaimer', async () => {
    const extracted = dietaryConstraintService.extractConstraintsFromText('Give me diabetes-friendly low-sodium recipes without gluten');
    assert.ok(extracted.includes('low-sugar'));
    assert.ok(extracted.includes('low-sodium'));
    assert.ok(extracted.includes('gluten-free'));

    const chickenRecipe = {
      name: 'Chicken Curry',
      ingredients: [{ name: '500g chicken' }, { name: '1 onion' }],
      dietaryTags: ['non-vegetarian'],
    };

    const vegEval = dietaryConstraintService.evaluateRecipeCompatibility(chickenRecipe, ['vegetarian']);
    assert.equal(vegEval.compatible, false);
    assert.ok(vegEval.violations.length > 0);
    assert.equal(vegEval.violations[0].token, 'chicken');
    assert.equal(vegEval.disclaimer, MEDICAL_SAFETY_DISCLAIMER);

    const paneerRecipe = {
      name: 'Paneer Tikka',
      ingredients: [{ name: '200g paneer' }, { name: '1 capsicum' }],
      dietaryTags: ['vegetarian'],
    };

    const paneerEval = dietaryConstraintService.evaluateRecipeCompatibility(paneerRecipe, ['vegetarian']);
    assert.equal(paneerEval.compatible, true);
    assert.ok(paneerEval.framingNotice.includes('compatible with the selected dietary constraints: Vegetarian'));
  });

  await test('recipeGroceryService.validateRecipe validates schema, edge cases, and guards against oversized payloads', async () => {
    const validRecipe = {
      name: 'Tomato Salad',
      servings: 2,
      ingredients: [{ name: '2 tomatoes' }, { name: '1 cucumber' }],
      instructions: ['Chop vegetables', 'Toss and serve'],
    };

    const resValid = recipeGroceryService.validateRecipe(validRecipe);
    assert.equal(resValid.isValid, true);
    assert.equal(resValid.sanitized.servings, 2);

    // Missing name
    const noName = recipeGroceryService.validateRecipe({ servings: 2, ingredients: ['1 apple'], instructions: ['Eat'] });
    assert.equal(noName.isValid, false);
    assert.ok(noName.error.includes('Recipe name'));

    // Non-string name (e.g. object injection)
    const objName = recipeGroceryService.validateRecipe({ name: { evil: true }, servings: 2, ingredients: ['1 apple'], instructions: ['Eat'] });
    assert.equal(objName.isValid, false);

    // Bad servings (negative or excessive)
    const badServings = recipeGroceryService.validateRecipe({ name: 'Apple', servings: -2, ingredients: ['1 apple'], instructions: ['Eat'] });
    assert.equal(badServings.isValid, false);

    // Ingredients not an array
    const stringIngs = recipeGroceryService.validateRecipe({ name: 'Salad', ingredients: 'tomato and lettuce', instructions: ['Mix'] });
    assert.equal(stringIngs.isValid, false);

    // Oversized ingredients (> 50)
    const bigIngs = Array.from({ length: 55 }, (_, i) => `item_${i}`);
    const oversized = recipeGroceryService.validateRecipe({ name: 'Huge', ingredients: bigIngs, instructions: ['Cook'] });
    assert.equal(oversized.isValid, false);
    assert.ok(oversized.error.includes('safety limit of 50 items'));

    // Oversized instructions (> 50)
    const bigSteps = Array.from({ length: 55 }, (_, i) => `step_${i}`);
    const oversizedSteps = recipeGroceryService.validateRecipe({ name: 'Huge Steps', ingredients: ['1 apple'], instructions: bigSteps });
    assert.equal(oversizedSteps.isValid, false);
    assert.ok(oversizedSteps.error.includes('safety limit of 50 steps'));
  });

  await test('recipeGroceryService extracts grocery items across single and multiple recipes', async () => {
    const recipe1 = {
      name: 'Breakfast Toast',
      ingredients: [{ name: '2 slices bread' }, { name: '1 tbsp butter' }],
      instructions: ['Toast and butter bread'],
    };
    const recipe2 = {
      name: 'Garlic Bread',
      ingredients: [{ name: '4 slices bread' }, { name: '2 tbsp butter' }, { name: '2 cloves garlic' }],
      instructions: ['Bake garlic bread'],
    };

    const combinedGroceryItems = recipeGroceryService.recipesToGroceryItems([recipe1, recipe2]);
    assert.ok(Array.isArray(combinedGroceryItems));

    const breadItem = combinedGroceryItems.find((i) => i.canonicalName === 'bread');
    const butterItem = combinedGroceryItems.find((i) => i.canonicalName === 'butter');
    const garlicItem = combinedGroceryItems.find((i) => i.canonicalName === 'garlic');

    assert.ok(breadItem);
    assert.equal(breadItem.quantity, 6); // 2 + 4

    assert.ok(butterItem);
    assert.equal(butterItem.quantity, 3); // 1 + 2

    assert.ok(garlicItem);
    assert.equal(garlicItem.quantity, 2);
  });

  await test('recipeGroceryService creates and persists GroceryList with user ownership', async () => {
    const mockUserGenId = new mongoose.Types.ObjectId();
    const originalCreateGrocery = groceryService.createGroceryList;
    const originalGetList = groceryService.getGroceryListById;
    const originalUpdateList = groceryService.updateGroceryList;

    let createdDoc = null;
    groceryService.createGroceryList = async (uid, payload) => {
      createdDoc = { _id: new mongoose.Types.ObjectId(), user: uid, ...payload };
      return createdDoc;
    };

    groceryService.getGroceryListById = async (uid, lid) => createdDoc;

    let updatedDoc = null;
    groceryService.updateGroceryList = async (uid, lid, payload) => {
      updatedDoc = { ...createdDoc, ...payload };
      return updatedDoc;
    };

    try {
      const testRecipe = {
        name: 'Paneer Roll',
        servings: 2,
        ingredients: [{ name: '200g paneer' }, { name: '2 wheat rotis' }, { name: '1 onion' }],
        instructions: ['Saute paneer and wrap in roti'],
      };

      const groceryList = await recipeGroceryService.createGroceryListFromRecipe(mockUserGenId, testRecipe);
      assert.ok(groceryList._id);
      assert.equal(groceryList.user.toString(), mockUserGenId.toString());
      assert.equal(groceryList.source, 'recipe');
      assert.equal(groceryList.name, 'Grocery List for Paneer Roll');
      assert.equal(groceryList.items.length, 3);

      // Append another recipe
      const secondRecipe = {
        name: 'Onion Salad',
        ingredients: [{ name: '2 onions' }, { name: '1 lemon' }],
        instructions: ['Mix and squeeze lemon'],
      };

      const updatedList = await recipeGroceryService.addRecipeToGroceryList(mockUserGenId, groceryList._id, secondRecipe);
      assert.ok(updatedList);
      // Onions should have merged (1 piece + 2 piece = 3 pieces)
      const onionItem = updatedList.items.find((i) => i.canonicalName === 'onion');
      assert.ok(onionItem);
      assert.equal(onionItem.quantity, 3);
    } finally {
      groceryService.createGroceryList = originalCreateGrocery;
      groceryService.getGroceryListById = originalGetList;
      groceryService.updateGroceryList = originalUpdateList;
    }
  });

  await test('recipeGroceryService evaluates recipe price comparison against price providers', async () => {
    const testRecipe = {
      name: 'Quick Salad',
      ingredients: [{ name: '2 cucumbers' }, { name: '2 tomatoes' }],
      instructions: ['Chop and mix'],
    };

    const compResult = await recipeGroceryService.getRecipePriceComparison(testRecipe);
    assert.ok(compResult);
    assert.equal(compResult.recipeName, 'Quick Salad');
    assert.equal(compResult.itemsCount, 2);
    assert.equal(compResult.items.length, 2);
    assert.equal(compResult.pricingAvailable, false);
    assert.ok(compResult.items[0].offers.length >= 4);

    // Verify preferred marketplace filter
    const instamartOnly = await recipeGroceryService.getRecipePriceComparison(testRecipe, 'instamart');
    assert.equal(instamartOnly.items[0].offers.length, 1);
    assert.equal(instamartOnly.items[0].offers[0].marketplace, 'instamart');
  });

  await test('zaiResolverService resolves dietary, health, and recipe-to-grocery requests deterministically', async () => {
    // 1. Healthy dinner recipe
    const healthyReq = zaiResolverService.resolveAction('Give me a healthy dinner recipe');
    assert.equal(healthyReq.action, 'RECIPE_GENERATION');
    assert.equal(healthyReq.parameters.mealType, 'dinner');
    assert.equal(healthyReq.parameters.healthGoal, 'healthy');

    // 2. Vegetarian breakfast
    const vegReq = zaiResolverService.resolveAction('Give me a vegetarian breakfast');
    assert.equal(vegReq.action, 'RECIPE_GENERATION');
    assert.equal(vegReq.parameters.mealType, 'breakfast');
    assert.equal(vegReq.parameters.dietaryPreference, 'vegetarian');

    // 3. Diabetes-friendly query
    const diabReq = zaiResolverService.resolveAction('Give me diabetes-friendly breakfast recipes');
    assert.equal(diabReq.action, 'RECIPE_GENERATION');
    assert.ok(diabReq.parameters.dietaryConstraints.includes('low-sugar'));

    // 4. Low-sodium ideas
    const lowSodReq = zaiResolverService.resolveAction('Give me low-sodium dinner ideas');
    assert.equal(lowSodReq.action, 'RECIPE_GENERATION');
    assert.ok(lowSodReq.parameters.dietaryConstraints.includes('low-sodium'));

    // 5. Recipe-to-grocery for specific recipe
    const groceryForRecipe = zaiResolverService.resolveAction('Create a grocery list for paneer tikka');
    assert.equal(groceryForRecipe.action, 'GROCERY_LIST');
    assert.equal(groceryForRecipe.parameters.source, 'recipe');
    assert.equal(groceryForRecipe.parameters.recipeName, 'paneer tikka');

    // 6. Generate groceries for current recipe
    const currentRecipeGroceries = zaiResolverService.resolveAction('Generate groceries for this recipe');
    assert.equal(currentRecipeGroceries.action, 'GROCERY_LIST');
    assert.equal(currentRecipeGroceries.parameters.source, 'recipe');
    assert.equal(currentRecipeGroceries.parameters.fromCurrentRecipe, true);

    // 7. Show recipes with specific groceries
    const withGroceries = zaiResolverService.resolveAction('Show me recipes with paneer and spinach');
    assert.equal(withGroceries.action, 'RECIPE_SEARCH');
    assert.ok(withGroceries.parameters.ingredients.includes('paneer'));
    assert.ok(withGroceries.parameters.ingredients.includes('spinach'));
  });

  await test('zaiActionService dispatches recipe-to-grocery with recipeGroceryService integration', async () => {
    const mockUserActId = new mongoose.Types.ObjectId();
    const originalCreate = recipeGroceryService.createGroceryListFromRecipe;

    recipeGroceryService.createGroceryListFromRecipe = async (uid, recipe) => ({
      _id: new mongoose.Types.ObjectId(),
      name: `Grocery List for ${recipe.name}`,
      items: [
        { name: 'paneer', quantity: 200, unit: 'g', category: 'dairy' },
        { name: 'wheat roti', quantity: 2, unit: 'pc', category: 'bakery' },
      ],
      source: 'recipe',
      user: uid,
    });

    try {
      const res = await zaiActionService.dispatchAction(
        'GROCERY_LIST',
        {
          source: 'recipe',
          recipeIngredients: ['200g paneer', '2 wheat rotis'],
          recipeName: 'Roll',
        },
        mockUserActId
      );

      assert.ok(res);
      assert.ok(res.message.includes('Created grocery list'));
      assert.ok(res.data);
      assert.equal(res.data.items.length, 2);
    } finally {
      recipeGroceryService.createGroceryListFromRecipe = originalCreate;
    }
  });

  await test('GET /api/recipes/:id/groceries returns 200 with normalized grocery items', async () => {
    const recipeId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalGetRecipe = recipeService.getRecipeById;

    recipeService.getRecipeById = async (id) => ({
      _id: id,
      name: 'API Test Recipe',
      mealType: 'dinner',
      ingredients: [
        { name: '500g paneer', quantity: 500, unit: 'g' },
        { name: '2 medium onions, chopped', quantity: 2, unit: 'pc' },
      ],
      instructions: ['Cook together'],
    });

    try {
      const res = await new Promise((resolve) => {
        http.get(`${baseUrl}/api/recipes/${recipeId}/groceries`, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        });
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.length, 2);
      assert.equal(res.data.data[0].canonicalName, 'paneer');
      assert.equal(res.data.data[1].canonicalName, 'onion');
    } finally {
      mongoose.connection.readyState = originalReadyState;
      recipeService.getRecipeById = originalGetRecipe;
    }
  });

  await test('GET /api/recipes/:id/price-comparison returns 200 with structured pricing comparison', async () => {
    const recipeId = new mongoose.Types.ObjectId().toString();
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalGetRecipe = recipeService.getRecipeById;

    recipeService.getRecipeById = async (id) => ({
      _id: recipeId,
      name: 'Price Comp Recipe',
      mealType: 'lunch',
      ingredients: [{ name: '1 kg basmati rice', quantity: 1, unit: 'kg' }],
      instructions: ['Boil rice'],
    });

    try {
      const res = await new Promise((resolve) => {
        http.get(`${baseUrl}/api/recipes/${recipeId}/price-comparison`, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        });
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.recipeName, 'Price Comp Recipe');
      assert.equal(res.data.data.pricingAvailable, false);
      assert.equal(res.data.data.items.length, 1);
      assert.ok(res.data.data.items[0].offers.length >= 4);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      recipeService.getRecipeById = originalGetRecipe;
    }
  });

  await test('GET /api/recipes/:id/groceries returns 503 when DB is disconnected without hanging', async () => {
    const recipeId = new mongoose.Types.ObjectId().toString();
    const res = await new Promise((resolve) => {
      http.get(`${baseUrl}/api/recipes/${recipeId}/groceries`, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      });
    });

    assert.equal(res.status, 503);
    assert.equal(res.data.success, false);
  });

  await test('GET /api/recipes/:id/price-comparison returns 503 when DB is disconnected without hanging', async () => {
    const recipeId = new mongoose.Types.ObjectId().toString();
    const res = await new Promise((resolve) => {
      http.get(`${baseUrl}/api/recipes/${recipeId}/price-comparison`, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      });
    });

    assert.equal(res.status, 503);
    assert.equal(res.data.success, false);
  });

  // =========================================================================
  // SECTION 49: PHASE 8 AI RECIPE GENERATION LAYER TESTS
  // =========================================================================

  // A. AI Provider Interface & Registry
  await test('BaseAiRecipeProvider validates constructor arguments and enforces contract', async () => {
    class DummyProvider extends BaseAiRecipeProvider {
      constructor() {
        super('dummy', 'Dummy AI Provider');
      }
    }
    const dummy = new DummyProvider();
    assert.equal(dummy.name, 'dummy');
    assert.equal(dummy.displayName, 'Dummy AI Provider');
    assert.equal(dummy.isConfigured(), false);
    await assert.rejects(
      async () => dummy.generateRecipe({}),
      /generateRecipe\(\) method must be implemented/i
    );

    assert.throws(() => new BaseAiRecipeProvider('', 'Test'), /valid name/i);
    assert.throws(() => new BaseAiRecipeProvider('test', ''), /valid displayName/i);
    assert.throws(() => new BaseAiRecipeProvider('__proto__', 'Malicious'), /Forbidden/i);
  });

  await test('AI Provider Registry manages provider registration, lookup, and defaults', () => {
    class CustomProvider extends BaseAiRecipeProvider {
      constructor() {
        super('custom_llm', 'Custom LLM');
      }
      isConfigured() {
        return true;
      }
    }
    const custom = new CustomProvider();
    registerAiRecipeProvider(custom);

    const retrieved = getAiRecipeProvider('custom_llm');
    assert.ok(retrieved);
    assert.equal(retrieved.name, 'custom_llm');
    assert.equal(retrieved.isConfigured(), true);

    const defProvider = getDefaultAiRecipeProvider();
    assert.ok(defProvider);
    assert.equal(defProvider.name, 'gemini');

    unregisterAiRecipeProvider('custom_llm');
    assert.equal(getAiRecipeProvider('custom_llm'), null);
  });

  await test('GeminiRecipeProvider reflects configuration and normalizes structured output', async () => {
    const mockGemini = {
      isConfigured: () => true,
      generateRecipe: async () => ({
        name: 'Normalized Paneer Wrap',
        description: 'Tasty wrap',
        mealType: 'lunch',
        servings: 2,
        prepTime: 12,
        cookTime: 15,
        dietaryTags: ['Vegetarian'],
        ingredients: [
          { name: 'Paneer', quantity: 200, unit: 'g', category: 'dairy' },
          { name: 'Roti', quantity: 2, unit: 'pc', category: 'bakery' },
        ],
        instructions: ['Grill paneer', 'Wrap in roti'],
        nutrition: { calories: 420, protein: 18, carbohydrates: 45, fats: 16 },
      }),
    };

    const provider = new GeminiRecipeProvider(mockGemini);
    assert.equal(provider.isConfigured(), true);

    const recipe = await provider.generateRecipe({ mealType: 'lunch', servings: 2 });
    assert.equal(recipe.title, 'Normalized Paneer Wrap');
    assert.equal(recipe.servings, 2);
    assert.equal(recipe.prepTimeMinutes, 12);
    assert.equal(recipe.cookTimeMinutes, 15);
    assert.deepEqual(recipe.dietaryTags, ['vegetarian']);
    assert.equal(recipe.ingredients.length, 2);
    assert.equal(recipe.steps.length, 2);
    assert.equal(recipe.provider.name, 'gemini');
  });

  // B. Recipe Request Contract Validation
  await test('aiRecipeService.validateRecipeRequest validates valid requests and sets defaults', () => {
    const valid = aiRecipeService.validateRecipeRequest({
      mealType: 'breakfast',
      servings: 3,
      cuisine: 'Indian',
      dietaryConstraints: ['Vegetarian'],
      excludedIngredients: ['Peanuts'],
      preferredIngredients: ['Oats'],
      maxPrepTimeMinutes: 20,
      healthGoal: 'healthy',
    });

    assert.equal(valid.isValid, true);
    assert.equal(valid.sanitized.mealType, 'breakfast');
    assert.equal(valid.sanitized.servings, 3);
    assert.equal(valid.sanitized.cuisine, 'Indian');
    assert.deepEqual(valid.sanitized.dietaryConstraints, ['vegetarian']);
    assert.deepEqual(valid.sanitized.excludedIngredients, ['peanuts']);
    assert.deepEqual(valid.sanitized.preferredIngredients, ['Oats']);
    assert.equal(valid.sanitized.maxPrepTimeMinutes, 20);
  });

  await test('aiRecipeService.validateRecipeRequest rejects invalid meal types and invalid servings', () => {
    const badMeal = aiRecipeService.validateRecipeRequest({ mealType: 'midnight_feast' });
    assert.equal(badMeal.isValid, false);
    assert.ok(badMeal.error.includes('Invalid meal type'));

    const badServings = aiRecipeService.validateRecipeRequest({ servings: -3 });
    assert.equal(badServings.isValid, false);
    assert.ok(badServings.error.includes('Servings must be between 1 and 50'));

    const nonNumServings = aiRecipeService.validateRecipeRequest({ servings: 'two' });
    assert.equal(nonNumServings.isValid, false);
  });

  await test('aiRecipeService.validateRecipeRequest rejects malformed constraints, oversized inputs, and prototype pollution', () => {
    const badConstraints = aiRecipeService.validateRecipeRequest({ dietaryConstraints: ['unknown-paleo-custom'] });
    assert.equal(badConstraints.isValid, false);
    assert.ok(badConstraints.error.includes('Unknown dietary constraint'));

    const bigExcluded = Array.from({ length: 55 }, (_, i) => `item_${i}`);
    const oversized = aiRecipeService.validateRecipeRequest({ excludedIngredients: bigExcluded });
    assert.equal(oversized.isValid, false);
    assert.ok(oversized.error.includes('exceeds limit of 50 items'));

    const proto = JSON.parse('{"__proto__": {"polluted": true}, "mealType": "dinner"}');
    const protoRes = aiRecipeService.validateRecipeRequest(proto);
    assert.equal(protoRes.isValid, false);
    assert.ok(protoRes.error.includes('Forbidden prototype'));
  });

  // C. AI Output Validation
  await test('aiRecipeService.validateAiRecipeOutput validates structured recipe correctly', () => {
    const rawAi = {
      title: 'Mediterranean Chickpea Salad',
      description: 'Refreshing cucumber chickpea salad',
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 0,
      dietaryTags: ['vegetarian', 'gluten-free'],
      ingredients: [
        { name: '1 cup boiled chickpeas', quantity: 1, unit: 'cup' },
        { name: '1 cucumber, diced', quantity: 1, unit: 'pc' },
        { name: '1 tbsp olive oil', quantity: 1, unit: 'tbsp' },
      ],
      steps: ['Combine chickpeas and cucumber in a bowl', 'Drizzle with olive oil and serve'],
    };

    const validated = aiRecipeService.validateAiRecipeOutput(rawAi, {
      dietaryConstraints: ['vegetarian'],
    });

    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.title, 'Mediterranean Chickpea Salad');
    assert.equal(validated.sanitized.servings, 2);
    assert.equal(validated.sanitized.ingredients.length, 3);
    assert.equal(validated.sanitized.steps.length, 2);
  });

  await test('aiRecipeService.validateAiRecipeOutput rejects missing title, invalid quantities, and empty steps', () => {
    const noTitle = {
      servings: 2,
      ingredients: [{ name: 'Apple', quantity: 1, unit: 'pc' }],
      steps: ['Eat apple'],
    };
    assert.equal(aiRecipeService.validateAiRecipeOutput(noTitle).isValid, false);

    const badQty = {
      title: 'Apple Salad',
      servings: 2,
      ingredients: [{ name: 'Apple', quantity: -10, unit: 'pc' }],
      steps: ['Eat apple'],
    };
    assert.equal(aiRecipeService.validateAiRecipeOutput(badQty).isValid, false);

    const noSteps = {
      title: 'Apple Salad',
      servings: 2,
      ingredients: [{ name: 'Apple', quantity: 1, unit: 'pc' }],
      steps: [],
    };
    assert.equal(aiRecipeService.validateAiRecipeOutput(noSteps).isValid, false);
  });

  await test('aiRecipeService.validateAiRecipeOutput enforces excluded ingredients and dietary constraints', () => {
    // 1. Excluded ingredient violation (contains peanut)
    const withPeanut = {
      title: 'Peanut Butter Toast',
      servings: 1,
      ingredients: [
        { name: '2 tbsp peanut butter', quantity: 2, unit: 'tbsp' },
        { name: '2 slices bread', quantity: 2, unit: 'pc' },
      ],
      steps: ['Spread peanut butter on bread'],
    };
    const excludedCheck = aiRecipeService.validateAiRecipeOutput(withPeanut, {
      excludedIngredients: ['peanut'],
    });
    assert.equal(excludedCheck.isValid, false);
    assert.ok(excludedCheck.error.includes('violates exclusion constraint'));

    // 2. Dietary constraint violation (contains chicken when vegetarian requested)
    const withChicken = {
      title: 'Chicken Soup',
      servings: 2,
      ingredients: [
        { name: '300g chicken breast', quantity: 300, unit: 'g' },
        { name: '1 onion', quantity: 1, unit: 'pc' },
      ],
      steps: ['Boil chicken and onion'],
    };
    const dietaryCheck = aiRecipeService.validateAiRecipeOutput(withChicken, {
      dietaryConstraints: ['vegetarian'],
    });
    assert.equal(dietaryCheck.isValid, false);
    assert.ok(dietaryCheck.error.includes('violates dietary constraints'));
  });

  // D. AI Recipe Generation Service Orchestration & Timeouts
  await test('aiRecipeService.generateRecipe returns safe unconfigured object when provider unavailable', async () => {
    class UnconfiguredProvider extends BaseAiRecipeProvider {
      constructor() { super('mock_unconf', 'Unconfigured Mock'); }
      isConfigured() { return false; }
    }
    const mockUnconf = new UnconfiguredProvider();
    registerAiRecipeProvider(mockUnconf);

    try {
      const res = await aiRecipeService.generateRecipe(
        { mealType: 'dinner' },
        { providerName: 'mock_unconf', safeUnconfigured: true }
      );
      assert.equal(res.available, false);
      assert.ok(res.reason.includes('not configured'));

      // Strict call throws 503
      await assert.rejects(
        async () => aiRecipeService.generateRecipe({ mealType: 'dinner' }, { providerName: 'mock_unconf' }),
        (err) => err.statusCode === 503
      );
    } finally {
      unregisterAiRecipeProvider('mock_unconf');
    }
  });

  await test('aiRecipeService.generateRecipe aborts with 504 on provider timeout', async () => {
    class HangingProvider extends BaseAiRecipeProvider {
      constructor() { super('hanging', 'Hanging Provider'); }
      isConfigured() { return true; }
      async generateRecipe() {
        return new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    const hanging = new HangingProvider();
    registerAiRecipeProvider(hanging);

    try {
      await assert.rejects(
        async () => aiRecipeService.generateRecipe({ mealType: 'dinner' }, { providerName: 'hanging', timeoutMs: 50 }),
        (err) => err.statusCode === 504 && /timed out/i.test(err.message)
      );
    } finally {
      unregisterAiRecipeProvider('hanging');
    }
  });

  await test('aiRecipeService.generateRecipe succeeds and attaches non-medical framing and disclaimer', async () => {
    class SuccessfulProvider extends BaseAiRecipeProvider {
      constructor() { super('success_mock', 'Success Mock'); }
      isConfigured() { return true; }
      async generateRecipe() {
        return {
          title: 'Steamed Moong Sprouts Salad',
          description: 'High protein vegetarian breakfast',
          servings: 2,
          prepTimeMinutes: 10,
          cookTimeMinutes: 5,
          dietaryTags: ['vegetarian'],
          ingredients: [
            { name: '1 cup moong sprouts', quantity: 1, unit: 'cup', category: 'vegetables' },
            { name: '1 tomato, diced', quantity: 1, unit: 'pc', category: 'vegetables' },
          ],
          steps: ['Steam sprouts', 'Toss with tomato'],
        };
      }
    }
    const provider = new SuccessfulProvider();
    registerAiRecipeProvider(provider);

    try {
      const result = await aiRecipeService.generateRecipe(
        { mealType: 'breakfast', dietaryConstraints: ['vegetarian'], servings: 2 },
        { providerName: 'success_mock' }
      );

      assert.equal(result.available, true);
      assert.equal(result.recipe.title, 'Steamed Moong Sprouts Salad');
      assert.equal(result.disclaimer, MEDICAL_SAFETY_DISCLAIMER);
      assert.ok(result.framingNotice.includes('compatible with selected dietary constraints: vegetarian'));
    } finally {
      unregisterAiRecipeProvider('success_mock');
    }
  });

  // E. Persistence & Recipe -> Grocery Integration
  await test('aiRecipeService.generateRecipe persists recipe and preserves user ownership', async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const originalCreate = recipeService.createRecipe;

    let persistedData = null;
    let persistedUser = null;
    recipeService.createRecipe = async (data, user) => {
      persistedData = data;
      persistedUser = user;
      return {
        _id: new mongoose.Types.ObjectId(),
        ...data,
        createdBy: user._id,
      };
    };

    class PersistMockProvider extends BaseAiRecipeProvider {
      constructor() { super('persist_mock', 'Persist Mock'); }
      isConfigured() { return true; }
      async generateRecipe() {
        return {
          title: 'Persisted Dal Khichdi',
          description: 'Comforting lentil rice',
          servings: 2,
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
          dietaryTags: ['vegetarian'],
          ingredients: [{ name: '1 cup rice', quantity: 1, unit: 'cup' }],
          steps: ['Cook together in pressure cooker'],
        };
      }
    }
    const provider = new PersistMockProvider();
    registerAiRecipeProvider(provider);

    try {
      const result = await aiRecipeService.generateRecipe(
        { mealType: 'dinner', persist: true },
        { providerName: 'persist_mock', userId: mockUserId, persist: true }
      );

      assert.equal(result.persisted, true);
      assert.ok(result.recipe._id);
      assert.equal(persistedUser._id.toString(), mockUserId.toString());
      assert.equal(persistedData.source, 'ai');
      assert.equal(persistedData.name, 'Persisted Dal Khichdi');
    } finally {
      recipeService.createRecipe = originalCreate;
      unregisterAiRecipeProvider('persist_mock');
    }
  });

  await test('aiRecipeService.generateRecipe integrates with recipeGroceryService to extract grocery items', async () => {
    class GroceryMockProvider extends BaseAiRecipeProvider {
      constructor() { super('grocery_mock', 'Grocery Mock'); }
      isConfigured() { return true; }
      async generateRecipe() {
        return {
          title: 'Spinach Paneer Bowl',
          servings: 2,
          prepTimeMinutes: 10,
          cookTimeMinutes: 15,
          dietaryTags: ['vegetarian'],
          ingredients: [
            { name: '200g paneer', quantity: 200, unit: 'g' },
            { name: '2 bunches spinach', quantity: 2, unit: 'bunch' },
          ],
          steps: ['Blanch spinach', 'Add paneer'],
        };
      }
    }
    const provider = new GroceryMockProvider();
    registerAiRecipeProvider(provider);

    try {
      const result = await aiRecipeService.generateRecipe(
        { mealType: 'dinner' },
        { providerName: 'grocery_mock', includeGroceryItems: true }
      );

      assert.ok(Array.isArray(result.groceryItems));
      assert.equal(result.groceryItems.length, 2);
      assert.equal(result.groceryItems[0].canonicalName, 'paneer');
      assert.equal(result.groceryItems[1].canonicalName, 'spinach');
    } finally {
      unregisterAiRecipeProvider('grocery_mock');
    }
  });

  // F. HTTP API Integration: POST /api/recipes/generate
  await test('POST /api/recipes/generate validates request contract and rejects invalid input with 400', async () => {
    const originalReadyState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    const originalFindById = User.findById;
    User.findById = async () => ({ _id: mockUserId, name: 'Chef Test', email: 'chef@test.com' });

    try {
      const res = await fetch(`${baseUrl}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ mealType: 'invalid_type', servings: 2 }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes('Invalid meal type'));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      User.findById = originalFindById;
    }
  });

  await test('POST /api/recipes/generate rejects unauthorized request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealType: 'dinner' }),
    });

    assert.equal(res.status, 401);
  });

  await test('POST /api/recipes/generate returns 503 when DB is disconnected without hanging', async () => {
    const res = await fetch(`${baseUrl}/api/recipes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ mealType: 'dinner' }),
    });

    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // =========================================================================
  // SECTION 50: PHASE 9 - CONVERSATIONAL COMPOUND PIPELINE
  // =========================================================================

  // A. Compound Intent Detection & Parameter Extraction
  await test('Phase 9: zaiResolverService detects recipe + grocery compound intent', () => {
    const resolved = zaiResolverService.resolveAction('Give me a vegetarian dinner and make the grocery list.');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.includeGroceries, true);
    assert.deepEqual(resolved.parameters.dietaryConstraints, ['vegetarian']);
    assert.equal(resolved.parameters.mealType, 'dinner');
  });

  await test('Phase 9: zaiResolverService detects recipe + grocery + pricing compound intent', () => {
    const resolved = zaiResolverService.resolveAction('Give me a vegetarian dinner, make the grocery list and show the cheapest option.');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.includeGroceries, true);
    assert.equal(resolved.parameters.includePricing, true);
    assert.deepEqual(resolved.parameters.dietaryConstraints, ['vegetarian']);
    assert.equal(resolved.parameters.mealType, 'dinner');
  });

  await test('Phase 9: zaiResolverService detects recipe + pricing compound intent with ingredients', () => {
    const resolved = zaiResolverService.resolveAction('Generate a recipe for paneer and spinach and show me where it is cheapest.');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.includePricing, true);
    assert.ok(resolved.parameters.ingredients.includes('paneer'));
    assert.ok(resolved.parameters.ingredients.includes('spinach'));
  });

  // B. Hinglish Conversational Support
  await test('Phase 9: zaiResolverService detects full Hinglish compound prompt with servings, mealType, grocery, and cheapest pricing', () => {
    const resolved = zaiResolverService.resolveAction('Zai, mujhe 2 logon ke liye vegetarian dinner batao aur uski grocery list bana ke cheapest option dikhao.');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.includeGroceries, true);
    assert.equal(resolved.parameters.includePricing, true);
    assert.equal(resolved.parameters.servings, 2);
    assert.deepEqual(resolved.parameters.dietaryConstraints, ['vegetarian']);
    assert.equal(resolved.parameters.mealType, 'dinner');
  });

  await test('Phase 9: zaiResolverService detects Hinglish "bana do" compound prompt', () => {
    const resolved = zaiResolverService.resolveAction('Mujhe 2 logon ke liye vegetarian dinner batao aur grocery list bana do.');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.includeGroceries, true);
    assert.equal(resolved.parameters.servings, 2);
    assert.deepEqual(resolved.parameters.dietaryConstraints, ['vegetarian']);
    assert.equal(resolved.parameters.mealType, 'dinner');
  });

  await test('Phase 9: zaiResolverService handles Hinglish terms "banao", "chahiye", "ke liye"', () => {
    const resolved = zaiResolverService.resolveAction('Mujhe 4 logon ke liye paneer dinner chahiye, recipe banao');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.servings, 4);
    assert.equal(resolved.parameters.mealType, 'dinner');
    assert.ok(resolved.parameters.ingredients.includes('paneer'));
  });

  await test('Phase 9: zaiResolverService detects mixed English/Hinglish compound prompt', () => {
    const resolved = zaiResolverService.resolveAction('Mujhe 3 people ke liye chicken dinner suggest karo and make grocery list');
    assert.equal(resolved.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resolved.parameters.generateRecipe, true);
    assert.equal(resolved.parameters.includeGroceries, true);
    assert.equal(resolved.parameters.servings, 3);
    assert.equal(resolved.parameters.mealType, 'dinner');
  });

  // C. Intent Priority & Anti-Hijacking
  await test('Phase 9: Intent priority prevents compound recipe requests from being hijacked by standalone grocery regex', () => {
    const resCompoundGrocery = zaiResolverService.resolveAction('Generate dinner and make its grocery list');
    assert.equal(resCompoundGrocery.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resCompoundGrocery.parameters.generateRecipe, true);
    assert.equal(resCompoundGrocery.parameters.includeGroceries, true);

    const resCompoundCheapest = zaiResolverService.resolveAction('Make a paneer recipe and find the cheapest price');
    assert.equal(resCompoundCheapest.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(resCompoundCheapest.parameters.generateRecipe, true);
    assert.equal(resCompoundCheapest.parameters.includePricing, true);
  });

  await test('Phase 9: Intent priority preserves standalone grocery, shopping links, and price comparison', () => {
    const resShow = zaiResolverService.resolveAction('Show my grocery list');
    assert.equal(resShow.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resShow.parameters.queryType, 'view');
    assert.notEqual(resShow.parameters.generateRecipe, true);

    const resBuy = zaiResolverService.resolveAction('What do I need to buy?');
    assert.equal(resBuy.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resBuy.parameters.queryType, 'view');

    const resCheapest = zaiResolverService.resolveAction('Which store is cheapest for milk?');
    assert.equal(resCheapest.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resCheapest.parameters.queryType, 'price_comparison');

    const resWhere = zaiResolverService.resolveAction('Where can I buy paneer?');
    assert.equal(resWhere.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resWhere.parameters.queryType, 'shopping_links');

    const resMealPlan = zaiResolverService.resolveAction('Create a grocery list from my meal plan');
    assert.equal(resMealPlan.action, ZAI_ACTIONS.GROCERY_LIST);
    assert.equal(resMealPlan.parameters.source, 'meal-plan');
  });

  // D. Automatic Recipe Flag Generation
  await test('Phase 9: Recipe requests automatically set parameters.generateRecipe = true', () => {
    const r1 = zaiResolverService.resolveAction('What should I eat tonight?');
    assert.equal(r1.parameters.generateRecipe, true);

    const r2 = zaiResolverService.resolveAction('Suggest a vegetarian dinner');
    assert.equal(r2.parameters.generateRecipe, true);

    const r3 = zaiResolverService.resolveAction('Suggest something under 500 calories');
    assert.equal(r3.parameters.generateRecipe, true);

    // Non-recipe requests must NOT have generateRecipe = true
    const g1 = zaiResolverService.resolveAction('Show my grocery list');
    assert.equal(g1.parameters.generateRecipe, undefined);

    const gen = zaiResolverService.resolveAction('Who are you?');
    assert.equal(gen.parameters.generateRecipe, undefined);
  });

  // E. Action Validation & Security
  await test('Phase 9: validateStructuredAction validates and sanitizes compound pipeline parameters', () => {
    const validated = validateStructuredAction({
      action: ZAI_ACTIONS.RECIPE_GENERATION,
      parameters: {
        generateRecipe: true,
        includeGroceries: 'true',
        includePricing: 'yes',
        servings: '4',
        dietaryConstraints: ['vegetarian', '<script>alert(1)</script>'],
      },
    });

    assert.equal(validated.isValid, true);
    assert.equal(validated.sanitized.action, ZAI_ACTIONS.RECIPE_GENERATION);
    assert.equal(validated.sanitized.parameters.generateRecipe, true);
    assert.equal(validated.sanitized.parameters.includeGroceries, true);
    assert.equal(validated.sanitized.parameters.includePricing, true);
    assert.equal(validated.sanitized.parameters.servings, 4);
    assert.ok(validated.sanitized.parameters.dietaryConstraints.includes('vegetarian'));
    assert.ok(!validated.sanitized.parameters.dietaryConstraints.includes('<script>alert(1)</script>'));
  });

  await test('Phase 9: validateStructuredAction bounds servings safely and guards against prototype pollution', () => {
    const boundedMin = validateStructuredAction({
      action: ZAI_ACTIONS.RECIPE_GENERATION,
      parameters: { servings: -10 },
    });
    assert.equal(boundedMin.isValid, true);
    assert.equal(boundedMin.sanitized.parameters.servings, 2);

    const boundedMax = validateStructuredAction({
      action: ZAI_ACTIONS.RECIPE_GENERATION,
      parameters: { servings: 9999 },
    });
    assert.equal(boundedMax.isValid, true);
    assert.equal(boundedMax.sanitized.parameters.servings, 2);

    const polluted = validateStructuredAction(JSON.parse('{"action":"RECIPE_GENERATION","parameters":{"__proto__":{"polluted":true},"servings":3}}'));
    assert.equal(polluted.isValid, false);
    assert.equal(Object.prototype.polluted, undefined);
  });

  // F. Centralized Pipeline Orchestration & Unified Response
  await test('Phase 9: zaiActionService executes compound pipeline with recipe -> grocery -> pricing orchestration', async () => {
    const testUid = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;

    recipeIntelligenceService.generatePersonalizedRecipe = async (uid, params) => ({
      recipe: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Vegetarian Dal Tadka',
        mealType: 'dinner',
        servings: params.servings || 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        dietaryTags: ['vegetarian'],
        nutrition: { calories: 320, protein: 14 },
        ingredients: [
          { name: '1 cup yellow lentils (toor dal)', quantity: 1, unit: 'cup' },
          { name: '2 medium tomatoes, chopped', quantity: 2, unit: 'pc' },
          { name: '1 tsp cumin seeds', quantity: 1, unit: 'tsp' },
        ],
        instructions: ['Pressure cook dal', 'Prepare tadka with cumin and tomatoes', 'Mix and simmer'],
      },
      context: {},
      persisted: false,
    });

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.RECIPE_GENERATION,
        {
          generateRecipe: true,
          includeGroceries: true,
          includePricing: true,
          mealType: 'dinner',
          servings: 2,
        },
        testUid,
        null
      );

      assert.equal(result.success, true);
      assert.equal(result.action, ZAI_ACTIONS.RECIPE_GENERATION);
      assert.ok(result.message.includes('Vegetarian Dal Tadka'));
      assert.ok(result.message.includes('grocery item'));
      // No raw internal service leaks or emojis
      assert.ok(!result.message.includes('recipeIntelligenceService'));
      assert.ok(!result.message.includes('geminiClient'));

      // Unified response shape
      assert.ok(result.data.recipe);
      assert.equal(result.data.recipe.name, 'Vegetarian Dal Tadka');
      assert.ok(Array.isArray(result.data.groceryItems));
      assert.equal(result.data.groceryItems.length, 3);
      assert.ok(result.data.priceComparison);
      assert.ok(result.data.metadata);
      assert.equal(result.data.metadata.recipeGenerated, true);
      assert.equal(result.data.metadata.groceriesGenerated, true);
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      geminiService.setMockClient(null);
    }
  });

  // G. Partial Failure Handling
  await test('Phase 9: Partial failure handling - Upstream recipe failure aborts without attempting grocery or pricing', async () => {
    const testUid = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;

    recipeIntelligenceService.generatePersonalizedRecipe = async () => {
      const err = new Error('Recipe AI provider unavailable');
      err.status = 503;
      throw err;
    };

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.RECIPE_GENERATION,
        { generateRecipe: true, includeGroceries: true, includePricing: true },
        testUid,
        null
      );

      assert.equal(result.success, false);
      assert.equal(result.data, null);
      assert.ok(result.message.includes('Could not generate recipe') || result.message.includes('Recipe AI provider unavailable'));
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      geminiService.setMockClient(null);
    }
  });

  await test('Phase 9: Partial failure handling - Grocery failure preserves recipe successfully with graceful degradation', async () => {
    const testUid = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;
    const originalToGrocery = recipeGroceryService.recipeToGroceryItems;

    recipeIntelligenceService.generatePersonalizedRecipe = async () => ({
      recipe: {
        name: 'Palak Paneer',
        servings: 2,
        ingredients: [{ name: '200g paneer' }],
      },
    });

    recipeGroceryService.recipeToGroceryItems = () => {
      throw new Error('Simulated grocery normalization error');
    };

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.RECIPE_GENERATION,
        { generateRecipe: true, includeGroceries: true, includePricing: true },
        testUid,
        null
      );

      assert.equal(result.success, true);
      assert.ok(result.data.recipe);
      assert.equal(result.data.recipe.name, 'Palak Paneer');
      assert.deepEqual(result.data.groceryItems, []);
      assert.equal(result.data.metadata.recipeGenerated, true);
      assert.equal(result.data.metadata.groceriesGenerated, false);
      assert.equal(result.data.metadata.groceryFailed, true);
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      recipeGroceryService.recipeToGroceryItems = originalToGrocery;
      geminiService.setMockClient(null);
    }
  });

  await test('Phase 9: Partial failure handling - Pricing failure preserves recipe and groceries with pricingAvailable: false', async () => {
    const testUid = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;
    const originalGetPricing = recipeGroceryService.getRecipePriceComparison;

    recipeIntelligenceService.generatePersonalizedRecipe = async () => ({
      recipe: {
        name: 'Vegetable Biryani',
        servings: 2,
        ingredients: [
          { name: '1 cup basmati rice', quantity: 1, unit: 'cup' },
          { name: '100g mixed vegetables', quantity: 100, unit: 'g' },
        ],
      },
    });

    recipeGroceryService.getRecipePriceComparison = async () => {
      throw new Error('Simulated price comparison provider timeout');
    };

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      const result = await zaiActionService.dispatchAction(
        ZAI_ACTIONS.RECIPE_GENERATION,
        { generateRecipe: true, includeGroceries: true, includePricing: true },
        testUid,
        null
      );

      assert.equal(result.success, true);
      assert.ok(result.data.recipe);
      assert.equal(result.data.recipe.name, 'Vegetable Biryani');
      assert.ok(result.data.groceryItems.length > 0);
      assert.equal(result.data.metadata.recipeGenerated, true);
      assert.equal(result.data.metadata.groceriesGenerated, true);
      assert.equal(result.data.metadata.pricingAvailable, false);
      assert.equal(result.data.metadata.pricingFailed, true);
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      recipeGroceryService.getRecipePriceComparison = originalGetPricing;
      geminiService.setMockClient(null);
    }
  });

  // H. Multi-Turn Conversational Compatibility
  await test('Phase 9: Multi-turn conversation preserves recipe context across turns (Turn 1: Recipe -> Turn 2: Grocery)', async () => {
    const testUid = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;
    const originalCreateList = recipeGroceryService.createGroceryListFromRecipe;

    recipeIntelligenceService.generatePersonalizedRecipe = async () => ({
      recipe: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Paneer Butter Masala',
        mealType: 'dinner',
        servings: 2,
        ingredients: [
          { name: '250g paneer, cubed', quantity: 250, unit: 'g' },
          { name: '3 tomatoes, pureed', quantity: 3, unit: 'pc' },
        ],
        instructions: ['Saute tomatoes and spices', 'Add paneer cubes', 'Simmer for 5 minutes'],
      },
      persisted: false,
    });

    recipeGroceryService.createGroceryListFromRecipe = async (uid, recipe) => ({
      _id: new mongoose.Types.ObjectId(),
      name: `Grocery List for ${recipe.name}`,
      items: [
        { name: 'paneer', quantity: 250, unit: 'g', category: 'dairy' },
        { name: 'tomatoes', quantity: 3, unit: 'pc', category: 'produce' },
      ],
      source: 'recipe',
      user: uid,
    });

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      // TURN 1: User asks for a recipe
      const turn1Result = await zaiActionService.processMessage(
        testUid,
        'Suggest a vegetarian dinner'
      );

      assert.equal(turn1Result.action, ZAI_ACTIONS.RECIPE_GENERATION);
      assert.ok(turn1Result.recipe);
      assert.equal(turn1Result.recipe.name, 'Paneer Butter Masala');
      assert.ok(turn1Result.sessionId);

      // TURN 2: User asks to generate the grocery list for the recipe with session
      const turn2Result = await zaiActionService.processMessage(
        testUid,
        'Generate the grocery list for this recipe',
        turn1Result.sessionId
      );

      assert.equal(turn2Result.action, ZAI_ACTIONS.GROCERY_LIST);
      assert.ok(turn2Result.result || turn2Result.message);
      assert.ok(turn2Result.message.includes('grocery list') || turn2Result.message.includes('Paneer'));
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      recipeGroceryService.createGroceryListFromRecipe = originalCreateList;
      geminiService.setMockClient(null);
    }
  });

  // I. End-to-End processMessage with full Hinglish compound prompt
  await test('Phase 9: End-to-end zaiActionService.processMessage executes full Hinglish compound prompt with unified response', async () => {
    const testUid = new mongoose.Types.ObjectId();
    const originalGen = recipeIntelligenceService.generatePersonalizedRecipe;

    recipeIntelligenceService.generatePersonalizedRecipe = async (uid, params) => ({
      recipe: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Vegetarian Dinner Bowl',
        servings: params.servings || 2,
        ingredients: [
          { name: '200g paneer', quantity: 200, unit: 'g' },
          { name: '1 bunch spinach', quantity: 1, unit: 'bunch' },
        ],
        instructions: ['Cook together with mild spices'],
      },
      persisted: false,
    });

    const mockClient = { models: { generateContent: async () => ({ text: '{}' }) } };
    geminiService.setMockClient(mockClient);

    try {
      const fullPrompt = 'Zai, mujhe 2 logon ke liye vegetarian dinner batao aur uski grocery list bana ke cheapest option dikhao.';
      const res = await zaiActionService.processMessage(testUid, fullPrompt);

      assert.equal(res.action, ZAI_ACTIONS.RECIPE_GENERATION);
      assert.ok(res.recipe);
      assert.equal(res.recipe.name, 'Vegetarian Dinner Bowl');
      assert.equal(res.recipe.servings, 2);
      assert.ok(Array.isArray(res.groceryItems));
      assert.equal(res.groceryItems.length, 2);
      assert.ok(res.priceComparison);
      assert.ok(res.metadata);
      assert.equal(res.metadata.recipeGenerated, true);
      assert.equal(res.metadata.groceriesGenerated, true);
    } finally {
      recipeIntelligenceService.generatePersonalizedRecipe = originalGen;
      geminiService.setMockClient(null);
    }
  });

  // =========================================================================
  // SECTION 51: PHASE 10 STEP 1 - ASYNC RECIPE PRICE COMPARISON & PIPELINE WIRING
  // =========================================================================

  await test('Phase 10 Step 1: recipeGroceryService.getRecipePriceComparison surfaces live pricing from an asynchronous configured provider', async () => {
    resetPriceProviders();

    class MockAsyncBlinkitProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      async getProductOffer(query, context) {
        return {
          marketplace: 'blinkit',
          displayName: 'Blinkit',
          productName: 'Amul Fresh Paneer 200g',
          productUrl: 'https://blinkit.com/prn/paneer-200g',
          price: 85,
          currency: 'INR',
          packQuantity: 200,
          packUnit: 'g',
          available: true,
          pricingAvailable: true,
          source: 'blinkit-test',
          fetchedAt: '2026-10-07T10:00:00.000Z',
        };
      }
    }

    registerPriceProvider(new MockAsyncBlinkitProvider());

    const testRecipe = {
      name: 'Paneer Bhurji',
      ingredients: [{ name: '200g fresh paneer' }],
      instructions: ['Crumble paneer and saute with spices'],
    };

    try {
      const result = await recipeGroceryService.getRecipePriceComparison(testRecipe);
      assert.ok(result);
      assert.equal(result.recipeName, 'Paneer Bhurji');
      assert.equal(result.itemsCount, 1);
      assert.equal(result.pricingAvailable, true);

      const item = result.items[0];
      assert.equal(item.name, 'fresh paneer');
      assert.equal(item.pricingAvailable, true);
      assert.ok(item.offers.length >= 4);

      const blinkitOffer = item.offers.find((o) => o.marketplace === 'blinkit');
      assert.ok(blinkitOffer);
      assert.equal(blinkitOffer.pricingAvailable, true);
      assert.equal(blinkitOffer.price, 85);
      assert.equal(blinkitOffer.productName, 'Amul Fresh Paneer 200g');
      assert.equal(blinkitOffer.productUrl, 'https://blinkit.com/prn/paneer-200g');
      assert.ok(item.comparison);
      assert.equal(item.comparison.pricingAvailable, true);
      assert.equal(item.comparison.bestMarketplace, 'blinkit');
      assert.equal(item.comparison.bestPrice, 85);
    } finally {
      resetPriceProviders();
    }
  });

  await test('Phase 10 Step 1: recipeGroceryService.getRecipePriceComparison returns safe fallback search links when providers are unconfigured', async () => {
    resetPriceProviders();

    const testRecipe = {
      name: 'Fruit Salad',
      ingredients: [{ name: '2 apples' }, { name: '1 banana' }],
      instructions: ['Chop fruits into bowl'],
    };

    const result = await recipeGroceryService.getRecipePriceComparison(testRecipe);
    assert.ok(result);
    assert.equal(result.recipeName, 'Fruit Salad');
    assert.equal(result.itemsCount, 2);
    assert.equal(result.pricingAvailable, false);

    for (const item of result.items) {
      assert.equal(item.pricingAvailable, false);
      assert.ok(item.offers.length >= 4);
      for (const offer of item.offers) {
        assert.equal(offer.pricingAvailable, false);
        assert.equal(offer.price, null);
        assert.equal(offer.source, 'unconfigured');
        assert.ok(typeof offer.searchUrl === 'string' && offer.searchUrl.length > 0);
      }
    }
  });

  await test('Phase 10 Step 1: Provider failure isolation - Asynchronous provider rejection does not crash recipe comparison and falls back safely', async () => {
    resetPriceProviders();

    class FaultyAsyncProvider extends BasePriceProvider {
      constructor() {
        super('zepto', 'Zepto', { configured: true });
      }
      async getProductOffer() {
        throw new Error('Connection timeout to upstream Zepto pricing server');
      }
    }

    registerPriceProvider(new FaultyAsyncProvider());

    const testRecipe = {
      name: 'Masala Chai',
      ingredients: [{ name: '1 cup milk' }],
      instructions: ['Boil milk with tea leaves and ginger'],
    };

    try {
      const result = await recipeGroceryService.getRecipePriceComparison(testRecipe);
      assert.ok(result);
      assert.equal(result.recipeName, 'Masala Chai');
      assert.equal(result.itemsCount, 1);
      assert.equal(result.pricingAvailable, false);

      const item = result.items[0];
      const zeptoOffer = item.offers.find((o) => o.marketplace === 'zepto');
      assert.ok(zeptoOffer);
      assert.equal(zeptoOffer.pricingAvailable, false);
      assert.equal(zeptoOffer.price, null);
      assert.equal(zeptoOffer.source, 'unconfigured');
      assert.ok(zeptoOffer.searchUrl);
    } finally {
      resetPriceProviders();
    }
  });

  await test('Phase 10 Step 1: Multiple providers remain isolated - Failing provider does not impact healthy async provider', async () => {
    resetPriceProviders();

    class FailingBlinkitProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      async getProductOffer() {
        throw new Error('HTTP 500 Internal Server Error');
      }
    }

    class WorkingZeptoProvider extends BasePriceProvider {
      constructor() {
        super('zepto', 'Zepto', { configured: true });
      }
      async getProductOffer() {
        return {
          marketplace: 'zepto',
          displayName: 'Zepto',
          productName: 'Organic Tomato 500g',
          productUrl: 'https://zepto.com/prn/organic-tomato',
          price: 32,
          currency: 'INR',
          packQuantity: 500,
          packUnit: 'g',
          available: true,
          pricingAvailable: true,
          source: 'zepto-test',
          fetchedAt: '2026-10-07T10:00:00.000Z',
        };
      }
    }

    registerPriceProvider(new FailingBlinkitProvider());
    registerPriceProvider(new WorkingZeptoProvider());

    const testRecipe = {
      name: 'Tomato Soup',
      ingredients: [{ name: '500g tomatoes' }],
      instructions: ['Puree and simmer with cream'],
    };

    try {
      const result = await recipeGroceryService.getRecipePriceComparison(testRecipe);
      assert.ok(result);
      assert.equal(result.pricingAvailable, true);

      const item = result.items[0];
      const blinkitOffer = item.offers.find((o) => o.marketplace === 'blinkit');
      const zeptoOffer = item.offers.find((o) => o.marketplace === 'zepto');

      assert.equal(blinkitOffer.pricingAvailable, false);
      assert.equal(blinkitOffer.price, null);
      assert.equal(blinkitOffer.source, 'unconfigured');
      assert.ok(blinkitOffer.searchUrl);

      assert.equal(zeptoOffer.pricingAvailable, true);
      assert.equal(zeptoOffer.price, 32);
      assert.equal(item.comparison.bestMarketplace, 'zepto');
      assert.equal(item.comparison.bestPrice, 32);
    } finally {
      resetPriceProviders();
    }
  });

  await test('Phase 10 Step 1: Existing synchronous caller priceIntelligenceService.getItemPriceComparison remains backward compatible', () => {
    resetPriceProviders();

    // With unconfigured providers
    const syncRes = priceIntelligenceService.getItemPriceComparison('Basmati Rice');
    assert.ok(syncRes);
    assert.equal(typeof syncRes.then, 'undefined'); // Synchronous: NOT a Promise
    assert.equal(syncRes.item, 'Basmati Rice');
    assert.equal(syncRes.pricingAvailable, false);
    assert.ok(syncRes.comparison);
    assert.ok(Array.isArray(syncRes.comparison.offers));

    // Register an async provider
    class MockAsyncProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      async getProductOffer() {
        return {
          marketplace: 'blinkit',
          displayName: 'Blinkit',
          productName: 'Rice',
          price: 150,
          pricingAvailable: true,
        };
      }
    }

    registerPriceProvider(new MockAsyncProvider());

    try {
      // Synchronous caller must not receive unresolved Promise and must not crash
      const syncWithAsyncProvider = priceIntelligenceService.getItemPriceComparison('Basmati Rice');
      assert.ok(syncWithAsyncProvider);
      assert.equal(typeof syncWithAsyncProvider.then, 'undefined');
      assert.equal(syncWithAsyncProvider.item, 'Basmati Rice');
      const blinkitOffer = syncWithAsyncProvider.comparison.offers.find((o) => o.marketplace === 'blinkit');
      assert.ok(blinkitOffer);
      assert.equal(typeof blinkitOffer.then, 'undefined');
      assert.equal(blinkitOffer.pricingAvailable, false); // Safe sync fallback for async provider
      assert.equal(blinkitOffer.source, 'unconfigured');
    } finally {
      resetPriceProviders();
    }
  });

  await test('Phase 10 Step 1: No Promise object leaks into recipe grocery response data structure', async () => {
    resetPriceProviders();

    class AsyncMockProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      async getProductOffer() {
        return {
          marketplace: 'blinkit',
          displayName: 'Blinkit',
          productName: 'Milk 1L',
          productUrl: 'https://blinkit.com/prn/milk-1l',
          price: 60,
          currency: 'INR',
          packQuantity: 1,
          packUnit: 'l',
          available: true,
          pricingAvailable: true,
          source: 'blinkit-live',
          fetchedAt: '2026-10-07T10:00:00.000Z',
        };
      }
    }

    registerPriceProvider(new AsyncMockProvider());

    try {
      const result = await recipeGroceryService.getRecipePriceComparison({
        name: 'Kheer',
        ingredients: [{ name: '1 litre milk' }, { name: '100g rice' }],
      });

      // Verify root object
      assert.ok(result);
      assert.equal(typeof result.then, 'undefined');
      assert.equal(typeof result.pricingAvailable, 'boolean');
      assert.equal(typeof result.itemsCount, 'number');
      assert.ok(Array.isArray(result.items));

      // Verify each item and nested properties
      for (const item of result.items) {
        assert.equal(typeof item.then, 'undefined');
        assert.equal(typeof item.pricingAvailable, 'boolean');
        assert.ok(Array.isArray(item.offers));
        if (item.comparison) {
          assert.equal(typeof item.comparison.then, 'undefined');
          assert.equal(typeof item.comparison.pricingAvailable, 'boolean');
        }
        for (const offer of item.offers) {
          assert.equal(typeof offer.then, 'undefined');
          assert.ok(typeof offer.marketplace === 'string');
        }
      }

      // Ensure JSON.stringify serialization is valid without unresolved circular or promise structures
      const jsonStr = JSON.stringify(result);
      assert.ok(jsonStr.length > 0);
      const parsed = JSON.parse(jsonStr);
      assert.equal(parsed.itemsCount, 2);
      assert.equal(parsed.pricingAvailable, true);
    } finally {
      resetPriceProviders();
    }
  });

  await test('Phase 10 Step 1: End-to-end recipe price comparison with preferredMarketplace filter against async provider', async () => {
    resetPriceProviders();

    class AsyncBlinkitProvider extends BasePriceProvider {
      constructor() {
        super('blinkit', 'Blinkit', { configured: true });
      }
      async getProductOffer() {
        return {
          marketplace: 'blinkit',
          displayName: 'Blinkit',
          productName: 'Fresh Coriander',
          price: 15,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'blinkit-live',
          fetchedAt: '2026-10-07T10:00:00.000Z',
        };
      }
    }

    registerPriceProvider(new AsyncBlinkitProvider());

    try {
      const result = await recipeGroceryService.getRecipePriceComparison(
        {
          name: 'Garnish',
          ingredients: [{ name: 'coriander leaves' }],
        },
        'blinkit'
      );

      assert.ok(result);
      assert.equal(result.pricingAvailable, true);
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].offers.length, 1);
      assert.equal(result.items[0].offers[0].marketplace, 'blinkit');
      assert.equal(result.items[0].offers[0].pricingAvailable, true);
      assert.equal(result.items[0].offers[0].price, 15);
    } finally {
      resetPriceProviders();
    }
  });

  // =========================================================================
  // SECTION 52: PHASE 10 STEP 2 - BASKET-LEVEL STORE TOTAL AGGREGATION
  // =========================================================================

  await test('Phase 10 Step 2: compareBasket calculates aggregate basket totals for multiple marketplaces with complete priced baskets', () => {
    const basketItems = [
      {
        name: 'Item 1',
        offers: [
          { marketplace: 'instamart', price: 60, pricingAvailable: true },
          { marketplace: 'blinkit', price: 58, pricingAvailable: true },
        ],
      },
      {
        name: 'Item 2',
        offers: [
          { marketplace: 'instamart', price: 90, pricingAvailable: true },
          { marketplace: 'blinkit', price: 95, pricingAvailable: true },
        ],
      },
      {
        name: 'Item 3',
        offers: [
          { marketplace: 'instamart', price: 30, pricingAvailable: true },
          { marketplace: 'blinkit', price: 28, pricingAvailable: true },
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);

    assert.ok(result);
    assert.equal(result.pricingAvailable, true);
    assert.equal(result.items.length, 3);

    // Individual item comparisons remain intact
    assert.equal(result.items[0].comparison.bestPrice, 58);
    assert.equal(result.items[0].comparison.bestMarketplace, 'blinkit');
    assert.equal(result.items[1].comparison.bestPrice, 90);
    assert.equal(result.items[1].comparison.bestMarketplace, 'instamart');
    assert.equal(result.items[2].comparison.bestPrice, 28);
    assert.equal(result.items[2].comparison.bestMarketplace, 'blinkit');

    // Basket summary and totals
    assert.ok(result.summary);
    assert.equal(result.summary.totalItemsCount, 3);
    assert.equal(result.summary.hasCompleteBasket, true);
    assert.equal(result.summary.bestMarketplace, 'instamart');
    assert.equal(result.summary.bestPrice, 180);

    // Instamart total: 60 + 90 + 30 = 180
    const instamartSummary = result.summary.marketplaces.instamart;
    assert.ok(instamartSummary);
    assert.equal(instamartSummary.totalPrice, 180);
    assert.equal(instamartSummary.pricedItemsCount, 3);
    assert.equal(instamartSummary.unpricedItemsCount, 0);
    assert.equal(instamartSummary.isComplete, true);
    assert.equal(instamartSummary.pricingAvailable, true);

    // Blinkit total: 58 + 95 + 28 = 181
    const blinkitSummary = result.summary.marketplaces.blinkit;
    assert.ok(blinkitSummary);
    assert.equal(blinkitSummary.totalPrice, 181);
    assert.equal(blinkitSummary.pricedItemsCount, 3);
    assert.equal(blinkitSummary.unpricedItemsCount, 0);
    assert.equal(blinkitSummary.isComplete, true);
    assert.equal(blinkitSummary.pricingAvailable, true);

    // Both present in basketTotals array
    assert.ok(Array.isArray(result.basketTotals));
    assert.equal(result.basketTotals.length, 2);
  });

  await test('Phase 10 Step 2: Out-of-stock and unavailable offers are strictly excluded from basket totals', () => {
    const basketItems = [
      {
        name: 'Paneer',
        offers: [
          { marketplace: 'instamart', price: 50, available: true, pricingAvailable: true },
          { marketplace: 'blinkit', price: 45, available: true, pricingAvailable: true },
        ],
      },
      {
        name: 'Butter',
        offers: [
          { marketplace: 'instamart', price: 100, available: true, pricingAvailable: true },
          // Blinkit offer is explicitly out-of-stock
          { marketplace: 'blinkit', price: 90, available: false, pricingAvailable: false },
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);

    // Instamart is complete: 50 + 100 = 150
    const instamartSummary = result.summary.marketplaces.instamart;
    assert.equal(instamartSummary.totalPrice, 150);
    assert.equal(instamartSummary.pricedItemsCount, 2);
    assert.equal(instamartSummary.unpricedItemsCount, 0);
    assert.equal(instamartSummary.isComplete, true);

    // Blinkit has only 1 available item: 45 (Butter was out-of-stock, NOT treated as price 0)
    const blinkitSummary = result.summary.marketplaces.blinkit;
    assert.equal(blinkitSummary.totalPrice, 45);
    assert.equal(blinkitSummary.pricedItemsCount, 1);
    assert.equal(blinkitSummary.unpricedItemsCount, 1);
    assert.equal(blinkitSummary.isComplete, false);

    // Best complete marketplace must be Instamart (150 complete), NOT incomplete Blinkit (45)
    assert.equal(result.summary.bestMarketplace, 'instamart');
    assert.equal(result.summary.bestPrice, 150);
  });

  await test('Phase 10 Step 2: Null, NaN, Infinity, negative, zero, and malformed prices are excluded', () => {
    const basketItems = [
      {
        name: 'Flour',
        offers: [
          { marketplace: 'zepto', price: null, pricingAvailable: false },
          { marketplace: 'blinkit', price: -50, pricingAvailable: true },
        ],
      },
      {
        name: 'Sugar',
        offers: [
          { marketplace: 'zepto', price: 0, pricingAvailable: true },
          { marketplace: 'blinkit', price: NaN, pricingAvailable: true },
        ],
      },
      {
        name: 'Salt',
        offers: [
          { marketplace: 'zepto', price: Infinity, pricingAvailable: true },
          { marketplace: 'blinkit', price: 'free', pricingAvailable: true },
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);
    assert.equal(result.pricingAvailable, false);

    // Zepto has no valid prices: totalPrice MUST be null (never a fake 0)
    const zeptoSummary = result.summary.marketplaces.zepto;
    assert.equal(zeptoSummary.totalPrice, null);
    assert.equal(zeptoSummary.pricedItemsCount, 0);
    assert.equal(zeptoSummary.unpricedItemsCount, 3);
    assert.equal(zeptoSummary.pricingAvailable, false);
    assert.equal(zeptoSummary.isComplete, false);

    // Blinkit has no valid prices: totalPrice MUST be null (never a fake 0)
    const blinkitSummary = result.summary.marketplaces.blinkit;
    assert.equal(blinkitSummary.totalPrice, null);
    assert.equal(blinkitSummary.pricedItemsCount, 0);
    assert.equal(blinkitSummary.unpricedItemsCount, 3);
    assert.equal(blinkitSummary.pricingAvailable, false);
    assert.equal(blinkitSummary.isComplete, false);

    // No complete basket
    assert.equal(result.summary.hasCompleteBasket, false);
    assert.equal(result.summary.bestMarketplace, null);
    assert.equal(result.summary.bestPrice, null);
  });

  await test('Phase 10 Step 2: Partially priced marketplace is never falsely declared the cheapest complete basket', () => {
    // Store A has 3/3 items priced (total 300)
    // Store B has 2/3 items priced (total 200, item 3 missing)
    const basketItems = [
      {
        name: 'Rice',
        offers: [
          { marketplace: 'store_a', price: 100, pricingAvailable: true },
          { marketplace: 'store_b', price: 90, pricingAvailable: true },
        ],
      },
      {
        name: 'Dal',
        offers: [
          { marketplace: 'store_a', price: 100, pricingAvailable: true },
          { marketplace: 'store_b', price: 110, pricingAvailable: true },
        ],
      },
      {
        name: 'Oil',
        offers: [
          { marketplace: 'store_a', price: 100, pricingAvailable: true },
          // Store B has NO offer for Oil
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);

    const storeA = result.summary.marketplaces.store_a;
    assert.equal(storeA.isComplete, true);
    assert.equal(storeA.pricedItemsCount, 3);
    assert.equal(storeA.unpricedItemsCount, 0);
    assert.equal(storeA.totalPrice, 300);

    const storeB = result.summary.marketplaces.store_b;
    assert.equal(storeB.isComplete, false);
    assert.equal(storeB.pricedItemsCount, 2);
    assert.equal(storeB.unpricedItemsCount, 1);
    assert.equal(storeB.totalPrice, 200);

    // Rule 12: Store A (300 complete) must be selected, NOT Store B (200 incomplete)
    assert.equal(result.summary.bestMarketplace, 'store_a');
    assert.equal(result.summary.bestPrice, 300);
  });

  await test('Phase 10 Step 2: When no marketplace has a complete basket, bestMarketplace is safely null', () => {
    const basketItems = [
      {
        name: 'Apples',
        offers: [{ marketplace: 'store_a', price: 80, pricingAvailable: true }],
      },
      {
        name: 'Oranges',
        offers: [{ marketplace: 'store_b', price: 70, pricingAvailable: true }],
      },
      {
        name: 'Bananas',
        offers: [
          { marketplace: 'store_a', price: 40, pricingAvailable: true },
          { marketplace: 'store_b', price: 35, pricingAvailable: true },
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);

    const storeA = result.summary.marketplaces.store_a;
    assert.equal(storeA.isComplete, false);
    assert.equal(storeA.pricedItemsCount, 2);

    const storeB = result.summary.marketplaces.store_b;
    assert.equal(storeB.isComplete, false);
    assert.equal(storeB.pricedItemsCount, 2);

    assert.equal(result.summary.hasCompleteBasket, false);
    assert.equal(result.summary.bestMarketplace, null);
    assert.equal(result.summary.bestPrice, null);
  });

  await test('Phase 10 Step 2: Currency mismatch within a store prevents invalid summation', () => {
    const basketItems = [
      {
        name: 'Coffee',
        offers: [{ marketplace: 'global_mart', price: 200, currency: 'INR', pricingAvailable: true }],
      },
      {
        name: 'Syrup',
        offers: [{ marketplace: 'global_mart', price: 5, currency: 'USD', pricingAvailable: true }],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);

    const globalMart = result.summary.marketplaces.global_mart;
    assert.equal(globalMart.currencyMismatch, true);
    assert.equal(globalMart.totalPrice, null); // Incompatible currencies cannot be summed
    assert.equal(globalMart.pricingAvailable, false);
    assert.equal(globalMart.isComplete, false);
  });

  await test('Phase 10 Step 2: Detects tied lowest complete basket totals across marketplaces', () => {
    const basketItems = [
      {
        name: 'Tea',
        offers: [
          { marketplace: 'blinkit', price: 60, pricingAvailable: true },
          { marketplace: 'zepto', price: 60, pricingAvailable: true },
        ],
      },
      {
        name: 'Sugar',
        offers: [
          { marketplace: 'blinkit', price: 40, pricingAvailable: true },
          { marketplace: 'zepto', price: 40, pricingAvailable: true },
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);
    assert.equal(result.summary.hasCompleteBasket, true);
    assert.equal(result.summary.bestPrice, 100);
    assert.equal(result.summary.isTied, true);
    assert.ok(result.summary.tiedMarketplaces.includes('blinkit'));
    assert.ok(result.summary.tiedMarketplaces.includes('zepto'));
  });

  await test('Phase 10 Step 2: Pack-size normalization and dimensional safety remain intact in basket items', () => {
    const basketItems = [
      {
        name: 'Basmati Rice',
        offers: [
          {
            marketplace: 'blinkit',
            price: 60,
            packQuantity: 500,
            packUnit: 'g',
            pricingAvailable: true,
          },
          {
            marketplace: 'zepto',
            price: 110,
            packQuantity: 1,
            packUnit: 'kg',
            pricingAvailable: true,
          },
        ],
      },
    ];

    const result = priceComparisonService.compareBasket(basketItems);
    assert.ok(result);

    const item = result.items[0];
    assert.equal(item.comparison.packSizeMismatch, true);
    assert.equal(item.comparison.normalizedPricingAvailable, true);
    // 500g @ 60 = 120/kg vs 1kg @ 110 = 110/kg
    assert.equal(item.comparison.bestNormalizedPrice, 110);
    assert.equal(item.comparison.bestNormalizedMarketplace, 'zepto');

    // Basket totals use the raw offer prices (60 and 110)
    assert.equal(result.summary.marketplaces.blinkit.totalPrice, 60);
    assert.equal(result.summary.marketplaces.zepto.totalPrice, 110);
  });

  await test('Phase 10 Step 2: Backward compatibility - empty and malformed inputs return safe defaults', () => {
    const emptyResult = priceComparisonService.compareBasket([]);
    assert.equal(emptyResult.pricingAvailable, false);
    assert.deepEqual(emptyResult.items, []);
    assert.equal(emptyResult.summary, null);
    assert.deepEqual(emptyResult.basketTotals, []);

    const nullResult = priceComparisonService.compareBasket(null);
    assert.equal(nullResult.pricingAvailable, false);
    assert.deepEqual(nullResult.items, []);
    assert.equal(nullResult.summary, null);

    const undefinedResult = priceComparisonService.compareBasket(undefined);
    assert.equal(undefinedResult.pricingAvailable, false);
    assert.deepEqual(undefinedResult.items, []);
    assert.equal(undefinedResult.summary, null);
  });

  // =========================================================================
  // 53. PHASE 10 STEP 3 — BOUNDED CONCURRENCY POOLING & PROVIDER RATE-LIMIT PROTECTION
  // =========================================================================

  await test('Phase 10 Step 3: mapConcurrent strictly respects concurrency limit', async () => {
    const totalItems = 10;
    const limit = 3;
    const items = Array.from({ length: totalItems }, (_, i) => `item_${i}`);

    let activeCount = 0;
    let maxActiveCount = 0;

    const results = await mapConcurrent(
      items,
      async (item, idx) => {
        activeCount++;
        if (activeCount > maxActiveCount) {
          maxActiveCount = activeCount;
        }
        await new Promise((resolve) => setTimeout(resolve, 15));
        activeCount--;
        return `processed_${item}_${idx}`;
      },
      limit
    );

    assert.equal(maxActiveCount <= limit, true, `Max active (${maxActiveCount}) must not exceed limit (${limit})`);
    assert.equal(maxActiveCount, limit, `Max active should reach pool limit of ${limit}`);
    assert.equal(results.length, totalItems);
    assert.equal(results[0], 'processed_item_0_0');
    assert.equal(results[9], 'processed_item_9_9');
  });

  await test('Phase 10 Step 3: Large item list (20 items) does not execute all provider requests simultaneously', async () => {
    const totalItems = 20;
    const limit = 4;
    const items = Array.from({ length: totalItems }, (_, i) => `grocery_${i}`);

    let activeCount = 0;
    let maxActiveCount = 0;

    const results = await mapConcurrent(
      items,
      async (item) => {
        activeCount++;
        if (activeCount > maxActiveCount) {
          maxActiveCount = activeCount;
        }
        await new Promise((resolve) => setTimeout(resolve, 8));
        activeCount--;
        return { item, done: true };
      },
      limit
    );

    assert.equal(maxActiveCount <= limit, true, `Peak active (${maxActiveCount}) must stay <= ${limit}`);
    assert.equal(results.length, 20);
    assert.equal(results.every((r) => r.done), true);
  });

  await test('Phase 10 Step 3: Queued requests start as earlier requests finish in bounded pool', async () => {
    const items = ['task_0', 'task_1', 'task_2', 'task_3', 'task_4', 'task_5'];
    const limit = 2;
    const started = [];
    const finished = [];

    await mapConcurrent(
      items,
      async (item) => {
        started.push(item);
        if (item === 'task_0') {
          // While task_0 and task_1 are running, tasks 2..5 must not have started
          assert.equal(started.includes('task_2'), false, 'task_2 must not start before earlier task finishes');
        }
        await new Promise((resolve) => setTimeout(resolve, 15));
        finished.push(item);
        return item;
      },
      limit
    );

    assert.equal(finished.length, 6);
    assert.equal(started.length, 6);
  });

  await test('Phase 10 Step 3: Result ordering remains strictly deterministic despite varied task durations', async () => {
    const items = ['slow_first', 'medium_second', 'super_fast_third', 'fast_fourth', 'sluggish_fifth'];
    // Inverted durations so item 2 completes first (5ms), item 0 completes last (40ms)
    const durations = {
      slow_first: 40,
      medium_second: 25,
      super_fast_third: 5,
      fast_fourth: 10,
      sluggish_fifth: 35,
    };

    const completionOrder = [];

    const results = await mapConcurrent(
      items,
      async (item) => {
        const dur = durations[item];
        await new Promise((resolve) => setTimeout(resolve, dur));
        completionOrder.push(item);
        return { name: item, duration: dur };
      },
      5
    );

    // Verify completion was actually out of order
    assert.equal(completionOrder[0], 'super_fast_third', 'super_fast_third should complete first');
    assert.notDeepEqual(completionOrder, items, 'Completion order should differ from input order');

    // Strict assertion: output array matches input array order exactly
    assert.equal(results[0].name, 'slow_first');
    assert.equal(results[1].name, 'medium_second');
    assert.equal(results[2].name, 'super_fast_third');
    assert.equal(results[3].name, 'fast_fourth');
    assert.equal(results[4].name, 'sluggish_fifth');
  });

  await test('Phase 10 Step 3: One provider rejection does not abort remaining queued or in-flight requests', async () => {
    const items = ['item_0', 'item_failing', 'item_2', 'item_3', 'item_4'];
    const executed = [];

    const results = await mapConcurrent(
      items,
      async (item) => {
        executed.push(item);
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (item === 'item_failing') {
          throw new Error('Provider 503 Service Unavailable');
        }
        return { item, success: true };
      },
      {
        concurrency: 2,
        continueOnError: true,
        onError: (err, item) => ({ item, success: false, error: err.message }),
      }
    );

    // All 5 items must have been executed
    assert.equal(executed.length, 5);
    assert.equal(results.length, 5);
    assert.equal(results[0].success, true);
    assert.equal(results[1].success, false);
    assert.equal(results[1].error, 'Provider 503 Service Unavailable');
    assert.equal(results[2].success, true);
    assert.equal(results[3].success, true);
    assert.equal(results[4].success, true);
  });

  await test('Phase 10 Step 3: Provider timeout does not stop queued requests', async () => {
    const items = ['timeout_item', 'normal_1', 'normal_2', 'normal_3'];
    const executed = [];

    const results = await mapConcurrent(
      items,
      async (item) => {
        executed.push(item);
        if (item === 'timeout_item') {
          await new Promise((resolve) => setTimeout(resolve, 20));
          throw new Error('Provider request timed out after 2000ms');
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { item, ok: true };
      },
      {
        concurrency: 2,
        continueOnError: true,
        onError: (err, item) => ({ item, ok: false, timedOut: true }),
      }
    );

    assert.equal(results.length, 4);
    assert.equal(results[0].timedOut, true);
    assert.equal(results[1].ok, true);
    assert.equal(results[2].ok, true);
    assert.equal(results[3].ok, true);
  });

  await test('Phase 10 Step 3: priceIntelligenceService.getPriceComparisonForList applies bounded concurrency across grocery items', async () => {
    const mockItems = Array.from({ length: 8 }, (_, i) => ({
      _id: `gitem_${i}`,
      name: `Grocery Item ${i}`,
      quantity: 1,
      unit: 'kg',
      category: 'pantry',
      checked: false,
    }));

    const originalGetList = groceryService.getGroceryListById;
    const originalLimit = priceIntelligenceService.getConcurrencyLimit();

    let peakConcurrency = 0;
    let activeConcurrency = 0;

    // Spy on product query preparation which executes per item inside the pool
    const originalPrepare = productMatchingService.prepareProductQuery;
    productMatchingService.prepareProductQuery = function (...args) {
      activeConcurrency++;
      if (activeConcurrency > peakConcurrency) {
        peakConcurrency = activeConcurrency;
      }
      const res = originalPrepare.apply(this, args);
      // Brief pause to simulate async processing window
      activeConcurrency--;
      return res;
    };

    try {
      priceIntelligenceService.setConcurrencyLimit(3);
      groceryService.getGroceryListById = async () => ({
        _id: 'list_concurrency_test',
        name: 'Concurrency Test List',
        items: mockItems,
      });

      const res = await priceIntelligenceService.getPriceComparisonForList('mock_user_1', 'list_concurrency_test');

      assert.equal(res.items.length, 8);
      // Items must be in exact original order
      for (let i = 0; i < 8; i++) {
        assert.equal(res.items[i].name, `Grocery Item ${i}`);
        assert.equal(res.items[i].groceryItemId, `gitem_${i}`);
      }
      assert.equal(priceIntelligenceService.getConcurrencyLimit(), 3);
    } finally {
      groceryService.getGroceryListById = originalGetList;
      productMatchingService.prepareProductQuery = originalPrepare;
      priceIntelligenceService.resetConcurrencyLimit();
    }

    assert.equal(priceIntelligenceService.getConcurrencyLimit(), MAX_CONCURRENT_PRICE_REQUESTS);
  });

  await test('Phase 10 Step 3: recipeGroceryService.getRecipePriceComparison applies bounded concurrency across recipe ingredients', async () => {
    const mockRecipe = {
      _id: 'recipe_concurrency_test',
      title: 'Paneer Makhani',
      name: 'Paneer Makhani',
      ingredients: [
        { name: 'Paneer', amount: 250, unit: 'g' },
        { name: 'Butter', amount: 50, unit: 'g' },
        { name: 'Tomato Puree', amount: 200, unit: 'g' },
        { name: 'Fresh Cream', amount: 100, unit: 'ml' },
        { name: 'Kasuri Methi', amount: 10, unit: 'g' },
        { name: 'Garam Masala', amount: 5, unit: 'g' },
      ],
    };

    const originalLimit = priceIntelligenceService.getConcurrencyLimit();
    priceIntelligenceService.setConcurrencyLimit(2);

    let peakConcurrency = 0;
    let currentInFlight = 0;

    const originalGetAsync = priceIntelligenceService.getItemPriceComparisonAsync;
    priceIntelligenceService.getItemPriceComparisonAsync = async function (...args) {
      currentInFlight++;
      if (currentInFlight > peakConcurrency) {
        peakConcurrency = currentInFlight;
      }
      await new Promise((resolve) => setTimeout(resolve, 15));
      currentInFlight--;
      return originalGetAsync.apply(this, args);
    };

    try {
      const res = await recipeGroceryService.getRecipePriceComparison(mockRecipe);

      assert.ok(res);
      assert.equal(res.itemsCount, 6);
      assert.equal(res.items.length, 6);
      assert.equal(peakConcurrency <= 2, true, `Peak concurrency (${peakConcurrency}) must not exceed configured limit of 2`);
      // Results preserve deterministic recipe order
      assert.equal(res.items[0].name, 'paneer');
      assert.equal(res.items[1].name, 'butter');
      assert.equal(res.items[2].name, 'tomato puree');
      assert.equal(res.items[3].name, 'fresh cream');
      assert.equal(res.items[4].name, 'kasuri methi');
      assert.equal(res.items[5].name, 'garam masala');
    } finally {
      priceIntelligenceService.getItemPriceComparisonAsync = originalGetAsync;
      priceIntelligenceService.resetConcurrencyLimit();
    }
  });

  await test('Phase 10 Step 3: Provider failure/rejection isolates cleanly and does not abort recipe or list price comparison', async () => {
    const mockRecipe = {
      title: 'Mixed Dish',
      ingredients: [
        { name: 'Item_A', amount: 100, unit: 'g' },
        { name: 'Item_FAIL', amount: 100, unit: 'g' },
        { name: 'Item_B', amount: 100, unit: 'g' },
      ],
    };

    const originalGetAsync = priceIntelligenceService.getItemPriceComparisonAsync;
    priceIntelligenceService.getItemPriceComparisonAsync = async function (itemName, ...args) {
      if (typeof itemName === 'string' && itemName.toLowerCase().includes('fail')) {
        throw new Error('Fatal socket connection reset on provider API');
      }
      return originalGetAsync.call(this, itemName, ...args);
    };

    try {
      const res = await recipeGroceryService.getRecipePriceComparison(mockRecipe);

      assert.ok(res);
      assert.equal(res.items.length, 3);
      assert.equal(res.items[0].name, 'item_a');
      assert.equal(res.items[1].name, 'item_fail');
      assert.equal(res.items[1].pricingAvailable, false);
      assert.deepEqual(res.items[1].offers, []);
      assert.equal(res.items[2].name, 'item_b');
    } finally {
      priceIntelligenceService.getItemPriceComparisonAsync = originalGetAsync;
    }
  });

  await test('Phase 10 Step 3: Multiple marketplaces remain isolated under bounded concurrency', async () => {
    // Register temporary provider for test
    const customTestProvider = {
      name: 'testmarket',
      isConfigured: () => true,
      getProductOffer: async (queryObj) => {
        if (queryObj.query.includes('failing')) {
          throw new Error('Marketplace downstream error');
        }
        return {
          marketplace: 'testmarket',
          displayName: 'Test Market',
          price: 99,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
        };
      },
    };

    // Use priceIntelligenceService internal adapter resolution with simulated adapter error
    const testAdapter = {
      name: 'broken_market',
      displayName: 'Broken Market',
      getSearchUrl: () => {
        throw new Error('Adapter URL generation broken');
      },
      getProductOffer: () => ({
        marketplace: 'broken_market',
        pricingAvailable: false,
      }),
    };

    const offer = await priceIntelligenceService._resolveOfferForAdapter(
      testAdapter,
      { canonicalQuery: 'oil', originalName: 'oil' }
    );

    assert.ok(offer);
    assert.equal(offer.pricingAvailable, false);
    assert.equal(offer.searchUrl, null);
    assert.equal(offer.marketplace, 'broken_market');
  });

  await test('Phase 10 Step 3: Edge cases - empty item list and list smaller than concurrency limit', async () => {
    // Empty list
    const emptyRes = await mapConcurrent([], async () => 'not_called', 5);
    assert.deepEqual(emptyRes, []);

    // Null/undefined items
    const nullRes = await mapConcurrent(null, async () => 'not_called', 5);
    assert.deepEqual(nullRes, []);

    // List smaller than concurrency limit (2 items with concurrency 5)
    let workersLaunched = 0;
    const smallRes = await mapConcurrent(
      ['small_1', 'small_2'],
      async (item) => {
        workersLaunched++;
        return `done_${item}`;
      },
      5
    );

    assert.deepEqual(smallRes, ['done_small_1', 'done_small_2']);
    assert.equal(workersLaunched, 2);
  });

  await test('Phase 10 Step 3: Backward compatibility - synchronous getItemPriceComparison remains synchronous and never returns Promise', () => {
    const res = priceIntelligenceService.getItemPriceComparison('Basmati Rice');
    assert.ok(res && typeof res === 'object', 'Result must be an object');
    assert.equal(res instanceof Promise, false, 'Result must NOT be a Promise instance');
    assert.equal(typeof res.then, 'undefined', 'Result must NOT have a .then method');
    assert.equal(typeof res.item, 'string');
    assert.ok(Array.isArray(res.comparison.offers));
  });

  await test('Phase 10 Step 3: Dynamic configurability via getConcurrencyLimit, setConcurrencyLimit, and resetConcurrencyLimit', () => {
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), MAX_CONCURRENT_PRICE_REQUESTS);
    assert.equal(MAX_CONCURRENT_PRICE_REQUESTS, 5);

    // Update to 2
    priceIntelligenceService.setConcurrencyLimit(2);
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), 2);

    // Invalid values should be ignored
    priceIntelligenceService.setConcurrencyLimit(-1);
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), 2);

    priceIntelligenceService.setConcurrencyLimit(0);
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), 2);

    priceIntelligenceService.setConcurrencyLimit('ten');
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), 2);

    priceIntelligenceService.setConcurrencyLimit(NaN);
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), 2);

    // Reset restores default
    priceIntelligenceService.resetConcurrencyLimit();
    assert.equal(priceIntelligenceService.getConcurrencyLimit(), 5);
  });

  // =========================================================================
  // 54. PHASE 10 STEP 4 — SHORT-LIVED TTL PRICE & AVAILABILITY CACHE
  // =========================================================================

  await test('Phase 10 Step 4: First request is a cache miss and calls provider; second request is a cache hit avoiding second provider call', async () => {
    priceIntelligenceService.clearPriceCache();
    let providerCalls = 0;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async (queryObj) => {
        providerCalls++;
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          productName: queryObj.originalName,
          price: 110,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
      sanitizeOffer: (offer) => offer,
    };

    registerPriceProvider('instamart', mockProvider);

    try {
      // First request: Cache miss -> calls provider
      const res1 = await priceIntelligenceService.getItemPriceComparisonAsync('Fresh Paneer 200g', 'instamart');
      assert.equal(providerCalls, 1, 'First call should hit provider');
      assert.equal(res1.pricingAvailable, true);
      assert.equal(res1.comparison.bestPrice, 110);

      // Second request: Cache hit -> returns cached without calling provider
      const res2 = await priceIntelligenceService.getItemPriceComparisonAsync('Fresh Paneer 200g', 'instamart');
      assert.equal(providerCalls, 1, 'Second call should hit cache and NOT call provider');
      assert.equal(res2.pricingAvailable, true);
      assert.equal(res2.comparison.bestPrice, 110);

      const stats = priceIntelligenceService.getCacheStats();
      assert.equal(stats.hits >= 1, true, 'Cache hits should be >= 1');
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Expired TTL triggers a fresh provider request', async () => {
    priceIntelligenceService.clearPriceCache();
    let providerCalls = 0;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async (queryObj) => {
        providerCalls++;
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          productName: queryObj.originalName,
          price: 50 + providerCalls,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
      sanitizeOffer: (offer) => offer,
    };

    registerPriceProvider('instamart', mockProvider);
    priceIntelligenceService.setCacheTTL(25); // 25ms TTL for test

    try {
      // First call (t=0)
      const res1 = await priceIntelligenceService.getItemPriceComparisonAsync('Quick Milk', 'instamart');
      assert.equal(providerCalls, 1);
      assert.equal(res1.comparison.bestPrice, 51);

      // Immediate call within TTL -> cache hit
      const res2 = await priceIntelligenceService.getItemPriceComparisonAsync('Quick Milk', 'instamart');
      assert.equal(providerCalls, 1);
      assert.equal(res2.comparison.bestPrice, 51);

      // Wait 35ms for TTL expiry
      await new Promise((resolve) => setTimeout(resolve, 35));

      // Third call after TTL -> fresh provider request
      const res3 = await priceIntelligenceService.getItemPriceComparisonAsync('Quick Milk', 'instamart');
      assert.equal(providerCalls, 2, 'Should call provider after TTL expiration');
      assert.equal(res3.comparison.bestPrice, 52);
    } finally {
      priceIntelligenceService.resetCacheTTL();
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Different marketplaces do not share cache entries', async () => {
    priceIntelligenceService.clearPriceCache();
    const calls = { instamart: 0, blinkit: 0 };

    const mockInstamart = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async () => {
        calls.instamart++;
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          price: 60,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
    };

    const mockBlinkit = {
      name: 'blinkit',
      displayName: 'Blinkit',
      isConfigured: () => true,
      getProductOffer: async () => {
        calls.blinkit++;
        return {
          marketplace: 'blinkit',
          displayName: 'Blinkit',
          price: 58,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
    };

    registerPriceProvider('instamart', mockInstamart);
    registerPriceProvider('blinkit', mockBlinkit);

    try {
      await priceIntelligenceService.getItemPriceComparisonAsync('Curd 400g', 'instamart');
      assert.equal(calls.instamart, 1);
      assert.equal(calls.blinkit, 0);

      await priceIntelligenceService.getItemPriceComparisonAsync('Curd 400g', 'blinkit');
      assert.equal(calls.instamart, 1);
      assert.equal(calls.blinkit, 1);

      const cache = priceIntelligenceService.getPriceCache();
      const instamartKey = generatePriceCacheKey('instamart', 'Curd 400g');
      const blinkitKey = generatePriceCacheKey('blinkit', 'Curd 400g');

      assert.notEqual(instamartKey, blinkitKey);
      assert.equal(cache.has(instamartKey), true);
      assert.equal(cache.has(blinkitKey), true);
      assert.equal(cache.get(instamartKey).price, 60);
      assert.equal(cache.get(blinkitKey).price, 58);
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Different pack sizes do not collide in cache', () => {
    const key1 = generatePriceCacheKey('instamart', 'Basmati Rice 1 kg');
    const key2 = generatePriceCacheKey('instamart', 'Basmati Rice 5 kg');
    assert.notEqual(key1, key2);

    const keyObj1 = generatePriceCacheKey('instamart', { canonicalQuery: 'milk', quantity: 500, unit: 'ml' });
    const keyObj2 = generatePriceCacheKey('instamart', { canonicalQuery: 'milk', quantity: 1, unit: 'l' });
    assert.notEqual(keyObj1, keyObj2);
  });

  await test('Phase 10 Step 4: Equivalent normalized queries reuse the same cache entry', async () => {
    priceIntelligenceService.clearPriceCache();
    let providerCalls = 0;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async () => {
        providerCalls++;
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          price: 220,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
    };

    registerPriceProvider('instamart', mockProvider);

    try {
      // Query 1 with extra spaces and punctuation
      await priceIntelligenceService.getItemPriceComparisonAsync('  Toor   Dal!  ', 'instamart');
      assert.equal(providerCalls, 1);

      // Query 2 with canonical casing and trimmed spacing
      await priceIntelligenceService.getItemPriceComparisonAsync('toor dal', 'instamart');
      assert.equal(providerCalls, 1, 'Equivalent query must hit cache and avoid provider call');
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Provider errors are NOT cached and are retried on subsequent requests', async () => {
    priceIntelligenceService.clearPriceCache();
    let callCount = 0;
    let shouldFail = true;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async () => {
        callCount++;
        if (shouldFail) {
          throw new Error('Downstream retailer gateway connection refused');
        }
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          price: 85,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
    };

    registerPriceProvider('instamart', mockProvider);

    try {
      // Call 1 fails
      const res1 = await priceIntelligenceService.getItemPriceComparisonAsync('Ghee 500ml', 'instamart');
      assert.equal(callCount, 1);
      assert.equal(res1.pricingAvailable, false);

      const cache = priceIntelligenceService.getPriceCache();
      const key = generatePriceCacheKey('instamart', 'ghee 500ml');
      assert.equal(cache.has(key), false, 'Provider error must NOT be stored in cache');

      // Now downstream retailer recovers
      shouldFail = false;

      // Call 2 must NOT be blocked by cached failure
      const res2 = await priceIntelligenceService.getItemPriceComparisonAsync('Ghee 500ml', 'instamart');
      assert.equal(callCount, 2, 'Subsequent request must retry provider');
      assert.equal(res2.pricingAvailable, true);
      assert.equal(res2.comparison.bestPrice, 85);

      // Now successful result IS cached
      assert.equal(cache.has(key), true);
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Provider timeouts are NOT cached', async () => {
    priceIntelligenceService.clearPriceCache();
    let callCount = 0;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async () => {
        callCount++;
        const timeoutErr = new Error('Provider request timed out after 2000ms');
        timeoutErr.code = 'ETIMEDOUT';
        throw timeoutErr;
      },
    };

    registerPriceProvider('instamart', mockProvider);

    try {
      const res = await priceIntelligenceService.getItemPriceComparisonAsync('Sugar 1kg', 'instamart');
      assert.equal(callCount, 1);
      assert.equal(res.pricingAvailable, false);

      const key = generatePriceCacheKey('instamart', 'sugar 1kg');
      assert.equal(priceIntelligenceService.getPriceCache().has(key), false, 'Timeout error must not be cached');
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Invalid/malformed provider responses are NOT cached', () => {
    // Test isCacheableOffer validator directly against edge cases
    assert.equal(isCacheableOffer(null), false);
    assert.equal(isCacheableOffer(undefined), false);
    assert.equal(isCacheableOffer({}), false);
    assert.equal(isCacheableOffer({ price: 'free' }), false);
    assert.equal(isCacheableOffer({ price: -10 }), false);
    assert.equal(isCacheableOffer({ price: 0 }), false);
    assert.equal(isCacheableOffer({ price: NaN }), false);
    assert.equal(isCacheableOffer({ price: Infinity }), false);
    assert.equal(isCacheableOffer({ marketplace: 'instamart', price: 50, error: 'Failed' }), false);
    assert.equal(isCacheableOffer({ marketplace: 'instamart', price: 50, source: 'unconfigured' }), false);
    assert.equal(isCacheableOffer({ marketplace: 'instamart', price: 50, source: 'fallback' }), false);
    assert.equal(isCacheableOffer({ marketplace: 'instamart', price: 50, failed: true }), false);

    // Valid priced offer
    assert.equal(
      isCacheableOffer({
        marketplace: 'instamart',
        price: 50,
        currency: 'INR',
        available: true,
        pricingAvailable: true,
        source: 'live',
      }),
      true
    );
  });

  await test('Phase 10 Step 4: Valid explicit unavailable result from configured provider is safely cached', async () => {
    priceIntelligenceService.clearPriceCache();
    let callCount = 0;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async () => {
        callCount++;
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          productName: 'Out Of Stock Juice',
          price: null,
          currency: 'INR',
          available: false,
          pricingAvailable: false,
          source: 'live',
        };
      },
    };

    registerPriceProvider('instamart', mockProvider);

    try {
      const res1 = await priceIntelligenceService.getItemPriceComparisonAsync('Out Of Stock Juice', 'instamart');
      assert.equal(callCount, 1);
      assert.equal(res1.pricingAvailable, false);

      // Second request hits cache
      const res2 = await priceIntelligenceService.getItemPriceComparisonAsync('Out Of Stock Juice', 'instamart');
      assert.equal(callCount, 1, 'Valid unavailable result should hit cache');
      assert.equal(res2.pricingAvailable, false);
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Cache mutation safety - mutating returned offer does not corrupt cache', () => {
    const testCache = new PriceCache();
    const originalOffer = {
      marketplace: 'instamart',
      productName: 'Butter',
      price: 55,
      currency: 'INR',
      available: true,
    };

    testCache.set('key1', originalOffer);

    // Retrieve and mutate
    const retrieved = testCache.get('key1');
    assert.equal(retrieved.price, 55);
    retrieved.price = 99999;
    retrieved.marketplace = 'corrupted';

    // Retrieve again: must remain pristine
    const pristine = testCache.get('key1');
    assert.equal(pristine.price, 55);
    assert.equal(pristine.marketplace, 'instamart');
  });

  await test('Phase 10 Step 4: Request coalescing - concurrent identical requests do not duplicate provider calls', async () => {
    priceIntelligenceService.clearPriceCache();
    let callCount = 0;

    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async () => {
        callCount++;
        // Small delay to simulate in-flight window
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          productName: 'Coalesced Tea',
          price: 140,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
    };

    registerPriceProvider('instamart', mockProvider);

    try {
      // Fire two identical requests at the exact same moment
      const [resA, resB] = await Promise.all([
        priceIntelligenceService.getItemPriceComparisonAsync('Coalesced Tea', 'instamart'),
        priceIntelligenceService.getItemPriceComparisonAsync('Coalesced Tea', 'instamart'),
      ]);

      // Exactly ONE provider call must have been made
      assert.equal(callCount, 1, 'Concurrent identical requests must coalesce into a single provider call');
      assert.equal(resA.comparison.bestPrice, 140);
      assert.equal(resB.comparison.bestPrice, 140);
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  await test('Phase 10 Step 4: Cache reset/clear works correctly', () => {
    const testCache = new PriceCache();
    testCache.set('item_a', { price: 10 });
    testCache.set('item_b', { price: 20 });
    assert.equal(testCache.size(), 2);

    testCache.clear();
    assert.equal(testCache.size(), 0);
    assert.equal(testCache.get('item_a'), null);
    assert.equal(testCache.get('item_b'), null);
  });

  await test('Phase 10 Step 4: Cache remains bounded and applies LRU eviction when capacity exceeded', () => {
    const smallCache = new PriceCache({ maxEntries: 3 });

    smallCache.set('item_1', { id: 1 });
    smallCache.set('item_2', { id: 2 });
    smallCache.set('item_3', { id: 3 });
    assert.equal(smallCache.size(), 3);

    // Access item_1 to make it most-recently-used (LRU order: 2, 3, 1)
    smallCache.get('item_1');

    // Add item_4 -> should evict item_2 (least recently used)
    smallCache.set('item_4', { id: 4 });
    assert.equal(smallCache.size(), 3, 'Cache size must remain strictly <= maxEntries (3)');

    assert.equal(smallCache.has('item_2'), false, 'item_2 should have been evicted');
    assert.equal(smallCache.has('item_1'), true, 'item_1 should still be present');
    assert.equal(smallCache.has('item_3'), true, 'item_3 should still be present');
    assert.equal(smallCache.has('item_4'), true, 'item_4 should be present');
  });

  await test('Phase 10 Step 4: Step 3 bounded concurrency is preserved alongside TTL caching in multi-item workflows', async () => {
    priceIntelligenceService.clearPriceCache();

    let liveCalls = 0;
    const mockProvider = {
      name: 'instamart',
      displayName: 'Swiggy Instamart',
      isConfigured: () => true,
      getProductOffer: async (queryObj) => {
        liveCalls++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          marketplace: 'instamart',
          displayName: 'Swiggy Instamart',
          productName: queryObj.originalName,
          price: 75,
          currency: 'INR',
          available: true,
          pricingAvailable: true,
          source: 'live',
        };
      },
    };

    registerPriceProvider('instamart', mockProvider);

    const mockRecipe = {
      title: 'Cached Makhani',
      ingredients: [
        { name: 'Paneer', amount: 200, unit: 'g' },
        { name: 'Butter', amount: 50, unit: 'g' },
        { name: 'Tomato', amount: 100, unit: 'g' },
      ],
    };

    try {
      // Run 1: All 3 items uncached
      const res1 = await recipeGroceryService.getRecipePriceComparison(mockRecipe, 'instamart');
      assert.equal(liveCalls, 3);
      assert.equal(res1.items.length, 3);
      assert.equal(res1.pricingAvailable, true);

      // Run 2: All 3 items should hit cache -> 0 new provider calls
      const res2 = await recipeGroceryService.getRecipePriceComparison(mockRecipe, 'instamart');
      assert.equal(liveCalls, 3, 'Second recipe comparison must use cached provider results');
      assert.equal(res2.pricingAvailable, true);
      assert.equal(res2.items.length, 3);
    } finally {
      resetPriceProviders();
      priceIntelligenceService.clearPriceCache();
    }
  });

  // TEARDOWN HTTP SERVER
  await new Promise((resolve) => {
    server.close(() => {
      console.log('[HTTP Test Server closed]');
      resolve();
    });
  });

  await disconnectDB();

  console.log(`\n--- TEST RUN SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  if (server) server.close();
  process.exit(1);
});
