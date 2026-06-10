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

  const rawData = await response.json();
  return normalizeRecommendationResponse(rawData);
}

export function normalizeRecommendationResponse(rawData) {
  // Case 1: backend already follows the older selected_recipe contract
  if (rawData?.selected_recipe) {
    return {
      selected_recipe: rawData.selected_recipe,
      match_reasons: rawData.match_reasons || [],
      how_recommended: rawData.how_recommended || [],
      timeline: rawData.timeline || [],
      template_story: rawData.template_story || rawData.human_story || '',
      llm_story: rawData.llm_story || '',
      story_source: rawData.story_source || 'backend'
    };
  }

  // Case 2: current backend format from the group chat
  const nutritionRaw = rawData?.nutrition_raw || {};
  const nutritionSummary = rawData?.nutrition || {};

  return {
    selected_recipe: {
      id: rawData.recipe_id,
      name: rawData.name,
      description: rawData.description,
      tagline: rawData.tagline,
      minutes: nutritionSummary.time_min,
      ingredients: rawData.ingredients || [],
      steps: rawData.steps || [],
      tags: rawData.tags || [],
      nutrition: {
        calories: nutritionRaw.calories ?? nutritionSummary.calories,
        fat_pdv: nutritionRaw.total_fat_pct_dv,
        sugar_pdv: nutritionRaw.sugar_pct_dv,
        sodium_pdv: nutritionRaw.sodium_pct_dv,
        protein_pdv: nutritionRaw.protein_pct_dv ?? nutritionSummary.protein_pct_dv,
        saturated_fat_pdv: nutritionRaw.saturated_fat_pct_dv,
        carbohydrates_pdv: nutritionRaw.carbohydrates_pct_dv,
        difficulty: nutritionSummary.difficulty
      }
    },
    match_reasons: rawData.why_it_fits || [],
    how_recommended: rawData.how_recommended || [],
    timeline: rawData.timeline || [],
    template_story: rawData.template_story || rawData.human_story || '',
    llm_story: rawData.llm_story || '',
    story_source: rawData.story_source || 'template'
  };
}