import api from './api.js';

const sampleRecipes = [
  {
    id: 'rec_paneer_spinach',
    name: 'Spiced Paneer & Wilted Spinach Skillet',
    description: 'Crispy seared paneer cubes tossed with nutrient-dense spinach, cumin seeds, garlic, and cold-pressed olive oil.',
    mealType: 'Dinner',
    dietaryPreference: 'Vegetarian',
    prepTime: '10 mins',
    cookTime: '15 mins',
    servings: 2,
    nutrition: {
      calories: 380,
      protein: '22g',
      carbohydrates: '12g',
      fats: '28g',
    },
    ingredients: [
      { item: 'Paneer (cubed)', quantity: '200g' },
      { item: 'Baby spinach (fresh or thawed)', quantity: '150g' },
      { item: 'Garlic (minced)', quantity: '3 cloves' },
      { item: 'Cumin seeds', quantity: '1 tsp' },
      { item: 'Olive oil or ghee', quantity: '1 tbsp' },
      { item: 'Sea salt and cracked black pepper', quantity: 'To taste' },
    ],
    instructions: [
      'Warm olive oil or ghee in a wide skillet over medium heat and toast cumin seeds until fragrant.',
      'Add paneer cubes and sear for 3 to 4 minutes until golden on multiple sides.',
      'Stir in minced garlic and cook for 30 seconds until aromatic.',
      'Fold in baby spinach in batches until naturally wilted and tender.',
      'Season with sea salt and cracked pepper, then serve immediately warm.',
    ],
    zaiNote: 'Based on your preferences and available ingredients, I found a recipe that fits your request.',
  },
  {
    id: 'rec_avocado_citrus_bowl',
    name: 'Citrus Herb Salmon & Avocado Bowl',
    description: 'Dietitian-calibrated wild salmon fillet served over fluffy quinoa with creamy sliced avocado and lemon herb dressing.',
    mealType: 'Dinner',
    dietaryPreference: 'High Protein',
    prepTime: '10 mins',
    cookTime: '15 mins',
    servings: 2,
    nutrition: {
      calories: 480,
      protein: '38g',
      carbohydrates: '28g',
      fats: '24g',
    },
    ingredients: [
      { item: 'Wild salmon fillets', quantity: '300g' },
      { item: 'Ripe avocado (sliced)', quantity: '1 medium' },
      { item: 'Cooked tri-color quinoa', quantity: '1 cup' },
      { item: 'Baby greens or arugula', quantity: '2 cups' },
      { item: 'Fresh lemon juice', quantity: '2 tbsp' },
      { item: 'Extra virgin olive oil', quantity: '1 tbsp' },
    ],
    instructions: [
      'Preheat an oven or skillet to medium-high and season salmon with sea salt and black pepper.',
      'Pan-sear the salmon fillets skin-side down for 4 minutes, flip and cook for 3 more minutes.',
      'Assemble warm cooked quinoa and fresh baby greens across two bowls.',
      'Place seared salmon and fan sliced avocado on top.',
      'Drizzle with fresh lemon juice and cold-pressed extra virgin olive oil.',
    ],
    zaiNote: 'Based on your preferences and available ingredients, I found a recipe that fits your request.',
  },
  {
    id: 'rec_breakfast_power_scramble',
    name: 'Mediterranean Spinach & Herb Scramble',
    description: 'Protein-packed farm egg scramble folded with tender baby spinach, sun-ripened tomatoes, and fresh oregano.',
    mealType: 'Breakfast',
    dietaryPreference: 'High Protein',
    prepTime: '5 mins',
    cookTime: '8 mins',
    servings: 1,
    nutrition: {
      calories: 290,
      protein: '24g',
      carbohydrates: '6g',
      fats: '18g',
    },
    ingredients: [
      { item: 'Organic pasture-raised eggs', quantity: '3 large' },
      { item: 'Fresh baby spinach', quantity: '1 cup' },
      { item: 'Cherry tomatoes (halved)', quantity: '6 pieces' },
      { item: 'Extra virgin olive oil', quantity: '1 tsp' },
      { item: 'Oregano and black pepper', quantity: 'To taste' },
    ],
    instructions: [
      'Whisk eggs in a bowl with a pinch of sea salt and freshly cracked pepper.',
      'Warm olive oil in a nonstick skillet and blister cherry tomatoes for 2 minutes.',
      'Add baby spinach and allow it to soften slightly.',
      'Pour in whisked eggs and gently fold over low-medium heat until soft curds form.',
      'Transfer to a plate and garnish with fresh oregano.',
    ],
    zaiNote: 'Based on your preferences and available ingredients, I found a recipe that fits your request.',
  },
  {
    id: 'rec_lunch_chickpea_salad',
    name: 'Crisp Herb Chickpea & Cucumber Bowl',
    description: 'Refreshing zero-cook Mediterranean salad combining fiber-rich chickpeas, English cucumbers, and a zesty lemon tahini dressing.',
    mealType: 'Lunch',
    dietaryPreference: 'Vegan',
    prepTime: '10 mins',
    cookTime: '0 mins',
    servings: 2,
    nutrition: {
      calories: 340,
      protein: '14g',
      carbohydrates: '42g',
      fats: '14g',
    },
    ingredients: [
      { item: 'Cooked chickpeas (rinsed)', quantity: '1.5 cups' },
      { item: 'English cucumber (diced)', quantity: '1 large' },
      { item: 'Fresh parsley (chopped)', quantity: '0.5 cup' },
      { item: 'Tahini', quantity: '2 tbsp' },
      { item: 'Lemon juice and garlic', quantity: '1.5 tbsp' },
    ],
    instructions: [
      'In a wide mixing bowl, combine rinsed chickpeas, diced cucumber, and chopped parsley.',
      'In a small ramekin, whisk tahini, fresh lemon juice, minced garlic, and 2 tbsp warm water.',
      'Pour tahini dressing over the chickpea mix and toss gently to coat evenly.',
      'Serve chilled or at room temperature for balanced sustained energy.',
    ],
    zaiNote: 'Based on your preferences and available ingredients, I found a recipe that fits your request.',
  },
  {
    id: 'rec_snack_energy_bites',
    name: 'Roasted Almond & Chia Energy Clusters',
    description: 'Clean metabolic snack clusters offering healthy fats and steady glucose release throughout the afternoon.',
    mealType: 'Snack',
    dietaryPreference: 'Low Carb',
    prepTime: '8 mins',
    cookTime: '0 mins',
    servings: 4,
    nutrition: {
      calories: 195,
      protein: '7g',
      carbohydrates: '9g',
      fats: '15g',
    },
    ingredients: [
      { item: 'Raw almonds (coarsely chopped)', quantity: '1 cup' },
      { item: 'Chia seeds', quantity: '2 tbsp' },
      { item: 'Almond butter', quantity: '3 tbsp' },
      { item: 'Pure vanilla extract', quantity: '0.5 tsp' },
      { item: 'Flaky sea salt', quantity: '1 pinch' },
    ],
    instructions: [
      'Mix chopped almonds and chia seeds in a medium bowl.',
      'Warm almond butter slightly and fold through the nut seed mixture with vanilla extract.',
      'Scoop into 8 uniform clusters on parchment paper.',
      'Chill in the refrigerator for 20 minutes to set before enjoying.',
    ],
    zaiNote: 'Based on your preferences and available ingredients, I found a recipe that fits your request.',
  },
];

