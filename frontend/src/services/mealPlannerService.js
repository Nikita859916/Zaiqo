/**
 * Zaiqo Meal Planner Service
 * 
 * Provides structured multi-day meal planning (3, 5, 7 days),
 * single-meal replacement, slot removal/addition, single-meal regeneration,
 * localStorage persistence, and seamless grocery list synchronization.
 */

import { mergeIngredientsIntoList, loadGroceryList, saveGroceryList } from './groceryService.js';

export const DURATION_OPTIONS = [3, 5, 7];

export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'High Protein',
  'Low Carb',
  'Gluten Free',
  'No Preference',
];

export const CALORIE_OPTIONS = [
  { label: '1600 kcal (Light & Lean)', value: 1600 },
  { label: '1800 kcal (Balanced Vitality)', value: 1800 },
  { label: '2000 kcal (Standard Active)', value: 2000 },
  { label: '2400 kcal (High Performance)', value: 2400 },
];

const MEAL_RECIPE_POOL = {
  breakfast: [
    {
      id: 'bf_scramble',
      name: 'Mediterranean Spinach & Herb Scramble',
      description: 'Fluffy organic eggs folded with tender baby spinach, sun-ripened tomatoes, and fresh oregano.',
      mealType: 'Breakfast',
      dietaryPreferences: ['Vegetarian', 'High Protein', 'Gluten Free', 'Low Carb'],
      prepTime: '5 mins',
      cookTime: '8 mins',
      totalTime: '13 mins',
      servings: 1,
      nutrition: { calories: 310, protein: '24g', carbohydrates: '6g', fats: '19g' },
      ingredients: [
        { item: 'Organic pasture-raised eggs', quantity: '3 pieces' },
        { item: 'Fresh baby spinach', quantity: '100g' },
        { item: 'Tomato', quantity: '2 pieces' },
        { item: 'Extra virgin olive oil', quantity: '1 tsp' },
        { item: 'Oregano and black pepper', quantity: 'To taste' },
      ],
      instructions: [
        'Whisk eggs in a bowl with a pinch of sea salt and pepper.',
        'Sauté diced tomato and spinach in olive oil for 2 minutes until tender.',
        'Pour in eggs and gently scramble on low-medium heat until soft curds form.',
      ],
    },
    {
      id: 'bf_oats_banana',
      name: 'Rolled Oats & Banana Nut Bowl',
      description: 'Slow-simmered whole grain oats topped with sliced banana, chia seeds, and raw crushed walnuts.',
      mealType: 'Breakfast',
      dietaryPreferences: ['Vegetarian', 'Vegan'],
      prepTime: '5 mins',
      cookTime: '10 mins',
      totalTime: '15 mins',
      servings: 1,
      nutrition: { calories: 380, protein: '12g', carbohydrates: '58g', fats: '12g' },
      ingredients: [
        { item: 'Rolled oats', quantity: '1 cup' },
        { item: 'Ripe banana', quantity: '1 pieces' },
        { item: 'Chia seeds', quantity: '1 tbsp' },
        { item: 'Raw walnuts', quantity: '30g' },
        { item: 'Almond milk', quantity: '1 cup' },
      ],
      instructions: [
        'Simmer rolled oats with almond milk over medium heat for 7 minutes.',
        'Transfer to a bowl and top with sliced banana and chia seeds.',
        'Garnish with crushed walnuts and a drizzle of cinnamon.',
      ],
    },
    {
      id: 'bf_parfait',
      name: 'Greek Yogurt & Berry Chia Parfait',
      description: 'High-protein Greek yogurt layered with wild blueberries, pumpkin seeds, and pure vanilla bean.',
      mealType: 'Breakfast',
      dietaryPreferences: ['Vegetarian', 'High Protein', 'Gluten Free'],
      prepTime: '5 mins',
      cookTime: '0 mins',
      totalTime: '5 mins',
      servings: 1,
      nutrition: { calories: 290, protein: '26g', carbohydrates: '22g', fats: '9g' },
      ingredients: [
        { item: 'Greek yogurt', quantity: '200g' },
        { item: 'Blueberries', quantity: '100g' },
        { item: 'Chia seeds', quantity: '1 tbsp' },
        { item: 'Raw pumpkin seeds', quantity: '1 tbsp' },
      ],
      instructions: [
        'Spoon half the Greek yogurt into a glass or wide bowl.',
        'Layer wild blueberries and chia seeds.',
        'Top with remaining yogurt and sprinkle with crunchy pumpkin seeds.',
      ],
    },
    {
      id: 'bf_avocado_toast',
      name: 'Avocado Seed Toast with Soft Egg',
      description: 'Crushed ripe avocado with lemon juice on artisan toasted loaf topped with a soft-boiled egg and hemp hearts.',
      mealType: 'Breakfast',
      dietaryPreferences: ['Vegetarian', 'High Protein'],
      prepTime: '5 mins',
      cookTime: '6 mins',
      totalTime: '11 mins',
      servings: 1,
      nutrition: { calories: 340, protein: '16g', carbohydrates: '26g', fats: '20g' },
      ingredients: [
        { item: 'Ripe avocado', quantity: '1 pieces' },
        { item: 'Organic pasture-raised eggs', quantity: '2 pieces' },
        { item: 'Whole grain bread', quantity: '2 pieces' },
        { item: 'Lemon juice', quantity: '1 tsp' },
      ],
      instructions: [
        'Toast whole grain bread slices until golden brown.',
        'Mash avocado with lemon juice, sea salt, and black pepper.',
        'Spread over toast and crown with sliced soft-boiled eggs.',
      ],
    },
  ],

  lunch: [
    {
      id: 'lu_chickpea_salad',
      name: 'Crisp Herb Chickpea & Cucumber Bowl',
      description: 'Fiber-rich Mediterranean chickpeas tossed with crisp cucumbers, fresh flat-leaf parsley, and tahini.',
      mealType: 'Lunch',
      dietaryPreferences: ['Vegan', 'Vegetarian', 'Gluten Free'],
      prepTime: '10 mins',
      cookTime: '0 mins',
      totalTime: '10 mins',
      servings: 2,
      nutrition: { calories: 420, protein: '16g', carbohydrates: '52g', fats: '16g' },
      ingredients: [
        { item: 'Cooked chickpeas', quantity: '200g' },
        { item: 'Cucumber', quantity: '1 pieces' },
        { item: 'Tomato', quantity: '3 pieces' },
        { item: 'Tahini', quantity: '2 tbsp' },
        { item: 'Lemon juice', quantity: '1.5 tbsp' },
        { item: 'Fresh parsley', quantity: '30g' },
      ],
      instructions: [
        'Rinse cooked chickpeas and combine with diced cucumber and tomato.',
        'Whisk tahini with fresh lemon juice and 2 tbsp warm water.',
        'Drizzle over salad and toss with chopped flat-leaf parsley.',
      ],
    },
    {
      id: 'lu_paneer_rice',
      name: 'Golden Paneer & Brown Rice Skillet',
      description: 'Pan-seared spiced paneer served over warm whole grain brown rice with wilted baby spinach and turmeric.',
      mealType: 'Lunch',
      dietaryPreferences: ['Vegetarian', 'Gluten Free'],
      prepTime: '10 mins',
      cookTime: '15 mins',
      totalTime: '25 mins',
      servings: 2,
      nutrition: { calories: 510, protein: '25g', carbohydrates: '48g', fats: '24g' },
      ingredients: [
        { item: 'Paneer', quantity: '200g' },
        { item: 'Cooked brown rice', quantity: '1.5 cups' },
        { item: 'Fresh baby spinach', quantity: '100g' },
        { item: 'Olive oil', quantity: '1 tbsp' },
        { item: 'Turmeric and cumin', quantity: '1 tsp' },
      ],
      instructions: [
        'Cube paneer and sear in olive oil with turmeric and cumin until golden.',
        'Add baby spinach and cook until wilted.',
        'Fold in warm brown rice and season with sea salt.',
      ],
    },
    {
      id: 'lu_quinoa_buddha',
      name: 'Roasted Veggie & Tri-Color Quinoa Bowl',
      description: 'Warm fluffy quinoa topped with roasted zucchini, bell peppers, chickpeas, and a zesty lemon herb dressing.',
      mealType: 'Lunch',
      dietaryPreferences: ['Vegan', 'Vegetarian', 'Gluten Free', 'High Protein'],
      prepTime: '10 mins',
      cookTime: '15 mins',
      totalTime: '25 mins',
      servings: 2,
      nutrition: { calories: 450, protein: '18g', carbohydrates: '60g', fats: '14g' },
      ingredients: [
        { item: 'Cooked tri-color quinoa', quantity: '1.5 cups' },
        { item: 'Bell pepper', quantity: '1 pieces' },
        { item: 'Zucchini', quantity: '1 pieces' },
        { item: 'Cooked chickpeas', quantity: '150g' },
        { item: 'Olive oil', quantity: '1 tbsp' },
      ],
      instructions: [
        'Roast diced bell pepper and zucchini in olive oil for 12 minutes.',
        'Divide cooked quinoa between two bowls.',
        'Top with roasted vegetables, chickpeas, and fresh dressing.',
      ],
    },
    {
      id: 'lu_chicken_greens',
      name: 'Citrus Herb Grilled Chicken Greens',
      description: 'Tender chicken breast seared in cold-pressed olive oil over crisp baby greens with diced cucumber and avocado.',
      mealType: 'Lunch',
      dietaryPreferences: ['High Protein', 'Low Carb', 'Gluten Free'],
      prepTime: '10 mins',
      cookTime: '12 mins',
      totalTime: '22 mins',
      servings: 2,
      nutrition: { calories: 460, protein: '42g', carbohydrates: '10g', fats: '28g' },
      ingredients: [
        { item: 'Chicken breast', quantity: '300g' },
        { item: 'Mixed baby greens', quantity: '150g' },
        { item: 'Ripe avocado', quantity: '1 pieces' },
        { item: 'Cucumber', quantity: '1 pieces' },
        { item: 'Olive oil', quantity: '1 tbsp' },
      ],
      instructions: [
        'Season chicken breast with garlic and sea salt, then sear until thoroughly cooked.',
        'Assemble baby greens, sliced cucumber, and avocado in a wide bowl.',
        'Slice warm chicken breast and serve atop greens with olive oil drizzle.',
      ],
    },
  ],

  dinner: [
    {
      id: 'di_paneer_spinach',
      name: 'Spiced Paneer & Wilted Spinach Skillet',
      description: 'Crispy seared paneer cubes tossed with nutrient-dense spinach, cumin seeds, garlic, and cold-pressed olive oil.',
      mealType: 'Dinner',
      dietaryPreferences: ['Vegetarian', 'Gluten Free', 'Low Carb'],
      prepTime: '10 mins',
      cookTime: '15 mins',
      totalTime: '25 mins',
      servings: 2,
      nutrition: { calories: 380, protein: '22g', carbohydrates: '12g', fats: '28g' },
      ingredients: [
        { item: 'Paneer', quantity: '250g' },
        { item: 'Fresh baby spinach', quantity: '150g' },
        { item: 'Garlic', quantity: '3 cloves' },
        { item: 'Cumin seeds', quantity: '1 tsp' },
        { item: 'Olive oil', quantity: '1 tbsp' },
      ],
      instructions: [
        'Warm olive oil in skillet and toast cumin seeds until fragrant.',
        'Add paneer cubes and sear until golden on all sides.',
        'Stir in minced garlic and fold in spinach until wilted.',
      ],
    },
    {
      id: 'di_salmon_citrus',
      name: 'Citrus Herb Salmon & Avocado Plate',
      description: 'Dietitian-calibrated wild salmon fillet pan-seared and served over quinoa with creamy sliced avocado.',
      mealType: 'Dinner',
      dietaryPreferences: ['High Protein', 'Gluten Free'],
      prepTime: '10 mins',
      cookTime: '15 mins',
      totalTime: '25 mins',
      servings: 2,
      nutrition: { calories: 490, protein: '38g', carbohydrates: '26g', fats: '26g' },
      ingredients: [
        { item: 'Salmon', quantity: '300g' },
        { item: 'Ripe avocado', quantity: '1 pieces' },
        { item: 'Cooked tri-color quinoa', quantity: '1 cup' },
        { item: 'Lemon juice', quantity: '2 tbsp' },
        { item: 'Olive oil', quantity: '1 tbsp' },
      ],
      instructions: [
        'Pan-sear seasoned salmon fillets for 4 minutes per side.',
        'Plate with warm cooked quinoa and sliced avocado.',
        'Finish with cold-pressed olive oil and fresh lemon juice.',
      ],
    },
    {
      id: 'di_tofu_stirfry',
      name: 'Sesame Tofu & Broccoli Green Stir Fry',
      description: 'Crisp pan-fried organic tofu tossed with tender broccoli florets, ginger, garlic, and toasted sesame oil.',
      mealType: 'Dinner',
      dietaryPreferences: ['Vegan', 'Vegetarian', 'Gluten Free', 'High Protein'],
      prepTime: '10 mins',
      cookTime: '12 mins',
      totalTime: '22 mins',
      servings: 2,
      nutrition: { calories: 390, protein: '24g', carbohydrates: '18g', fats: '22g' },
      ingredients: [
        { item: 'Firm tofu', quantity: '300g' },
        { item: 'Broccoli', quantity: '200g' },
        { item: 'Garlic', quantity: '3 cloves' },
        { item: 'Ginger', quantity: '1 tbsp' },
        { item: 'Sesame oil', quantity: '1 tbsp' },
        { item: 'Soy sauce', quantity: '1.5 tbsp' },
      ],
      instructions: [
        'Press tofu and cut into cubes; sear in sesame oil until golden.',
        'Add minced ginger, garlic, and broccoli florets with 2 tbsp water to steam.',
        'Drizzle with soy sauce and toss until tender-crisp.',
      ],
    },
    {
      id: 'di_stuffed_peppers',
      name: 'Quinoa & Herb Stuffed Bell Peppers',
      description: 'Sweet bell peppers baked with seasoned tri-color quinoa, sweet corn, black beans, and melted cheese.',
      mealType: 'Dinner',
      dietaryPreferences: ['Vegetarian', 'Gluten Free'],
      prepTime: '15 mins',
      cookTime: '25 mins',
      totalTime: '40 mins',
      servings: 2,
      nutrition: { calories: 440, protein: '18g', carbohydrates: '56g', fats: '15g' },
      ingredients: [
        { item: 'Bell pepper', quantity: '2 pieces' },
        { item: 'Cooked tri-color quinoa', quantity: '1.5 cups' },
        { item: 'Black beans', quantity: '150g' },
        { item: 'Tomato', quantity: '2 pieces' },
        { item: 'Cheese', quantity: '50g' },
      ],
      instructions: [
        'Halve bell peppers and remove seeds.',
        'Mix warm cooked quinoa, black beans, diced tomatoes, and spices.',
        'Stuff into pepper cavities, top with cheese, and bake at 190°C for 25 minutes.',
      ],
    },
  ],

  snack: [
    {
      id: 'sn_almond_chia',
      name: 'Roasted Almond & Chia Energy Clusters',
      description: 'Clean metabolic clusters offering healthy omega fats and steady glucose release throughout the afternoon.',
      mealType: 'Snack',
      dietaryPreferences: ['Low Carb', 'Vegan', 'Vegetarian', 'Gluten Free'],
      prepTime: '8 mins',
      cookTime: '0 mins',
      totalTime: '8 mins',
      servings: 2,
      nutrition: { calories: 195, protein: '7g', carbohydrates: '9g', fats: '15g' },
      ingredients: [
        { item: 'Almonds', quantity: '80g' },
        { item: 'Chia seeds', quantity: '2 tbsp' },
        { item: 'Vanilla', quantity: '0.5 tsp' },
      ],
      instructions: [
        'Mix coarsely chopped almonds and chia seeds.',
        'Form into compact snack clusters and chill for 10 minutes.',
      ],
    },
    {
      id: 'sn_roasted_chickpeas',
      name: 'Crispy Paprika Roasted Chickpeas',
      description: 'Crunchy oven-roasted chickpeas seasoned with smoked paprika, sea salt, and cold-pressed olive oil.',
      mealType: 'Snack',
      dietaryPreferences: ['Vegan', 'Vegetarian', 'Gluten Free', 'High Protein'],
      prepTime: '5 mins',
      cookTime: '20 mins',
      totalTime: '25 mins',
      servings: 2,
      nutrition: { calories: 180, protein: '8g', carbohydrates: '24g', fats: '6g' },
      ingredients: [
        { item: 'Cooked chickpeas', quantity: '150g' },
        { item: 'Olive oil', quantity: '1 tsp' },
        { item: 'Paprika', quantity: '1 tsp' },
      ],
      instructions: [
        'Pat chickpeas dry and toss with olive oil and smoked paprika.',
        'Roast in oven or air fryer at 200°C for 18 minutes until crisp.',
      ],
    },
    {
      id: 'sn_apple_peanut',
      name: 'Crisp Apple with Natural Peanut Butter',
      description: 'Sliced orchard apples paired with all-natural creamy peanut butter for fiber and sustained energy.',
      mealType: 'Snack',
      dietaryPreferences: ['Vegan', 'Vegetarian', 'Gluten Free'],
      prepTime: '3 mins',
      cookTime: '0 mins',
      totalTime: '3 mins',
      servings: 1,
      nutrition: { calories: 210, protein: '6g', carbohydrates: '26g', fats: '10g' },
      ingredients: [
        { item: 'Apple', quantity: '1 pieces' },
        { item: 'Peanut butter', quantity: '2 tbsp' },
      ],
      instructions: [
        'Core and slice a fresh crisp apple.',
        'Serve with 2 tbsp of creamy natural peanut butter for dipping.',
      ],
    },
  ],
};

