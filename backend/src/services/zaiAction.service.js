import { ZAI_ACTIONS, isValidZaiAction } from '../utils/zaiActionContract.js';
import { validateStructuredAction } from '../utils/zaiActionValidation.js';
import zaiResolverService from './zaiResolver.service.js';
import geminiService, { sanitizeUserContext } from './gemini.service.js';
import preferenceService from './preference.service.js';
import recipeService from './recipe.service.js';
import mealPlanService from './mealPlan.service.js';
import groceryService from './grocery.service.js';
import zaiConversationService from './zaiConversation.service.js';
import foodAnalysisService from './foodAnalysis.service.js';
import foodDiaryService from './foodDiary.service.js';
import recipeIntelligenceService from './recipeIntelligence.service.js';
import groceryIntelligenceService from './groceryIntelligence.service.js';
import priceIntelligenceService from './priceIntelligence.service.js';
import recipeGroceryService from './recipeGrocery.service.js';
import dietaryConstraintService from './dietaryConstraint.service.js';
import aiRecipeService from './ai/aiRecipe.service.js';
import { getDefaultAiRecipeProvider } from './ai/index.js';
import { badRequest } from '../utils/apiError.js';

/**
 * Zai Orchestration Layer Service
 * Orchestrates user intent resolution via Gemini (with deterministic fallback)
 * and delegates to existing domain services.
 * Does not duplicate business logic or database models.
 */
class ZaiActionService {
  /**
   * Retrieve preferences for the authenticated user
   * Existing UserPreference model and preferenceService remain the single source of truth.
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<Object|null>}
   */
  async getUserContext(userId) {
    if (!userId) return null;
    try {
      return await preferenceService.getPreferencesByUserId(userId);
    } catch {
      return null;
    }
  }

