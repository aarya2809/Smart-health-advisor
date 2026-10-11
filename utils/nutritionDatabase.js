// Curated Nutritional Database for automatic food and dish calculations (per 100g)
const FOOD_DATABASE = [
  // Grains, Breads & Rice
  { id: 'oats', name: 'Rolled Oats (Raw)', category: 'Grain', defaultPortion: '1 cup cooked (240g)', gramsPerPortion: 240, caloriesPer100g: 71, proteinPer100g: 2.5, carbsPer100g: 12, fatsPer100g: 1.5, dietType: 'vegan' },
  { id: 'white_rice', name: 'White Basmati Rice (Cooked)', category: 'Grain', defaultPortion: '1 cup (160g)', gramsPerPortion: 160, caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, dietType: 'vegan' },
  { id: 'brown_rice', name: 'Brown Rice (Cooked)', category: 'Grain', defaultPortion: '1 cup (195g)', gramsPerPortion: 195, caloriesPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 24, fatsPer100g: 0.9, dietType: 'vegan' },
  { id: 'roti_chapati', name: 'Whole Wheat Roti / Chapati', category: 'Bread', defaultPortion: '1 piece (40g)', gramsPerPortion: 40, caloriesPer100g: 297, proteinPer100g: 9.3, carbsPer100g: 50, fatsPer100g: 3.7, dietType: 'vegan' },
  { id: 'whole_wheat_bread', name: 'Whole Wheat Bread Slice', category: 'Bread', defaultPortion: '1 slice (35g)', gramsPerPortion: 35, caloriesPer100g: 247, proteinPer100g: 12.0, carbsPer100g: 41, fatsPer100g: 3.5, dietType: 'vegan' },

  // Plant Proteins & Legumes (Vegetarian / Vegan staples)
  { id: 'dal_yellow', name: 'Yellow Moong / Toor Dal (Cooked)', category: 'Lentils', defaultPortion: '1 katori (150g)', gramsPerPortion: 150, caloriesPer100g: 105, proteinPer100g: 7.0, carbsPer100g: 16, fatsPer100g: 1.2, dietType: 'vegan' },
  { id: 'chana_chickpeas', name: 'Chole / Chickpeas Curry', category: 'Legumes', defaultPortion: '1 bowl (180g)', gramsPerPortion: 180, caloriesPer100g: 135, proteinPer100g: 7.5, carbsPer100g: 20, fatsPer100g: 2.8, dietType: 'vegan' },
  { id: 'rajma_kidneybeans', name: 'Rajma / Red Kidney Beans Curry', category: 'Legumes', defaultPortion: '1 bowl (180g)', gramsPerPortion: 180, caloriesPer100g: 128, proteinPer100g: 7.8, carbsPer100g: 19, fatsPer100g: 2.5, dietType: 'vegan' },
  { id: 'paneer_raw', name: 'Fresh Paneer (Cottage Cheese)', category: 'Dairy Protein', defaultPortion: '100g', gramsPerPortion: 100, caloriesPer100g: 265, proteinPer100g: 18.3, carbsPer100g: 3.4, fatsPer100g: 20.8, dietType: 'vegetarian' },
  { id: 'paneer_curry', name: 'Palak Paneer / Paneer Bhurji', category: 'Indian Dish', defaultPortion: '1 bowl (180g)', gramsPerPortion: 180, caloriesPer100g: 175, proteinPer100g: 9.5, carbsPer100g: 6.0, fatsPer100g: 12.5, dietType: 'vegetarian' },
  { id: 'tofu_firm', name: 'Firm Tofu (Organic Soya)', category: 'Plant Protein', defaultPortion: '100g', gramsPerPortion: 100, caloriesPer100g: 83, proteinPer100g: 10.0, carbsPer100g: 1.9, fatsPer100g: 5.3, dietType: 'vegan' },
  { id: 'soya_chunks', name: 'Soya Chunks / Meal (Cooked)', category: 'Plant Protein', defaultPortion: '1 bowl (150g)', gramsPerPortion: 150, caloriesPer100g: 120, proteinPer100g: 18.0, carbsPer100g: 8.0, fatsPer100g: 0.5, dietType: 'vegan' },

  // Eggs & Dairy
  { id: 'boiled_egg', name: 'Boiled Egg (Large)', category: 'Egg', defaultPortion: '1 whole egg (50g)', gramsPerPortion: 50, caloriesPer100g: 155, proteinPer100g: 13.0, carbsPer100g: 1.1, fatsPer100g: 11.0, dietType: 'eggetarian' },
  { id: 'egg_whites', name: 'Egg Whites (Liquid/Cooked)', category: 'Egg', defaultPortion: '2 egg whites (66g)', gramsPerPortion: 66, caloriesPer100g: 52, proteinPer100g: 11.0, carbsPer100g: 0.7, fatsPer100g: 0.2, dietType: 'eggetarian' },
  { id: 'greek_yogurt', name: 'Greek Yogurt / Plain Dahi (Curd)', category: 'Dairy', defaultPortion: '1 cup (150g)', gramsPerPortion: 150, caloriesPer100g: 65, proteinPer100g: 9.5, carbsPer100g: 3.6, fatsPer100g: 1.5, dietType: 'vegetarian' },
  { id: 'milk_toned', name: 'Toned Cow Milk (Pasteurized)', category: 'Dairy', defaultPortion: '1 glass (250ml/250g)', gramsPerPortion: 250, caloriesPer100g: 58, proteinPer100g: 3.2, carbsPer100g: 4.8, fatsPer100g: 3.0, dietType: 'vegetarian' },

  // Poultry & Fish (For Non-Vegetarian selection)
  { id: 'chicken_breast', name: 'Chicken Breast (Grilled/Cooked)', category: 'Poultry', defaultPortion: '1 fillet (150g)', gramsPerPortion: 150, caloriesPer100g: 165, proteinPer100g: 31.0, carbsPer100g: 0, fatsPer100g: 3.6, dietType: 'non_vegetarian' },
  { id: 'fish_tilapia', name: 'Fish Fillet (White / Tilapia / Rohu)', category: 'Seafood', defaultPortion: '1 fillet (120g)', gramsPerPortion: 120, caloriesPer100g: 128, proteinPer100g: 26.0, carbsPer100g: 0, fatsPer100g: 2.7, dietType: 'pescatarian' },

  // Fruits, Vegetables & Nuts
  { id: 'banana', name: 'Fresh Banana (Medium)', category: 'Fruit', defaultPortion: '1 medium (118g)', gramsPerPortion: 118, caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, dietType: 'vegan' },
  { id: 'apple', name: 'Fresh Apple (Medium)', category: 'Fruit', defaultPortion: '1 medium (180g)', gramsPerPortion: 180, caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatsPer100g: 0.2, dietType: 'vegan' },
  { id: 'almonds_raw', name: 'Raw Almonds (Badam)', category: 'Nuts', defaultPortion: '1 handful (28g / ~15 nuts)', gramsPerPortion: 28, caloriesPer100g: 579, proteinPer100g: 21.2, carbsPer100g: 22, fatsPer100g: 49.9, dietType: 'vegan' },
  { id: 'peanut_butter', name: 'Natural Peanut Butter (No added sugar)', category: 'Nut Butter', defaultPortion: '1 tbsp (16g)', gramsPerPortion: 16, caloriesPer100g: 588, proteinPer100g: 25.0, carbsPer100g: 20, fatsPer100g: 50.0, dietType: 'vegan' },
  { id: 'green_salad', name: 'Mixed Green Salad (Cucumber, Tomato, Spinach)', category: 'Vegetable', defaultPortion: '1 bowl (150g)', gramsPerPortion: 150, caloriesPer100g: 25, proteinPer100g: 1.5, carbsPer100g: 4.5, fatsPer100g: 0.3, dietType: 'vegan' },

  // Supplements
  { id: 'whey_protein', name: 'Whey Protein Powder (1 Scoop)', category: 'Supplement', defaultPortion: '1 scoop (30g)', gramsPerPortion: 30, caloriesPer100g: 400, proteinPer100g: 80.0, carbsPer100g: 6.0, fatsPer100g: 4.0, dietType: 'vegetarian' }
];

