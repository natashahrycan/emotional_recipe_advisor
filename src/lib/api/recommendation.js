const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function buildRecommendationPayload(answers) {
  return {
    persona: answers.userType,
    filters: {
      dish_type: answers.dishType,
      format: answers.format || 'no-preference',
      nutrition_goal: answers.nutritionGoal,
      cooking_time: answers.cookingTime,
      effort: answers.effort,
      ingredient_groups: normalizeArrayFilter(answers.ingredients, 'not-sure'),
      avoid_ingredients: normalizeArrayFilter(answers.allergies, 'no-allergy')
    }
  };
}

function normalizeArrayFilter(value, emptyValue) {
  if (!Array.isArray(value)) return [];

  if (value.includes(emptyValue)) {
    return [];
  }

  return value;
}

export async function requestRecipeRecommendation(answers) {
  const payload = buildRecommendationPayload(answers);

  const response = await fetch(`${API_BASE_URL}/api/recommend-recipe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Recommendation request failed: ${response.status}`);
  }

  return response.json();
}