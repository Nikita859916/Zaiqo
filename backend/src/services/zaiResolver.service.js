import { ZAI_ACTIONS, createActionContract } from '../utils/zaiActionContract.js';
import { badRequest } from '../utils/apiError.js';
import { STANDARD_CUISINES, VALID_DIETARY_PREFERENCES } from '../utils/preferenceValidation.js';
import dietaryConstraintService from './dietaryConstraint.service.js';

/**
 * Deterministic Action Resolver for Zai
 * Inspects user messages and deterministically resolves actions and structured parameters.
 * Designed to be swappable with a future Gemini-based intent resolver without changing
 * other layers of the application.
 */
class ZaiResolverService {
  /**
   * Resolves a user message into an action contract with structured parameters
   * @param {string} rawMessage
   * @returns {{ action: string, parameters: Object, message: string }}
   */
  resolveAction(rawMessage) {
    if (rawMessage === undefined || rawMessage === null) {
      throw badRequest('Message is required and must be a non-empty string.');
    }

    if (typeof rawMessage !== 'string') {
      throw badRequest('Message must be a string.');
    }

    const trimmed = rawMessage.trim();
    if (trimmed.length === 0) {
      throw badRequest('Message cannot be empty.');
    }

    const lower = trimmed.toLowerCase();

    // 1. FOOD_DIARY Detection
    // Matches calorie, protein, meal history, or explicit food logging intents
    if (
      /\b(log\s+(?:my\s+)?recent\s+(?:food\s+)?scan|add\s+(?:my\s+)?recent\s+scan\s+to\s+(?:my\s+)?diary)\b/i.test(
        lower
      )
    ) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'log_recent_scan' },
        trimmed
      );
    }

    if (
      /\b(how\s+many\s+calories|calories\s+(?:did\s+i|have\s+i|consumed|eaten|today)|calorie\s+(?:intake|total|count))\b/i.test(
        lower
      )
    ) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'calories' },
        trimmed
      );
    }

    if (
      /\b(how\s+much\s+protein|protein\s+(?:did\s+i|have\s+i|consumed|eaten|today)|protein\s+(?:intake|total))\b/i.test(
        lower
      )
    ) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'protein' },
        trimmed
      );
    }

    if (
      /\b(what\s+did\s+i\s+eat(?:\s+today)?|what\s+meals\s+did\s+i\s+log|show\s+(?:me\s+)?(?:today'?s\s+)?meals|daily\s+(?:summary|intake)|food\s+diary)\b/i.test(
        lower
      )
    ) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_DIARY,
        { queryType: 'daily_summary' },
        trimmed
      );
    }

    // Explicit meal logging or consumption declaration: "i had <food> for <meal>" or "log <food> for <meal>"
    const hadMealMatch = lower.match(/\b(?:i\s+had|ate)\s+(.+?)\s+for\s+(breakfast|lunch|dinner|snack)\b/i);
    const logMealMatch = lower.match(/\blog\s+(.+?)\s+for\s+(breakfast|lunch|dinner|snack)\b/i);
    if (logMealMatch) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_DIARY,
        {
          queryType: 'log_meal',
          foodName: logMealMatch[1].trim(),
          mealType: logMealMatch[2].trim(),
          confirmLog: true,
        },
        trimmed
      );
    }
    if (hadMealMatch) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_DIARY,
        {
          queryType: 'log_meal',
          foodName: hadMealMatch[1].trim(),
          mealType: hadMealMatch[2].trim(),
          confirmLog: false,
        },
        trimmed
      );
    }

    // 2. FOOD_ANALYSIS Detection
    // Matches photo/image analysis requests
    if (
      /\b(food\s+(?:photo|image|picture)|photo\s+analysis|analyze\s+(?:this\s+)?food|analyze\s+(?:this\s+)?photo|scan\s+food)\b/i.test(
        lower
      )
    ) {
      return createActionContract(
        ZAI_ACTIONS.FOOD_ANALYSIS,
        { photoRequired: true },
        trimmed
      );
    }

    // 2. DIETARY_PREFERENCE Detection
    // Matches diet / preference declarations or changes
    if (
      /\b(dietary\s+preference|i\s+am\s+(?:vegetarian|vegan|eggetarian|non-vegetarian|jain)|my\s+diet\s+is|set\s+preference|change\s+(?:my\s+)?preference)\b/i.test(
        lower
      )
    ) {
      const parameters = {};
      for (const pref of VALID_DIETARY_PREFERENCES) {
        if (pref === 'no-preference') continue;
        // Check for non-vegetarian before vegetarian to avoid prefix clash
        if (pref === 'vegetarian' && lower.includes('non-vegetarian')) continue;
        if (lower.includes(pref)) {
          parameters.dietaryPreference = pref;
          break;
        }
      }
      return createActionContract(
        ZAI_ACTIONS.DIETARY_PREFERENCE,
        parameters,
        trimmed
      );
    }

    // 4. MEAL_PLANNING Detection
    // Matches meal planning requests (excluding requests to create grocery list from a meal plan)
    if (
      !/\b(?:grocery|shopping\s+list)\b/i.test(lower) &&
      /\b(meal\s+plan(?:ning)?|plan\s+(?:my\s+)?meals?|weekly\s+plan|\d+\s*[- ]?day\s+plan)\b/i.test(
        lower
      )
    ) {
      const parameters = {};
      const dayMatch = lower.match(/(\d+)\s*[- ]?day/i);
      if (dayMatch) {
        parameters.duration = parseInt(dayMatch[1], 10);
      }
      return createActionContract(
        ZAI_ACTIONS.MEAL_PLANNING,
        parameters,
        trimmed
      );
    }

    // 5. RECIPE_SEARCH Detection
    // Matches explicit recipe discovery / search (e.g. "Find me Italian recipes", "Search pasta recipes")
    if (
      /\b(find(?:\s+me)?\b.*recipes?|search\b.*recipes?|browse\b.*recipes?|show\b.*recipes?|lookup\b.*recipes?)\b/i.test(
        lower
      ) ||
      (STANDARD_CUISINES.some((c) => lower.includes(`${c} recipe`) || lower.includes(`${c} recipes`)) &&
        !/\b(?:suggest|give\s+me|generate|batao|banao|dikhao)\b/i.test(lower))
    ) {
      const parameters = {};

      if (lower.includes('with these groceries') || lower.includes('with my groceries')) {
        parameters.useGroceryListContext = true;
      }

      const withMatch = trimmed.match(/\bwith\s+([^,.]+?)(?:,|\.|\bfor\b|\bunder\b|$)/i);
      if (withMatch && withMatch[1]) {
        const rawIngs = withMatch[1]
          .split(/\band\b|,/i)
          .map((i) => i.trim().toLowerCase())
          .filter((i) => i.length > 1 && !['a', 'an', 'some', 'the', 'these', 'my', 'groceries'].includes(i));
        if (rawIngs.length > 0) {
          parameters.ingredients = rawIngs;
        }
      }

      // Extract cuisine if present
      for (const cuisine of STANDARD_CUISINES) {
        if (cuisine === 'other') continue;
        if (lower.includes(cuisine)) {
          parameters.cuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
          break;
        }
      }

      // Extract dietary & health constraints
      const extractedConstraints = dietaryConstraintService.extractConstraintsFromText(lower);
      if (extractedConstraints.length > 0) {
        parameters.dietaryConstraints = extractedConstraints;
      }

      return createActionContract(
        ZAI_ACTIONS.RECIPE_SEARCH,
        parameters,
        trimmed
      );
    }

    // 6. RECIPE_GENERATION & COMPOUND PIPELINE Detection
    // Matches suggestions based on available ingredients, meals, calories, health/dietary requests,
    // Hinglish conversational requests ("batao", "banao", "dikhao", "ke liye"), or compound recipe+grocery pipelines
    const isExplicitStandaloneRecipeGrocery =
      /\b(?:generate\s+groceries\s+for|groceries\s+for|grocery\s+list\s+for)\s+(?!this\s+dinner|this\s+meal|dinner|lunch|breakfast)(.+?)(?:\s+recipe|\?|$)/i.test(lower) ||
      (/\b(?:ingredients\s+(?:for|from)\s+this\s+recipe|from\s+this\s+recipe|for\s+this\s+recipe)\b/i.test(lower) &&
        !/\b(?:suggest|give\s+me|batao|banao|dikhao)\b/i.test(lower));

    const isRecipeGenerationIntent =
      !isExplicitStandaloneRecipeGrocery &&
      (/\b(suggest\s+.*(?:dinner|lunch|breakfast|meal|recipe|recipes|ideas?|something)|what\s+should\s+i\s+(?:eat|have|cook)|what\s+can\s+i\s+(?:make|cook)|recipe\s+with|recipes?\s+(?:for|with|suitable)|generate\s+(?:a\s+)?(?:recipe|dinner|lunch|breakfast|meal)|(?:make|cook)\s+(?:a\s+)?[a-z\s-]+\s+recipe|cook\s+something\s+with|i\s+have\s+.*suggest|give\s+me\s+.*(?:dinner|lunch|breakfast|meal|recipe|recipes|ideas?|something)|make\s+(?:it|this)\s+(?:under|quick|vegetarian|vegan|indian|spicier|for\s+\d+)|something\s+(?:quick|different|under|vegetarian|healthy|indian)|diabetes-friendly|low-sodium|avoiding\s+gluten|suitable\s+for\s+someone\s+avoiding|healthy\s+(?:dinner|lunch|breakfast)|vegetarian\s+(?:dinner|lunch|breakfast)|vegan\s+(?:dinner|lunch|breakfast)|(?:premium|budget-friendly|budget\s+friendly)\s+(?:dinner|lunch|breakfast|meal|recipe|recipes))\b/i.test(
        lower
      ) ||
      /\b(?:dinner|lunch|breakfast|khana|recipe)\s+(?:batao|banao|bana\s+do|dikhao|chahiye)\b/i.test(lower) ||
      /\b(?:mujhe|humein)\s+.*(?:dinner|lunch|breakfast|recipe|khana)\b/i.test(lower) ||
      /\b(?:banao|banado)\s+.*(?:recipe|dinner|lunch|sabzi|khana)\b/i.test(lower) ||
      /\b(?:kya\s+(?:banau|pakaun|khau|banae))\b/i.test(lower) ||
      /\b(?:recipe\s+(?:batao|banao|bana\s+do|chahiye))\b/i.test(lower));

    if (isRecipeGenerationIntent) {
      const parameters = {
        generateRecipe: true,
      };

      // Check for compound grocery requirement
      const hasGrocerySignal = /\b(grocery\s+list|shopping\s+list|groceries|grocery|saman\s+ki\s+list)\b/i.test(lower);
      if (hasGrocerySignal) {
        parameters.includeGroceries = true;
      }

      // Check for compound pricing requirement
      const hasPricingSignal = /\b(compare\s+prices?|cheapest\s+(?:store|app|option|price|basket|place)|which\s+(?:store|app)\s+is\s+cheapest|which\s+(?:store|app)\s+has\s+the\s+cheapest|cheapest|sasta|sabse\s+sasta|best\s+price|where\s+(?:is\s+it|it's|it\s+is)\s+cheapest)\b/i.test(lower);
      if (hasPricingSignal) {
        parameters.includePricing = true;
        parameters.includeGroceries = true;
      }

      // Servings extraction (supports English and Hinglish: "2 logon ke liye", "for 2 people", "2 servings")
      const servingsMatch = lower.match(
        /\b(?:(\d+)\s*(?:logon|logo|people|persons?|servings?|portions?)|\b(?:for|ke\s+liye)\s*(\d+)\s*(?:logon|logo|people|persons?)?|(\d+)\s*(?:logon|logo)\s*ke\s*liye)\b/i
      );
      if (servingsMatch) {
        const sNum = parseInt(servingsMatch[1] || servingsMatch[2] || servingsMatch[3], 10);
        if (Number.isFinite(sNum) && sNum >= 1 && sNum <= 50) {
          parameters.servings = sNum;
        }
      }

      // Safe ingredient extraction: look for "i have <ingredients>, suggest ..."
      const haveMatch = trimmed.match(/i\s+have\s+([^,.]+?)(?:,|\.|\bsuggest\b|\bwhat\b|\bcan\b)/i);
      if (haveMatch && haveMatch[1]) {
        const rawIngs = haveMatch[1]
          .split(/\band\b|,/i)
          .map((i) => i.trim().toLowerCase())
          .filter((i) => i.length > 1 && !['a', 'an', 'some', 'the'].includes(i));
        if (rawIngs.length > 0) {
          parameters.ingredients = rawIngs;
        }
      }

      // Recipe for / with ingredients extraction
      if (!parameters.ingredients) {
        const makeRecipeMatch = trimmed.match(/\bmake\s+(?:a\s+)?([^,.]+?)\s+recipe\b/i);
        if (makeRecipeMatch && makeRecipeMatch[1]) {
          const rawIngs = makeRecipeMatch[1]
            .split(/\band\b|,/i)
            .map((i) => i.trim().toLowerCase())
            .filter((i) => i.length > 1 && !['a', 'an', 'some', 'the', 'these', 'my'].includes(i));
          if (rawIngs.length > 0) {
            parameters.ingredients = rawIngs;
          }
        }
      }

      if (!parameters.ingredients) {
        const recipeForMatch = trimmed.match(/\b(?:recipe\s+(?:for|with)|cook\s+something\s+with)\s+([^,.]+?)(?:,|\.|\band\s+show\b|\band\s+make\b|\bunder\b|\bfor\b|$)/i);
        if (recipeForMatch && recipeForMatch[1]) {
          const rawIngs = recipeForMatch[1]
            .split(/\band\b|,/i)
            .map((i) => i.trim().toLowerCase())
            .filter((i) => i.length > 1 && !['a', 'an', 'some', 'the', 'these', 'my'].includes(i));
          if (rawIngs.length > 0) {
            parameters.ingredients = rawIngs;
          }
        }
      }

      if (!parameters.ingredients) {
        const commonIngs = ['paneer', 'spinach', 'chicken', 'tofu', 'dal', 'rice', 'mushrooms', 'potato', 'aloo', 'egg'];
        const found = commonIngs.filter((ing) => lower.includes(ing));
        if (found.length > 0) {
          parameters.ingredients = found;
        }
      }

      // Safe mealType extraction (including Hinglish terms)
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      for (const m of mealTypes) {
        if (lower.includes(m)) {
          parameters.mealType = m;
          break;
        }
      }
      if (!parameters.mealType) {
        if (lower.includes('tonight') || lower.includes('night') || lower.includes('raat ka khana')) {
          parameters.mealType = 'dinner';
        } else if (lower.includes('morning') || lower.includes('nashta') || lower.includes('subah ka nashta')) {
          parameters.mealType = 'breakfast';
        } else if (lower.includes('afternoon') || lower.includes('noon') || lower.includes('dopahar ka khana')) {
          parameters.mealType = 'lunch';
        } else if (lower.includes('sham ka nashta')) {
          parameters.mealType = 'snack';
        }
      }

      // Safe cookingTime extraction
      const timeMatch = lower.match(/(\d+)\s*(?:min|minute|m\b)/i);
      if (timeMatch) {
        parameters.cookingTime = parseInt(timeMatch[1], 10);
      } else if (lower.includes('quick') || lower.includes('jaldi')) {
        parameters.cookingTime = 20;
      }

      // Calorie constraint extraction (e.g. "under 500 calories")
      const calMatch = lower.match(/(?:under|below|less\s+than)\s+(\d+)\s*(?:cal|calories|kcal)/i);
      if (calMatch) {
        parameters.targetCalories = parseInt(calMatch[1], 10);
      }

      // Safe cuisine extraction
      for (const c of STANDARD_CUISINES) {
        if (c === 'other') continue;
        if (lower.includes(c)) {
          parameters.cuisine = c.charAt(0).toUpperCase() + c.slice(1);
          break;
        }
      }

      // Dietary & health constraints extraction via dietaryConstraintService
      const extractedConstraints = dietaryConstraintService.extractConstraintsFromText(lower);
      if (extractedConstraints.length > 0) {
        parameters.dietaryConstraints = extractedConstraints;
        if (extractedConstraints.includes('vegetarian')) {
          parameters.dietaryPreference = 'vegetarian';
        } else if (extractedConstraints.includes('vegan')) {
          parameters.dietaryPreference = 'vegan';
        }
        if (extractedConstraints.includes('low-sugar')) {
          parameters.healthGoal = 'low-sugar';
        } else if (extractedConstraints.includes('low-sodium')) {
          parameters.healthGoal = 'low-sodium';
        } else if (extractedConstraints.includes('high-protein')) {
          parameters.healthGoal = 'high-protein';
        }
      }

      // Dietary preference extraction (fallback/legacy)
      for (const pref of VALID_DIETARY_PREFERENCES) {
        if (pref === 'no-preference') continue;
        if (pref === 'vegetarian' && lower.includes('non-vegetarian')) continue;
        if (lower.includes(pref)) {
          parameters.dietaryPreference = pref;
          break;
        }
      }

      // FoodDiary context awareness flag
      if (
        lower.includes('what i ate today') ||
        lower.includes('based on today') ||
        lower.includes('based on what i ate') ||
        lower.includes('different from what i ate')
      ) {
        parameters.useFoodDiaryContext = true;
      }

      // Safe healthGoal extraction (fallback)
      if ((lower.includes('healthy') || lower.includes('swasth')) && !parameters.healthGoal) {
        parameters.healthGoal = 'healthy';
      } else if (lower.includes('weight-loss') || lower.includes('weight management')) {
        parameters.healthGoal = 'weight-management';
      } else if ((lower.includes('high-protein') || lower.includes('high protein') || lower.includes('muscle')) && !parameters.healthGoal) {
        parameters.healthGoal = 'high-protein';
      }

      // Budget tier extraction
      if (lower.includes('budget-friendly') || lower.includes('budget friendly') || lower.includes('low budget') || lower.includes('sasta')) {
        parameters.budgetTier = 'budget-friendly';
      } else if (lower.includes('premium') || lower.includes('high-end') || lower.includes('high end')) {
        parameters.budgetTier = 'premium';
      } else if (lower.includes('balanced')) {
        parameters.budgetTier = 'balanced';
      } else if (lower.includes('no-preference') || lower.includes('no preference')) {
        parameters.budgetTier = 'no-preference';
      }

      // Target marketplace if explicitly specified
      if (lower.includes('blinkit')) parameters.preferredMarketplace = 'blinkit';
      else if (lower.includes('zepto')) parameters.preferredMarketplace = 'zepto';
      else if (lower.includes('jiomart')) parameters.preferredMarketplace = 'jiomart';
      else if (lower.includes('instamart')) parameters.preferredMarketplace = 'instamart';

      return createActionContract(
        ZAI_ACTIONS.RECIPE_GENERATION,
        parameters,
        trimmed
      );
    }

    // 7. GROCERY_LIST Detection
    // Matches standalone grocery / shopping list requests, marketplace shopping links, and price comparison
    if (
      /\b(grocery\s+list|shopping\s+list|groceries|create\s+(?:my\s+)?grocery|add\s+.*to\s+(?:my\s+)?(?:grocery|shopping)\s+list|what\s+do\s+i\s+need\s+to\s+buy|where\s+(?:can\s+i|i\s+can|to)\s+(?:buy|get)|shopping\s+links?|open\s+(?:grocery\s+shopping|blinkit|zepto|jiomart|instamart)|shopping\s+options|compare\s+(?:grocery\s+)?prices?|grocery\s+prices?|cheapest\s+(?:store|app|option|price|basket|place)|which\s+(?:store|app)\s+is\s+cheapest|which\s+(?:store|app)\s+has\s+the\s+cheapest)\b/i.test(
        lower
      )
    ) {
      const parameters = {};

      const isPriceComparisonIntent =
        /\b(compare\s+(?:grocery\s+)?prices?|grocery\s+prices?|which\s+(?:store|app)\s+is\s+cheapest|which\s+(?:store|app)\s+has\s+the\s+cheapest)\b/i.test(
          lower
        ) || (/\bcheapest\b/i.test(lower) && /\b(where|store|app|price|buy|grocery|groceries|basket|paneer|milk|rice|tofu|item)\b/i.test(lower));

      const isShoppingLinksIntent =
        /\b(where\s+(?:can\s+i|i\s+can|to)\s+(?:buy|get)|shopping\s+links?|open\s+(?:grocery\s+shopping|blinkit|zepto|jiomart|instamart)|shopping\s+options)\b/i.test(
          lower
        );

      if (isPriceComparisonIntent) {
        parameters.queryType = 'price_comparison';

        if (lower.includes('blinkit')) parameters.marketplace = 'blinkit';
        else if (lower.includes('zepto')) parameters.marketplace = 'zepto';
        else if (lower.includes('jiomart')) parameters.marketplace = 'jiomart';
        else if (lower.includes('instamart')) parameters.marketplace = 'instamart';

        const itemMatch = trimmed.match(
          /\b(?:cheapest\s+|for\s+|buy\s+)([a-zA-Z\s]+?)(?:\s+cheapest|\?|$)/i
        );
        if (itemMatch && itemMatch[1]) {
          const candidateItem = itemMatch[1].trim().toLowerCase();
          if (
            !candidateItem.includes('grocer') &&
            !candidateItem.includes('these') &&
            !candidateItem.includes('this') &&
            !candidateItem.includes('items') &&
            !candidateItem.includes('store') &&
            !candidateItem.includes('app') &&
            !candidateItem.includes('option')
          ) {
            parameters.item = itemMatch[1].trim().replace(/\?+$/, '');
          }
        }
      } else if (isShoppingLinksIntent) {
        parameters.queryType = 'shopping_links';

        if (lower.includes('blinkit')) parameters.marketplace = 'blinkit';
        else if (lower.includes('zepto')) parameters.marketplace = 'zepto';
        else if (lower.includes('jiomart')) parameters.marketplace = 'jiomart';
        else if (lower.includes('instamart')) parameters.marketplace = 'instamart';

        const itemMatch = trimmed.match(
          /\bwhere\s+(?:can\s+i|i\s+can)\s+(?:buy|get)\s+(?:some\s+|a\s+|an\s+)?(.+?)(?:\s+on\s+(?:blinkit|zepto|jiomart|instamart)|\?|$)/i
        );
        if (itemMatch && itemMatch[1]) {
          const candidateItem = itemMatch[1].trim().toLowerCase();
          if (
            !candidateItem.includes('grocer') &&
            !candidateItem.includes('these') &&
            !candidateItem.includes('this') &&
            !candidateItem.includes('items')
          ) {
            parameters.item = itemMatch[1].trim().replace(/\?+$/, '');
          }
        }
      } else if (lower.includes('meal plan') || lower.includes('from my meal plan')) {
        parameters.source = 'meal-plan';
      } else if (
        lower.includes('from this recipe') ||
        lower.includes('for this recipe') ||
        lower.includes('from the recipe') ||
        lower.includes('generate groceries for this recipe') ||
        lower.includes('its ingredients') ||
        lower.includes('recipe ingredients') ||
        lower.includes('ingredients from this recipe')
      ) {
        parameters.source = 'recipe';
        parameters.fromCurrentRecipe = true;
      } else if (
        /\bwhat\s+do\s+i\s+need\s+to\s+buy\b/i.test(lower) ||
        /\b(show|view)\s+(?:my\s+)?(?:grocery|shopping)\s+list\b/i.test(lower)
      ) {
        parameters.queryType = 'view';
      } else {
        const recipeForMatch = trimmed.match(
          /\b(?:create\s+(?:a\s+)?grocery\s+list\s+for|generate\s+groceries\s+for|groceries\s+for)\s+(.+?)(?:\s+recipe|\?|$)/i
        );
        if (recipeForMatch && recipeForMatch[1]) {
          const targetRecipe = recipeForMatch[1].trim().replace(/\?+$/, '');
          if (
            !targetRecipe.includes('my meal plan') &&
            !targetRecipe.includes('these') &&
            !targetRecipe.includes('this') &&
            !targetRecipe.includes('my grocery')
          ) {
            parameters.source = 'recipe';
            parameters.recipeName = targetRecipe;
          }
        }
      }

      // Check for "add <item> to grocery list"
      const addMatch = trimmed.match(
        /\badd\s+(?:(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+)?(.+?)\s+to\s+(?:my\s+)?(?:grocery|shopping)\s+list\b/i
      );
      if (addMatch) {
        parameters.queryType = 'add_item';
        if (addMatch[1]) {
          parameters.quantity = parseFloat(addMatch[1]);
        }
        if (addMatch[2] && !['the', 'some', 'a', 'an'].includes(addMatch[2].toLowerCase())) {
          parameters.unit = addMatch[2].trim();
        }
        parameters.item = addMatch[3].trim();
      }

      return createActionContract(
        ZAI_ACTIONS.GROCERY_LIST,
        parameters,
        trimmed
      );
    }

    // 7. GENERAL_ZAIQO (Default / General info fallback)
    return createActionContract(
      ZAI_ACTIONS.GENERAL_ZAIQO,
      {},
      trimmed
    );
  }
}

const zaiResolverService = new ZaiResolverService();
export default zaiResolverService;