const STORAGE_KEY = 'zaiqo_meal_plan';

/**
 * Filter pool for a meal slot by dietary preference
 */
function getFilteredSlotMeals(slot = 'breakfast', dietaryPreference = 'No Preference') {
  const pool = MEAL_RECIPE_POOL[slot] || [];
  if (!dietaryPreference || dietaryPreference === 'No Preference') {
    return pool;
  }
  const filtered = pool.filter((r) =>
    r.dietaryPreferences?.some(
      (p) => p.toLowerCase() === dietaryPreference.toLowerCase()
    )
  );
  return filtered.length > 0 ? filtered : pool;
}

/**
 * Generate a complete multi-day meal plan
 */
export function generateMealPlan({
  durationDays = 5,
  dietaryPreference = 'Vegetarian',
  calorieTarget = 1800,
} = {}) {
  const days = [];
  const duration = [3, 5, 7].includes(Number(durationDays)) ? Number(durationDays) : 5;

  const breakfastList = getFilteredSlotMeals('breakfast', dietaryPreference);
  const lunchList = getFilteredSlotMeals('lunch', dietaryPreference);
  const dinnerList = getFilteredSlotMeals('dinner', dietaryPreference);
  const snackList = getFilteredSlotMeals('snack', dietaryPreference);

  for (let d = 1; d <= duration; d++) {
    // Pick recipes by rotating through available filtered options
    const bRecipe = breakfastList[(d - 1) % breakfastList.length];
    const lRecipe = lunchList[(d - 1) % lunchList.length];
    const dRecipe = dinnerList[(d - 1) % dinnerList.length];
    const sRecipe = snackList[(d - 1) % snackList.length];

    const dayTotalCalories =
      (bRecipe?.nutrition?.calories || 0) +
      (lRecipe?.nutrition?.calories || 0) +
      (dRecipe?.nutrition?.calories || 0) +
      (sRecipe?.nutrition?.calories || 0);

    days.push({
      day: d,
      label: `Day ${d}`,
      totalCalories: dayTotalCalories,
      meals: {
        breakfast: bRecipe ? { ...bRecipe, zaiNote: `Calibrated for Day ${d} balanced breakfast energy.` } : null,
        lunch: lRecipe ? { ...lRecipe, zaiNote: `Sustained mid-day nutritional balance for Day ${d}.` } : null,
        dinner: dRecipe ? { ...dRecipe, zaiNote: `Nutrient-dense dinner recovery for Day ${d}.` } : null,
        snack: sRecipe ? { ...sRecipe, zaiNote: `Metabolic boost snack for Day ${d}.` } : null,
      },
    });
  }

  const newPlan = {
    id: `plan_${Date.now()}`,
    durationDays: duration,
    dietaryPreference,
    calorieTarget: Number(calorieTarget) || 1800,
    createdAt: Date.now(),
    days,
  };

  saveMealPlan(newPlan);
  return newPlan;
}