// Search foods with dietary preference & allergy safety filtering
const searchFoods = (query, userDietType = 'vegetarian', userAllergies = []) => {
  if (!query || typeof query !== 'string') return FOOD_DATABASE.slice(0, 10);
  const cleanQ = query.trim().toLowerCase();

  return FOOD_DATABASE.filter(food => {
    // 1. Text match
    const matchesName = food.name.toLowerCase().includes(cleanQ) || food.category.toLowerCase().includes(cleanQ);
    if (!matchesName) return false;

    // 2. Vegetarian safety check: if user is vegetarian, hide non-veg/fish
    if (userDietType === 'vegetarian') {
      if (food.dietType === 'non_vegetarian' || food.dietType === 'pescatarian') return false;
    } else if (userDietType === 'vegan') {
      if (food.dietType !== 'vegan') return false;
    } else if (userDietType === 'eggetarian') {
      if (food.dietType === 'non_vegetarian' || food.dietType === 'pescatarian') return false;
    }

    // 3. User allergy check
    if (Array.isArray(userAllergies) && userAllergies.length > 0) {
      for (const allergy of userAllergies) {
        const aStr = (allergy.allergen || allergy || '').toLowerCase();
        if (aStr && food.name.toLowerCase().includes(aStr)) return false;
      }
    }

    return true;
  });
};

// Calculate nutritional content automatically based on portion grams or count
const calculateNutrition = (foodId, quantity = 1, customGrams = null) => {
  const food = FOOD_DATABASE.find(f => f.id === foodId);
  if (!food) {
    // Fallback for custom user foods
    const estGrams = customGrams || (quantity * 100);
    return {
      foodName: 'Custom Food Item',
      portion: `${quantity} serving`,
      grams: estGrams,
      calories: Math.round(estGrams * 1.5),
      protein: Math.round(estGrams * 0.05),
      carbs: Math.round(estGrams * 0.2),
      fats: Math.round(estGrams * 0.05),
      isEstimated: true
    };
  }

  const effectiveGrams = customGrams ? Number(customGrams) : (food.gramsPerPortion * Number(quantity));
  const factor = effectiveGrams / 100;

  return {
    foodId: food.id,
    foodName: food.name,
    category: food.category,
    portion: `${quantity} × ${food.defaultPortion}`,
    grams: Math.round(effectiveGrams),
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fats: Math.round(food.fatsPer100g * factor * 10) / 10,
    isEstimated: false
  };
};

module.exports = {
  FOOD_DATABASE,
  searchFoods,
  calculateNutrition
};
