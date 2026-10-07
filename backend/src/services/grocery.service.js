import mongoose from 'mongoose';
import GroceryList from '../models/groceryList.model.js';
import MealPlan from '../models/mealPlan.model.js';
import Recipe from '../models/recipe.model.js';
import groceryIntelligenceService from './groceryIntelligence.service.js';
import { categorizeIngredientName } from '../utils/groceryValidation.js';
import { badRequest, notFound, forbidden } from '../utils/apiError.js';

/**
 * Service to manage GroceryList business logic and database interactions
 */
class GroceryService {
  /**
   * Create a new grocery list
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} data
   * @returns {Promise<GroceryList>}
   */
  async createGroceryList(userId, data) {
    return GroceryList.create({
      ...data,
      user: userId,
    });
  }

  /**
   * Get all grocery lists for authenticated user with pagination
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} pagination
   * @returns {Promise<{ groceryLists: Array, pagination: Object }>}
   */
  async getGroceryLists(userId, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pagination.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { user: userId };

    const [groceryLists, total] = await Promise.all([
      GroceryList.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GroceryList.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      groceryLists,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get a single grocery list by ID with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} listId
   * @returns {Promise<GroceryList>}
   */
  async getGroceryListById(userId, listId) {
    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      throw badRequest('Invalid grocery list ID format.');
    }

    const list = await GroceryList.findById(listId);
    if (!list) {
      throw notFound('Grocery list not found.');
    }

    if (list.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to access this grocery list.');
    }

    return list;
  }

  /**
   * Update an existing grocery list with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} listId
   * @param {Object} data
   * @returns {Promise<GroceryList>}
   */
  async updateGroceryList(userId, listId, data) {
    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      throw badRequest('Invalid grocery list ID format.');
    }

    const list = await GroceryList.findById(listId);
    if (!list) {
      throw notFound('Grocery list not found.');
    }

    if (list.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to modify this grocery list.');
    }

    Object.assign(list, data);
    await list.save();
    return list;
  }

  /**
   * Delete an existing grocery list with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} listId
   * @returns {Promise<boolean>}
   */
  async deleteGroceryList(userId, listId) {
    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      throw badRequest('Invalid grocery list ID format.');
    }

    const list = await GroceryList.findById(listId);
    if (!list) {
      throw notFound('Grocery list not found.');
    }

    if (list.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to delete this grocery list.');
    }

    await GroceryList.findByIdAndDelete(listId);
    return true;
  }

  /**
   * Add a grocery item to an existing list
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} listId
   * @param {Object} itemData
   * @returns {Promise<GroceryList>}
   */
  async addItem(userId, listId, itemData) {
    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      throw badRequest('Invalid grocery list ID format.');
    }

    const list = await GroceryList.findById(listId);
    if (!list) {
      throw notFound('Grocery list not found.');
    }

    if (list.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to modify this grocery list.');
    }

    list.items.push(itemData);
    await list.save();
    return list;
  }

  /**
   * Update an existing grocery item within a list
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} listId
   * @param {string} itemId
   * @param {Object} itemData
   * @returns {Promise<GroceryList>}
   */
  async updateItem(userId, listId, itemId, itemData) {
    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      throw badRequest('Invalid grocery list ID format.');
    }
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw badRequest('Invalid item ID format.');
    }

    const list = await GroceryList.findById(listId);
    if (!list) {
      throw notFound('Grocery list not found.');
    }

    if (list.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to modify this grocery list.');
    }

    const item = list.items.id(itemId);
    if (!item) {
      throw notFound('Grocery item not found in this list.');
    }

    if (itemData.name !== undefined) item.name = itemData.name;
    if (itemData.quantity !== undefined) item.quantity = itemData.quantity;
    if (itemData.unit !== undefined) item.unit = itemData.unit;
    if (itemData.category !== undefined) item.category = itemData.category;
    if (itemData.checked !== undefined) item.checked = Boolean(itemData.checked);

    await list.save();
    return list;
  }

  /**
   * Remove an item from a grocery list
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} listId
   * @param {string} itemId
   * @returns {Promise<GroceryList>}
   */
  async removeItem(userId, listId, itemId) {
    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      throw badRequest('Invalid grocery list ID format.');
    }
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw badRequest('Invalid item ID format.');
    }

    const list = await GroceryList.findById(listId);
    if (!list) {
      throw notFound('Grocery list not found.');
    }

    if (list.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to modify this grocery list.');
    }

    const item = list.items.id(itemId);
    if (!item) {
      throw notFound('Grocery item not found in this list.');
    }

    list.items.pull(itemId);
    await list.save();
    return list;
  }

  /**
   * Aggregate ingredients from a user's meal plan into a consolidated, normalized grocery list
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} mealPlanId
   * @param {Object} [options={}]
   * @returns {Promise<GroceryList>}
   */
  async createFromMealPlan(userId, mealPlanId, options = {}) {
    return groceryIntelligenceService.createFromMealPlan(userId, mealPlanId, options);
  }

  /**
   * Aggregate ingredients from one or more recipes into a new normalized GroceryList
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Array<string>} recipeIds
   * @param {Object} [options={}]
   * @returns {Promise<GroceryList>}
   */
  async createFromRecipes(userId, recipeIds, options = {}) {
    return groceryIntelligenceService.createFromRecipes(userId, recipeIds, options);
  }

  /**
   * Append ingredients from one or more recipes into an existing GroceryList
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} groceryListId
   * @param {Array<string>} recipeIds
   * @returns {Promise<GroceryList>}
   */
  async addRecipesToList(userId, groceryListId, recipeIds) {
    return groceryIntelligenceService.addRecipesToList(userId, groceryListId, recipeIds);
  }
}

export default new GroceryService();