/**
 * Load meal plan from localStorage
 */
export function loadMealPlan() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save meal plan to localStorage
 */
export function saveMealPlan(plan) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (plan) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save meal plan to localStorage', err);
  }
}

/**
 * Replace a single meal in the plan without regenerating other meals
 */
export function replaceMeal(plan, dayNumber, mealType, newRecipe) {
  if (!plan || !Array.isArray(plan.days)) return plan;

  const updatedDays = plan.days.map((dayObj) => {
    if (dayObj.day === dayNumber) {
      const updatedMeals = {
        ...dayObj.meals,
        [mealType.toLowerCase()]: newRecipe,
      };

      const recalculatedCalories = Object.values(updatedMeals).reduce(
        (sum, m) => sum + (m?.nutrition?.calories || 0),
        0
      );

      return {
        ...dayObj,
        totalCalories: recalculatedCalories,
        meals: updatedMeals,
      };
    }
    return dayObj;
  });

  const updatedPlan = {
    ...plan,
    days: updatedDays,
  };

  saveMealPlan(updatedPlan);
  return updatedPlan;
}

/**
 * Regenerate only a single meal slot with an alternative recipe
 */
export function regenerateSingleMeal(plan, dayNumber, mealType) {
  if (!plan) return plan;

  const currentMeal = plan.days?.find((d) => d.day === dayNumber)?.meals?.[mealType.toLowerCase()];
  const candidates = getFilteredSlotMeals(mealType.toLowerCase(), plan.dietaryPreference);

  // Find candidate different from current
  const alternatives = candidates.filter((c) => c.id !== currentMeal?.id);
  const picked = alternatives.length > 0
    ? alternatives[Math.floor(Math.random() * alternatives.length)]
    : candidates[0];

  if (!picked) return plan;

  const recipeWithNote = {
    ...picked,
    zaiNote: `Alternative ${mealType} recommendation updated for Day ${dayNumber}.`,
  };

  return replaceMeal(plan, dayNumber, mealType, recipeWithNote);
}