  /**
   * Dispatches a resolved action to the appropriate domain service
   * @param {string} action - One of SUPPORTED_ACTIONS
   * @param {Object} parameters - Structured action parameters
   * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
   * @param {Object|null} context - User preference context
   * @returns {Promise<{ message: string, data: any }>}
   */
  async dispatchAction(action, parameters = {}, userId, context = null) {
    if (!isValidZaiAction(action)) {
      throw badRequest(`Unsupported action type: ${action}`);
    }

    switch (action) {
      case ZAI_ACTIONS.RECIPE_GENERATION: {
        // When AI provider is configured and recipe generation is requested
        const aiProvider = getDefaultAiRecipeProvider();
        if (parameters.generateRecipe && aiProvider.isConfigured()) {
          try {
            const result = await recipeIntelligenceService.generatePersonalizedRecipe(
              userId,
              parameters,
              { persist: Boolean(parameters.persist || parameters.save) }
            );

            if (result && result.recipe) {
              const recipe = result.recipe;
              const rName = recipe.name || recipe.title || 'Personalized Recipe';
              const rCals = recipe.nutrition?.calories ? ` (~${recipe.nutrition.calories} kcal)` : '';

              const isCompound = Boolean(parameters.includeGroceries || parameters.includePricing);

              if (!isCompound) {
                return {
                  message: `I've created a personalized recipe for you: ${rName}${rCals}.`,
                  data: recipe,
                };
              }

              // Pipeline Step 2: Extract grocery items via recipeGroceryService
              let groceryItems = null;
              let groceryError = null;

              if (parameters.includeGroceries || parameters.includePricing) {
                try {
                  groceryItems = recipeGroceryService.recipeToGroceryItems(recipe);
                } catch (gErr) {
                  groceryError = gErr.message || 'Failed to extract grocery items';
                }
              }

              // Pipeline Step 3: Evaluate marketplace price comparison / shopping links
              let priceComparison = null;
              let pricingError = null;

              if (parameters.includePricing) {
                try {
                  priceComparison = await recipeGroceryService.getRecipePriceComparison(
                    recipe,
                    parameters.preferredMarketplace || null
                  );
                } catch (pErr) {
                  pricingError = pErr.message || 'Failed to compare prices';
                }
              }

              // Build unified conversational response message
              let responseMessage = `I've created a personalized recipe for you: ${rName}${rCals}.`;

              if (parameters.includeGroceries) {
                if (groceryItems && groceryItems.length > 0) {
                  responseMessage += ` Here is your consolidated grocery list with ${groceryItems.length} grocery item(s).`;
                } else if (groceryError) {
                  responseMessage += ` Grocery list generation could not be completed at this time.`;
                }
              }

              if (parameters.includePricing) {
                if (priceComparison) {
                  if (priceComparison.pricingAvailable) {
                    const bestItem = priceComparison.items?.find((i) => i.comparison?.bestOffers?.[0]);
                    const bestOffer = bestItem?.comparison?.bestOffers?.[0];
                    const storeName = bestOffer?.displayName || priceComparison.comparison?.bestMarketplace || 'quick-commerce';
                    responseMessage += ` Price comparison is ready with best offers on ${storeName}.`;
                  } else {
                    responseMessage += ` Live price comparison is currently unconfigured. Verified shopping search links have been generated for your ingredients.`;
                  }
                } else if (pricingError) {
                  responseMessage += ` Marketplace pricing is currently unavailable.`;
                }
              }

              return {
                success: true,
                action: ZAI_ACTIONS.RECIPE_GENERATION,
                message: responseMessage,
                data: {
                  recipe,
                  groceryItems: groceryItems || [],
                  priceComparison: priceComparison || null,
                  metadata: {
                    recipeGenerated: true,
                    groceriesGenerated: Boolean(groceryItems && groceryItems.length > 0),
                    pricingAvailable: Boolean(priceComparison?.pricingAvailable),
                    groceryFailed: Boolean(groceryError),
                    pricingFailed: Boolean(pricingError),
                    groceryError: groceryError || null,
                    pricingError: pricingError || null,
                  },
                },
              };
            }
          } catch (genErr) {
            // Case 1: Recipe generation fails. Return controlled error.
            return {
              success: false,
              action: ZAI_ACTIONS.RECIPE_GENERATION,
              message: `Could not generate recipe: ${genErr.message || 'AI provider error'}.`,
              data: null,
              error: genErr.message,
            };
          }
        }

        // Controlled fallback response for unconfigured provider or when generation is unavailable
        const ingredientsText =
          parameters.ingredients && parameters.ingredients.length > 0
            ? parameters.ingredients.join(', ')
            : null;

        const constraintsNotice =
          Array.isArray(parameters.dietaryConstraints) && parameters.dietaryConstraints.length > 0
            ? ` compatible with selected constraints (${parameters.dietaryConstraints.join(', ')})`
            : '';

        let responseMessage = 'Recipe generation request acknowledged.';
        if (ingredientsText) {
          responseMessage = `Recipe generation requested for ingredients: ${ingredientsText}${constraintsNotice}. AI recipe generation will be enabled when the AI provider is configured.`;
        } else {
          responseMessage =
            `Recipe generation request received${constraintsNotice}. AI recipe generation will be enabled when the AI provider is configured.`;
        }

        return {
          message: responseMessage,
          data: null,
        };
      }

      case ZAI_ACTIONS.MEAL_PLANNING: {
        // Delegate to existing mealPlanService
        const result = await mealPlanService.getMealPlans(userId, { limit: 10 });
        const durationText = parameters.duration ? ` for ${parameters.duration} days` : '';
        const message = `Meal planning request received${durationText}. Retrieved your meal plans.`;

        return {
          message,
          data: result,
        };
      }

      case ZAI_ACTIONS.GROCERY_LIST: {
        // 1. Generate from user's latest meal plan
        if (parameters.source === 'meal-plan') {
          const plans = await mealPlanService.getMealPlans(userId, { limit: 1 });
          const latestPlan =
            plans.mealPlans && plans.mealPlans.length > 0 ? plans.mealPlans[0] : null;

          if (latestPlan) {
            const list = await groceryIntelligenceService.createFromMealPlan(userId, latestPlan._id);
            return {
              message: `Created grocery list from your meal plan "${latestPlan.name}" with ${list.items.length} consolidated item(s).`,
              data: list,
            };
          }

          return {
            message:
              'You do not have any active meal plans to generate groceries from. You can create a meal plan first.',
            data: null,
          };
        }

        // 2. Generate from recipe
        if (parameters.source === 'recipe') {
          if (Array.isArray(parameters.recipeIngredients) && parameters.recipeIngredients.length > 0) {
            const list = await recipeGroceryService.createGroceryListFromRecipe(userId, {
              name: parameters.recipeName || 'Recipe Groceries',
              ingredients: parameters.recipeIngredients,
            });
            return {
              action: ZAI_ACTIONS.GROCERY_LIST,
              message: `Created grocery list "${list.name}" with ${list.items?.length || 0} items from recipe.`,
              data: list,
            };
          }

          if (parameters.recipeId) {
            const list = await groceryIntelligenceService.createFromRecipes(userId, [
              parameters.recipeId,
            ]);
            return {
              message: `Created grocery list from recipe with ${list.items.length} ingredient(s).`,
              data: list,
            };
          }

          if (parameters.recipeName) {
            try {
              const searchResult = await recipeService.getRecipes(
                { search: parameters.recipeName },
                { limit: 1 }
              );
              if (searchResult?.recipes && searchResult.recipes.length > 0) {
                const foundRecipe = searchResult.recipes[0];
                const list = await recipeGroceryService.createGroceryListFromRecipe(
                  userId,
                  foundRecipe
                );
                return {
                  message: `Created grocery list for "${foundRecipe.name}" with ${list.items.length} ingredient(s).`,
                  data: list,
                };
              }
            } catch {
              // Fallback
            }
          }

          return {
            message:
              'No recipe context found to create a grocery list from. Please ask for a recipe first.',
            data: null,
          };
        }

        // 3. Add single manual item
        if (parameters.queryType === 'add_item' && parameters.item) {
          const listsResult = await groceryService.getGroceryLists(userId, { limit: 1 });
          const existingList =
            listsResult.groceryLists && listsResult.groceryLists.length > 0
              ? listsResult.groceryLists[0]
              : null;

          const newItem = {
            name: parameters.item,
            quantity: parameters.quantity || 1,
            unit: parameters.unit || '',
          };

          if (existingList) {
            const updated = await groceryService.addItem(userId, existingList._id, newItem);
            return {
              message: `Added ${newItem.quantity} ${newItem.unit} ${newItem.name}`.replace(
                /\s+/g,
                ' '
              ) + ` to your grocery list "${existingList.name}".`,
              data: updated,
            };
          }

          const created = await groceryService.createGroceryList(userId, {
            name: 'My Grocery List',
            items: [newItem],
          });
          return {
            message: `Created a new grocery list and added ${newItem.name}.`,
            data: created,
          };
        }

        // 4. View / query items
        if (parameters.queryType === 'view') {
          const listsResult = await groceryService.getGroceryLists(userId, { limit: 1 });
          const existingList =
            listsResult.groceryLists && listsResult.groceryLists.length > 0
              ? listsResult.groceryLists[0]
              : null;

          if (!existingList || !existingList.items || existingList.items.length === 0) {
            return {
              message: 'You do not have any items in your grocery list right now.',
              data: existingList,
            };
          }

          const pending = existingList.items.filter((i) => !i.checked);
          const preview = pending
            .slice(0, 5)
            .map((i) => `${i.name} (${i.quantity} ${i.unit})`.replace(/\s+\)/, ')'))
            .join(', ');
          const moreText = pending.length > 5 ? ` and ${pending.length - 5} more` : '';

          return {
            message: `Your grocery list "${existingList.name}" has ${pending.length} pending item(s): ${preview}${moreText}.`,
            data: existingList,
          };
        }

        // 5. Shopping Links (Price Intelligence Phase 1)
        if (parameters.queryType === 'shopping_links') {
          if (parameters.item) {
            const itemLinks = priceIntelligenceService.getItemShoppingLinks(
              parameters.item,
              parameters.marketplace
            );
            return {
              message: `Here are shopping search links for ${parameters.item}:`,
              data: itemLinks,
            };
          }

          let targetList = null;
          if (parameters.listId) {
            targetList = await groceryService.getGroceryListById(userId, parameters.listId);
          } else {
            const listsResult = await groceryService.getGroceryLists(userId, { limit: 1 });
            targetList =
              listsResult.groceryLists && listsResult.groceryLists.length > 0
                ? listsResult.groceryLists[0]
                : null;
          }

          if (!targetList || !targetList.items || targetList.items.length === 0) {
            return {
              message:
                'You do not have any items in your grocery list to generate shopping links for.',
              data: null,
            };
          }

          const shoppingLinks = await priceIntelligenceService.getShoppingLinksForList(
            userId,
            targetList._id,
            parameters.marketplace
          );

          const itemCount = shoppingLinks.items ? shoppingLinks.items.length : 0;
          return {
            message: `Generated marketplace shopping links for ${itemCount} item(s) in your grocery list "${targetList.name}".`,
            data: shoppingLinks,
          };
        }

        // 6. Price Comparison (Phase 2 & Phase 3)
        if (parameters.queryType === 'price_comparison') {
          if (parameters.item) {
            const comparison = priceIntelligenceService.getItemPriceComparison(
              parameters.item,
              parameters.marketplace
            );
            const bestOffer = comparison.comparison?.bestOffers?.[0];
            const storeName = bestOffer?.displayName || comparison.comparison?.bestMarketplace || 'Swiggy Instamart';
            const priceVal = comparison.comparison?.bestPrice;
            const mktKey = comparison.comparison?.bestMarketplace || 'instamart';
            const message = comparison.pricingAvailable
              ? `${storeName} has this item for ₹${priceVal}. Best price for "${parameters.item}" is ₹${priceVal} on ${mktKey}.`
              : `Live price comparison is currently unconfigured. You can search for "${parameters.item}" on our supported marketplaces using the links below:`;
            return {
              message,
              data: comparison,
            };
          }

          let targetList = null;
          if (parameters.listId) {
            targetList = await groceryService.getGroceryListById(userId, parameters.listId);
          } else {
            const listsResult = await groceryService.getGroceryLists(userId, { limit: 1 });
            targetList =
              listsResult.groceryLists && listsResult.groceryLists.length > 0
                ? listsResult.groceryLists[0]
                : null;
          }

          if (!targetList || !targetList.items || targetList.items.length === 0) {
            return {
              message:
                'You do not have any items in your grocery list to compare prices for.',
              data: null,
            };
          }

          const comparison = await priceIntelligenceService.getPriceComparisonForList(
            userId,
            targetList._id,
            parameters.marketplace
          );

          const message = comparison.pricingAvailable
            ? `Price comparison completed for your grocery list "${targetList.name}".`
            : `Live price comparison is currently unconfigured. Verified shopping search links have been generated for your grocery list "${targetList.name}".`;

          return {
            message,
            data: comparison,
          };
        }

        // 7. Default fallback: Retrieve user's grocery lists
        const result = await groceryService.getGroceryLists(userId, { limit: 10 });
        return {
          message: 'Grocery list request processed. Retrieved your grocery lists.',
          data: result,
        };
      }

      case ZAI_ACTIONS.DIETARY_PREFERENCE: {
        // Delegate to existing preferenceService
        if (parameters.dietaryPreference) {
          const updated = await preferenceService.updatePreferences(
            userId,
            { dietaryPreference: parameters.dietaryPreference },
            { upsert: true }
          );
          return {
            message: `Dietary preference updated to ${parameters.dietaryPreference}.`,
            data: updated,
          };
        }

        const currentPreferences =
          context || (await preferenceService.getPreferencesByUserId(userId));
        return {
          message: 'Retrieved your current dietary preferences.',
          data: currentPreferences,
        };
      }

      case ZAI_ACTIONS.RECIPE_SEARCH: {
        // Delegate to existing recipeService
        const filters = {};
        if (parameters.cuisine) {
          filters.cuisine = parameters.cuisine.toLowerCase();
        }
        if (parameters.mealType) {
          filters.mealType = parameters.mealType.toLowerCase();
        }
        if (parameters.search) {
          filters.search = parameters.search;
        }
        if (parameters.cookingTime) {
          filters.maxCookTime = parameters.cookingTime;
        } else if (parameters.maxCookTime) {
          filters.maxCookTime = parameters.maxCookTime;
        }
        if (parameters.difficulty) {
          filters.difficulty = parameters.difficulty.toLowerCase();
        }

        const result = await recipeService.getRecipes(filters, { limit: 10 });
        const cuisineDetail = parameters.cuisine ? ` for ${parameters.cuisine} cuisine` : '';
        return {
          message: `Found recipes matching your search criteria${cuisineDetail}.`,
          data: result,
        };
      }

      case ZAI_ACTIONS.FOOD_ANALYSIS: {
        // Query recent completed analysis for the authenticated user (within last 24 hours)
        let recentAnalyses = [];
        try {
          recentAnalyses = await foodAnalysisService.getAnalysisHistory(userId, { limit: 1 });
        } catch {
          recentAnalyses = [];
        }

        const latest = recentAnalyses && recentAnalyses.length > 0 ? recentAnalyses[0] : null;

        const isRecent =
          latest &&
          latest.status === 'completed' &&
          latest.createdAt &&
          Date.now() - new Date(latest.createdAt).getTime() <= 24 * 60 * 60 * 1000;

        if (isRecent) {
          const dishName = latest.dish?.name || latest.detectedFoods?.[0]?.name || 'Scanned Meal';
          const calories =
            latest.nutrition?.calories !== null && latest.nutrition?.calories !== undefined
              ? `approx. ${latest.nutrition.calories} kcal`
              : null;
          const protein =
            latest.nutrition?.protein !== null && latest.nutrition?.protein !== undefined
              ? `${latest.nutrition.protein}g protein`
              : null;
          const macros = [calories, protein].filter(Boolean).join(', ');
          const summary = latest.mealAnalysis?.summary ? ` ${latest.mealAnalysis.summary}` : '';

          let responseMsg = `Your recent food scan is ${dishName}`;
          if (macros) responseMsg += ` (${macros}).`;
          else responseMsg += '.';
          if (summary) responseMsg += summary;

          return {
            message: responseMsg,
            data: latest,
          };
        }

        // Controlled response when no recent scan exists
        return {
          message:
            'Food photo analysis requires an image file. Please upload a photo to the food analysis endpoint.',
          data: null,
        };
      }

      case ZAI_ACTIONS.FOOD_DIARY: {
        const queryType = parameters.queryType || 'daily_summary';

        if (queryType === 'calories') {
          const summary = await foodDiaryService.getDailySummary(userId, parameters.date);
          return {
            message: `Today you have consumed approximately ${summary.totals.calories} kcal across ${summary.entryCount} logged meal(s).`,
            data: summary,
          };
        }

        if (queryType === 'protein') {
          const summary = await foodDiaryService.getDailySummary(userId, parameters.date);
          return {
            message: `Today you have consumed approximately ${summary.totals.protein}g of protein across ${summary.entryCount} logged meal(s).`,
            data: summary,
          };
        }

        if (queryType === 'meals') {
          const summary = await foodDiaryService.getDailySummary(userId, parameters.date);
          if (summary.entryCount === 0) {
            return {
              message: 'You have not logged any meals for today yet.',
              data: summary,
            };
          }
          const mealList = summary.entries
            .map((e) => `${e.foodName} (${e.mealType})`)
            .join(', ');
          return {
            message: `Today's logged meals: ${mealList}.`,
            data: summary,
          };
        }

        if (queryType === 'log_recent_scan') {
          let recentAnalyses = [];
          try {
            recentAnalyses = await foodAnalysisService.getAnalysisHistory(userId, { limit: 1 });
          } catch {
            recentAnalyses = [];
          }
          const latest = recentAnalyses && recentAnalyses.length > 0 ? recentAnalyses[0] : null;
          const isRecent =
            latest &&
            latest.status === 'completed' &&
            latest.createdAt &&
            Date.now() - new Date(latest.createdAt).getTime() <= 24 * 60 * 60 * 1000;

          if (isRecent) {
            const entry = await foodDiaryService.createFromAnalysis(userId, latest._id, {
              mealType: parameters.mealType,
            });
            return {
              message: `Logged your recent scan (${entry.foodName}, ~${entry.nutrition?.calories || 0} kcal) to your food diary under ${entry.mealType}.`,
              data: entry,
            };
          }

          return {
            message: 'No recent food scan found to log. Please scan a meal photo first.',
            data: null,
          };
        }

        if (queryType === 'log_meal') {
          if (parameters.confirmLog === true) {
            const entry = await foodDiaryService.createManualEntry(userId, {
              foodName: parameters.foodName || 'Meal',
              mealType: parameters.mealType || 'lunch',
              nutrition: { calories: 0, protein: 0, carbohydrates: 0, fats: 0, isEstimated: true },
            });
            return {
              message: `Logged ${entry.foodName} for ${entry.mealType} to your food diary.`,
              data: entry,
            };
          }

          // Proposal to log (read-only query does NOT create entry)
          const targetFood = parameters.foodName || 'this meal';
          const targetMeal = parameters.mealType || 'lunch';
          return {
            message: `Would you like me to log ${targetFood} for ${targetMeal} to your food diary?`,
            data: null,
          };
        }

        // Default: daily_summary
        const summary = await foodDiaryService.getDailySummary(userId, parameters.date);
        if (summary.entryCount === 0) {
          return {
            message:
              'You have not logged any meals for today yet. You can scan a meal photo or tell me what you ate to log it.',
            data: summary,
          };
        }

        return {
          message: `Today you have logged ${summary.entryCount} meal(s) totaling approximately ${summary.totals.calories} kcal, ${summary.totals.protein}g protein, ${summary.totals.carbohydrates}g carbs, and ${summary.totals.fats}g fats.`,
          data: summary,
        };
      }

      case ZAI_ACTIONS.GENERAL_ZAIQO:
      default: {
        return {
          message:
            'Zai is your intelligent culinary assistant for recipes, meal planning, dietary preferences, and grocery lists. How can I help you today?',
          data: null,
        };
      }
    }
  }

  /**
   * Main entry point to orchestrate a user message
   * Tries Gemini first when configured, strictly validates output,
   * falls back to deterministic resolver on unconfigured/failure state.
   * Scopes conversation memory to the authenticated user and persists turns.
   * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
   * @param {string} message - User message
   * @param {string|null} [sessionId] - Optional conversation session ID
   * @returns {Promise<{ sessionId: string, action: string, message: string, response: string, parameters: Object, result: any }>}
   */
  async processMessage(userId, message, sessionId = null) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required to process Zai actions.');
    }

    // 1. Retrieve existing session or initialize a new conversation session
    const conversation = await zaiConversationService.getOrCreateConversation(userId, sessionId);

    // 2. Extract bounded conversation history (latest 6 messages) for context
    const conversationHistory = (conversation.messages || []).slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
      action: m.action,
      parameters: m.parameters,
    }));

    // 3. Load authenticated user preference context
    const rawPreferences = await this.getUserContext(userId);
    const sanitizedContext = sanitizeUserContext(rawPreferences);

    // 4. Resolve action via Gemini or deterministic resolver fallback
    let resolvedAction = null;
    let aiResponseText = null;

    if (geminiService.isConfigured()) {
      try {
        const geminiOutput = await geminiService.understandZaiMessage(
          message,
          sanitizedContext,
          conversationHistory
        );
        const validation = validateStructuredAction(geminiOutput);

        if (validation.isValid) {
          resolvedAction = {
            action: validation.sanitized.action,
            parameters: validation.sanitized.parameters,
          };
          aiResponseText = validation.sanitized.response || null;
        } else {
          // Gemini output malformed or invalid action - fallback deterministically
          const fallback = zaiResolverService.resolveAction(message);
          resolvedAction = {
            action: fallback.action,
            parameters: fallback.parameters,
          };
        }
      } catch {
        // Gemini API/network/timeout error - safe fallback to deterministic resolver
        const fallback = zaiResolverService.resolveAction(message);
        resolvedAction = {
          action: fallback.action,
          parameters: fallback.parameters,
        };
      }
    } else {
      // Gemini not configured - use deterministic resolver
      const fallback = zaiResolverService.resolveAction(message);
      resolvedAction = {
        action: fallback.action,
        parameters: fallback.parameters,
      };
    }

    // Check for multi-turn confirmation of proposed meal logging
    const isAffirmative = /\b(?:yes|log\s+it|confirm|please\s+log|sure|go\s+ahead)\b/i.test(message);
    const lastAssistantTurn = [...conversationHistory].reverse().find((m) => m.role === 'assistant');
    if (
      isAffirmative &&
      lastAssistantTurn &&
      lastAssistantTurn.action === ZAI_ACTIONS.FOOD_DIARY &&
      lastAssistantTurn.parameters?.queryType === 'log_meal' &&
      !lastAssistantTurn.parameters?.confirmLog
    ) {
      resolvedAction = {
        action: ZAI_ACTIONS.FOOD_DIARY,
        parameters: {
          ...lastAssistantTurn.parameters,
          confirmLog: true,
        },
      };
      aiResponseText = null;
    }

    // Check for multi-turn recipe context for grocery list creation
    if (
      resolvedAction.action === ZAI_ACTIONS.GROCERY_LIST &&
      !resolvedAction.parameters?.recipeId &&
      !resolvedAction.parameters?.recipeIngredients
    ) {
      const lastRecipeTurn = [...conversationHistory].reverse().find(
        (m) => m.role === 'assistant' && (m.action === ZAI_ACTIONS.RECIPE_GENERATION || m.parameters?.recipeName || m.parameters?.recipeId)
      );
      if (
        lastRecipeTurn &&
        (resolvedAction.parameters?.source === 'recipe' ||
          (!resolvedAction.parameters?.item &&
            resolvedAction.parameters?.queryType !== 'view' &&
            resolvedAction.parameters?.queryType !== 'price_comparison' &&
            resolvedAction.parameters?.queryType !== 'shopping_links'))
      ) {
        resolvedAction.parameters.source = 'recipe';
        if (lastRecipeTurn.parameters) {
          if (lastRecipeTurn.parameters.recipeId) {
            resolvedAction.parameters.recipeId = lastRecipeTurn.parameters.recipeId;
          }
          if (lastRecipeTurn.parameters.recipeName) {
            resolvedAction.parameters.recipeName = lastRecipeTurn.parameters.recipeName;
          }
          if (lastRecipeTurn.parameters.recipeIngredients) {
            resolvedAction.parameters.recipeIngredients = lastRecipeTurn.parameters.recipeIngredients;
          }
        }
        const recipeObj = lastRecipeTurn.metadata?.recipe || lastRecipeTurn.data?.recipe;
        if (recipeObj) {
          if (!resolvedAction.parameters.recipeId && (recipeObj._id || recipeObj.id)) {
            resolvedAction.parameters.recipeId = (recipeObj._id || recipeObj.id).toString();
          }
          if (!resolvedAction.parameters.recipeName && (recipeObj.name || recipeObj.title)) {
            resolvedAction.parameters.recipeName = recipeObj.name || recipeObj.title;
          }
          if (!resolvedAction.parameters.recipeIngredients && Array.isArray(recipeObj.ingredients)) {
            resolvedAction.parameters.recipeIngredients = recipeObj.ingredients;
          }
        }
      }
    }

    // 5. Dispatch to domain services (domain errors propagate naturally without fake turns)
    const dispatched = await this.dispatchAction(
      resolvedAction.action,
      resolvedAction.parameters,
      userId,
      sanitizedContext
    );

    const isCompound = Boolean(resolvedAction.parameters?.includeGroceries || resolvedAction.parameters?.includePricing);
    const finalResponse = isCompound ? dispatched.message : (aiResponseText || dispatched.message);

    // Capture recipe metadata on assistant turns for multi-turn grocery follow-ups
    const assistantTurnParams = { ...resolvedAction.parameters };
    if (dispatched.data && resolvedAction.action === ZAI_ACTIONS.RECIPE_GENERATION) {
      const recipeDoc = dispatched.data.recipe || dispatched.data;
      if (recipeDoc && (recipeDoc._id || recipeDoc.id)) {
        assistantTurnParams.recipeId = (recipeDoc._id || recipeDoc.id).toString();
      }
      if (recipeDoc && (recipeDoc.name || recipeDoc.title)) {
        assistantTurnParams.recipeName = recipeDoc.name || recipeDoc.title;
      }
      if (recipeDoc && Array.isArray(recipeDoc.ingredients)) {
        assistantTurnParams.recipeIngredients = recipeDoc.ingredients;
      }
    }

    // 6. Persist conversation turns (User turn followed by Assistant turn)
    await zaiConversationService.appendTurns(userId, conversation._id, [
      {
        role: 'user',
        content: message.trim(),
      },
      {
        role: 'assistant',
        content: finalResponse,
        action: resolvedAction.action,
        parameters: assistantTurnParams,
      },
    ]);

    // 7. Return structured response contract including sessionId
    const compoundFields = isCompound && dispatched.data && typeof dispatched.data === 'object'
      ? {
          recipe: dispatched.data.recipe,
          groceryItems: dispatched.data.groceryItems,
          priceComparison: dispatched.data.priceComparison,
          metadata: dispatched.data.metadata,
        }
      : {};

    const recipeField = (resolvedAction.action === ZAI_ACTIONS.RECIPE_GENERATION && dispatched.data)
      ? { recipe: dispatched.data.recipe || dispatched.data }
      : {};

    return {
      sessionId: conversation._id.toString(),
      action: resolvedAction.action,
      response: finalResponse,
      message: dispatched.message,
      parameters: resolvedAction.parameters,
      result: dispatched.data,
      ...recipeField,
      ...compoundFields,
    };
  }
}

const zaiActionService = new ZaiActionService();
export default zaiActionService;