/**
 * Generate a recipe based on user input parameters
 */
export async function generateMockRecipe(params = {}) {
  // Check for authenticated user session to attempt live AI recipe intelligence
  let token = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem('zaiqo_auth_token');
    }
  } catch {
    // Storage access gracefully ignored
  }

  if (token) {
    try {
      const rawIngredients = params.ingredients || '';
      const availableIngredients = Array.isArray(rawIngredients)
        ? rawIngredients
        : typeof rawIngredients === 'string' && rawIngredients.trim()
        ? rawIngredients.split(/[,]+/).map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        mealType: (params.mealType || 'dinner').toLowerCase(),
        servings: Number(params.servings) || 2,
        availableIngredients,
      };

      if (params.dietaryPreference && params.dietaryPreference !== 'No Preference') {
        payload.dietaryRestrictions = [params.dietaryPreference.toLowerCase()];
      }

      if (params.maxCookingTime) {
        payload.maxCookingTime = params.maxCookingTime;
      }

      const response = await api.post('/recipes/generate', payload);
      if (response?.data?.success && response.data.data) {
        const r = response.data.data;
        return {
          id: r._id || r.id || `rec_${Date.now()}`,
          name: r.name || r.title || 'Personalized Recipe',
          description: r.description || '',
          mealType: r.mealType || params.mealType || 'Dinner',
          dietaryPreference: r.dietaryPreference || params.dietaryPreference || 'No Preference',
          prepTime: r.prepTime || '10 mins',
          cookTime: r.cookTime || r.totalTime || '15 mins',
          servings: r.servings || 2,
          nutrition: r.nutrition || null,
          ingredients: Array.isArray(r.ingredients)
            ? r.ingredients.map((ing) => ({
                item: ing.name || ing.item,
                name: ing.name || ing.item,
                quantity: ing.quantity ? `${ing.quantity} ${ing.unit || ''}`.trim() : (ing.unit || '1 portion'),
              }))
            : [],
          instructions: Array.isArray(r.instructions)
            ? r.instructions.map((step) => (typeof step === 'string' ? step : step.text || ''))
            : [],
          zaiNote: r.zaiNote || 'Generated via Zai Recipe Intelligence engine.',
        };
      }
    } catch (err) {
      console.warn('[Recipe Service] Live recipe generation unavailable, falling back to local synthesizer:', err?.message);
    }
  }

  // Simulate network / AI generation latency (600ms) for local fallback
  await new Promise((resolve) => setTimeout(resolve, 600));

  const {
    mealType = 'Dinner',
    dietaryPreference = 'No Preference',
    ingredients = '',
    maxCookingTime = '',
  } = params;

  const ingredientsLower = (typeof ingredients === 'string' ? ingredients : (ingredients || []).join(' ')).toLowerCase();
  const mealLower = (mealType || '').toLowerCase();
  const dietLower = (dietaryPreference || '').toLowerCase();

  // 1. Paneer or spinach specified
  if (ingredientsLower.includes('paneer') || (ingredientsLower.includes('spinach') && !ingredientsLower.includes('salmon'))) {
    const base = { ...sampleRecipes[0] };
    if (mealType && mealType !== 'No Preference') base.mealType = mealType;
    if (dietaryPreference && dietaryPreference !== 'No Preference') base.dietaryPreference = dietaryPreference;
    return base;
  }

  // 2. Salmon or avocado or high protein dinner
  if (ingredientsLower.includes('salmon') || ingredientsLower.includes('avocado') || (dietLower.includes('protein') && mealLower.includes('dinner'))) {
    return { ...sampleRecipes[1] };
  }

  // 3. Breakfast request
  if (mealLower.includes('breakfast')) {
    const base = { ...sampleRecipes[2] };
    if (dietaryPreference && dietaryPreference !== 'No Preference') base.dietaryPreference = dietaryPreference;
    return base;
  }

  // 4. Lunch or vegan request
  if (mealLower.includes('lunch') || dietLower.includes('vegan')) {
    const base = { ...sampleRecipes[3] };
    if (mealType && mealType !== 'No Preference') base.mealType = mealType;
    return base;
  }

  // 5. Snack request
  if (mealLower.includes('snack')) {
    return { ...sampleRecipes[4] };
  }

  // 6. Dynamic fallback adapted to input parameters
  return {
    id: `rec_gen_${Date.now()}`,
    name: ingredients.trim()
      ? `Chef-Crafted ${ingredients.split(/[, ]+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' & ')} ${mealType || 'Plate'}`
      : `Dietitian-Balanced ${dietaryPreference && dietaryPreference !== 'No Preference' ? dietaryPreference : 'Vitality'} ${mealType || 'Dinner'}`,
    description: `A wholesome, vibrant dish prepared to optimize your vitality and utilize ${ingredients.trim() ? ingredients : 'wholesome pantry staples'}.`,
    mealType: mealType || 'Dinner',
    dietaryPreference: dietaryPreference || 'No Preference',
    prepTime: '10 mins',
    cookTime: maxCookingTime || '15 mins',
    servings: 2,
    nutrition: {
      calories: 420,
      protein: '28g',
      carbohydrates: '32g',
      fats: '18g',
    },
    ingredients: ingredients.trim()
      ? ingredients.split(/[,]+/).map((item) => ({ item: item.trim(), quantity: '1 cup' }))
      : [
          { item: 'Fresh garden produce', quantity: '2 cups' },
          { item: 'Complex grain or legume', quantity: '1 cup' },
          { item: 'Cold-pressed olive oil', quantity: '1 tbsp' },
          { item: 'Herbs and sea salt', quantity: 'To taste' },
        ],
    instructions: [
      'Prepare all ingredients by washing, trimming, and seasoning with wholesome herbs and sea salt.',
      'Sauté or gently roast in cold-pressed olive oil over medium heat until tender-crisp.',
      'Combine ingredients to maximize flavor integration and nutrient preservation.',
      'Plate thoughtfully and enjoy warm for sustained all-day energy.',
    ],
    zaiNote: 'Based on your preferences and available ingredients, I found a recipe that fits your request.',
  };
}