/**
 * Remove a meal from a specific day slot
 */
export function removeMeal(plan, dayNumber, mealType) {
  return replaceMeal(plan, dayNumber, mealType, null);
}

/**
 * Get available alternative meals for replacement dialog
 */
export function getAvailableMealsForSlot(mealType = 'breakfast', dietaryPreference = 'No Preference') {
  return getFilteredSlotMeals(mealType.toLowerCase(), dietaryPreference);
}

/**
 * Collect all ingredients from the entire meal plan and add to Grocery List
 * Combines duplicate ingredients and tracks recipe sources
 */
export function createGroceryListFromMealPlan(plan) {
  if (!plan || !Array.isArray(plan.days)) {
    return { updatedList: loadGroceryList(), totalIngredientsAdded: 0 };
  }

  let currentGroceryList = loadGroceryList();
  let totalIngredientsAdded = 0;

  for (const day of plan.days) {
    if (!day.meals) continue;

    for (const [mealType, recipe] of Object.entries(day.meals)) {
      if (!recipe || !Array.isArray(recipe.ingredients)) continue;

      const sourceLabel = `${recipe.name} (${day.label} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)})`;
      currentGroceryList = mergeIngredientsIntoList(
        currentGroceryList,
        recipe.ingredients,
        sourceLabel
      );
      totalIngredientsAdded += recipe.ingredients.length;
    }
  }

  saveGroceryList(currentGroceryList);
  return {
    updatedList: currentGroceryList,
    totalIngredientsAdded,
    uniqueItemCount: currentGroceryList.length,
  };
}
