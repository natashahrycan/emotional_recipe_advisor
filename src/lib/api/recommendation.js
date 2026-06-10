const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function buildRecommendationPayload(answers) {
  return {
    persona: answers.userType,
    answers: {
      dishType: answers.dishType,
      nutritionGoal: answers.nutritionGoal,
      time: answers.cookingTime,
      ingredients: normalizeIngredientGroupsForBackend(answers.ingredients),
      avoid: normalizeArrayFilter(answers.allergies, 'no-allergy'),
      effort: answers.effort
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

function normalizeIngredientGroupsForBackend(value) {
  if (!Array.isArray(value)) return [];

  if (value.includes('not-sure')) {
    return [];
  }

  // Frontend value -> backend value mapping
  // Backend confirmed example uses "legumes-plant-protein"
  const map = {
    legumes: 'legumes-plant-protein'
  };

  return value.map((item) => map[item] || item);
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
  /*
    Supported backend response shapes:

    1. Current backend flat recipe object:
       {
         recipe_id,
         name,
         description,
         tags,
         minutes,
         n_steps,
         tagline,
         ingredients,
         nutrition_raw,
         why_it_fits,
         llm_story?
       }

    2. Future possible object with llm_output:
       {
         ...recipeData,
         llm_output: [
           { recipe_id, llm_story }
         ]
       }

    3. Older selected_recipe contract:
       {
         selected_recipe,
         match_reasons,
         llm_story
       }
  */

  if (rawData?.selected_recipe) {
    const selectedRecipe = rawData.selected_recipe;
    const stepCount = selectedRecipe.n_steps ?? selectedRecipe.steps?.length;

    return {
      selected_recipe: {
        ...selectedRecipe,
        nutrition: {
          ...(selectedRecipe.nutrition || {}),
          difficulty:
            selectedRecipe.nutrition?.difficulty ||
            selectedRecipe.difficulty ||
            getDifficultyFromStepCount(stepCount)
        }
      },
      match_reasons: rawData.match_reasons || [],
      how_recommended: rawData.how_recommended || [],
      timeline: rawData.timeline || [],
      template_story: rawData.template_story || '',
      llm_story: getLlmStory(rawData, selectedRecipe.id),
      story_source: rawData.story_source || 'backend'
    };
  }

  const nutritionRaw = rawData?.nutrition_raw || {};
  const recipeId = rawData?.recipe_id;

  return {
    selected_recipe: {
      id: recipeId,
      recipe_id: recipeId,
      name: rawData?.name,
      description: rawData?.description,
      tagline: rawData?.tagline,
      minutes: rawData?.minutes,
      n_steps: rawData?.n_steps,
      ingredients: rawData?.ingredients || [],
      steps: rawData?.steps || [],
      tags: rawData?.tags || [],
      nutrition: {
        calories: nutritionRaw.calories,
        fat_pdv: nutritionRaw.total_fat_pct_dv,
        sugar_pdv: nutritionRaw.sugar_pct_dv,
        sodium_pdv: nutritionRaw.sodium_pct_dv,
        protein_pdv: nutritionRaw.protein_pct_dv,
        saturated_fat_pdv: nutritionRaw.saturated_fat_pct_dv,
        carbohydrates_pdv: nutritionRaw.carbohydrates_pct_dv,
        difficulty: getDifficultyFromStepCount(rawData?.n_steps)
      }
    },
    match_reasons: rawData?.why_it_fits || [],
    how_recommended: rawData?.how_recommended || [],
    timeline: rawData?.timeline || [],
    template_story: rawData?.template_story || '',
    llm_story: getLlmStory(rawData, recipeId),
    story_source: rawData?.story_source || (rawData?.llm_story ? 'llm' : 'backend')
  };
}

function getDifficultyFromStepCount(stepCount) {
  if (typeof stepCount !== 'number') return '—';

  if (stepCount < 8) return 'Easy';
  if (stepCount <= 15) return 'Medium';
  return 'Difficult';
}

function getLlmStory(rawData, recipeId) {
  if (rawData?.llm_story) {
    return rawData.llm_story;
  }

  if (Array.isArray(rawData?.llm_output)) {
    const matchedStory = rawData.llm_output.find((item) => {
      return String(item.recipe_id) === String(recipeId);
    });

    return matchedStory?.llm_story || '';
  }

  if (Array.isArray(rawData?.llm_stories)) {
    const matchedStory = rawData.llm_stories.find((item) => {
      return String(item.recipe_id) === String(recipeId);
    });

    return matchedStory?.llm_story || '';
  }

  return '';
}