const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function buildRecommendationPayload(answers) {
  return {
    persona: answers.userType,

    answers: {
      dishType: answers.dishType,
      nutritionGoal: answers.nutritionGoal,
      time: answers.cookingTime,

      ingredients: normalizeIngredientGroupsForBackend(answers.ingredients),

      avoid: normalizeArrayFilter(
        answers.allergies,
        'no-allergy'
      ),

      effort: answers.effort
    }
  };
}

function normalizeArrayFilter(value, emptyValue) {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.includes(emptyValue)) {
    return [];
  }

  return value;
}

function normalizeIngredientGroupsForBackend(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.includes('not-sure')) {
    return [];
  }

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
    throw new Error(
      `Recommendation request failed: ${response.status}`
    );
  }

  const rawData = await response.json();

  return normalizeRecommendationResponse(rawData);
}

export function normalizeRecommendationResponse(rawData) {
  /*
    Supported backend response shapes:

    1. Current backend recipe object:
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
         human_story,
         llm_story
       }

    2. Backend wrapper:
       {
         recipe: {
           ...
         },
         human_story,
         llm_story
       }

    3. Backend selected_recipe wrapper:
       {
         selected_recipe: {
           ...
         },
         human_story,
         llm_story
       }

    4. Story array support:
       human_output / human_stories / llm_output / llm_stories
  */

  const recipeData =
    rawData?.recipe ||
    rawData?.selected_recipe ||
    rawData;

  const recipeId =
    recipeData?.recipe_id ||
    recipeData?.id;

  const nutritionRaw =
    recipeData?.nutrition_raw ||
    rawData?.nutrition_raw ||
    {};

  const nutrition =
    recipeData?.nutrition ||
    rawData?.nutrition ||
    {};

  const humanStory =
    getHumanStory(rawData, recipeData, recipeId);

  const llmStory =
    getLlmStory(rawData, recipeId);

  return {
    selected_recipe: {
      id: recipeId,
      recipe_id: recipeId,

      name: recipeData?.name,

      description: recipeData?.description,

      tagline: recipeData?.tagline,

      minutes: recipeData?.minutes,

      n_steps: recipeData?.n_steps,

      ingredients: recipeData?.ingredients || [],

      steps: recipeData?.steps || [],

      tags: recipeData?.tags || [],

      nutrition: {
        calories: toNumber(
          nutritionRaw.calories ??
          nutrition.calories
        ),

        fat_pdv: toNumber(
          nutritionRaw.total_fat_pct_dv ??
          nutrition.total_fat_pct_dv ??
          nutrition.fat_pdv
        ),

        sugar_pdv: toNumber(
          nutritionRaw.sugar_pct_dv ??
          nutrition.sugar_pct_dv ??
          nutrition.sugar_pdv
        ),

        sodium_pdv: toNumber(
          nutritionRaw.sodium_pct_dv ??
          nutrition.sodium_pct_dv ??
          nutrition.sodium_pdv
        ),

        protein_pdv: toNumber(
          nutritionRaw.protein_pct_dv ??
          nutrition.protein_pct_dv ??
          nutrition.protein_pdv
        ),

        saturated_fat_pdv: toNumber(
          nutritionRaw.saturated_fat_pct_dv ??
          nutrition.saturated_fat_pct_dv ??
          nutrition.saturated_fat_pdv
        ),

        carbohydrates_pdv: toNumber(
          nutritionRaw.carbohydrates_pct_dv ??
          nutrition.carbohydrates_pct_dv ??
          nutrition.carbohydrates_pdv
        ),

        difficulty:
          recipeData?.difficulty ||
          nutrition.difficulty ||
          getDifficultyFromStepCount(
            recipeData?.n_steps ??
            recipeData?.steps?.length
          )
      }
    },

    match_reasons:
      recipeData?.why_it_fits ||
      rawData?.why_it_fits ||
      rawData?.match_reasons ||
      [],

    how_recommended:
      recipeData?.how_recommended ||
      rawData?.how_recommended ||
      [],

    human_story: humanStory,

    llm_story: llmStory,

    story_source:
      humanStory && llmStory
        ? 'human + llm'
        : llmStory
          ? 'llm'
          : humanStory
            ? 'human'
            : 'backend'
  };
}

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

function getDifficultyFromStepCount(stepCount) {
  if (typeof stepCount !== 'number') {
    return '—';
  }

  if (stepCount < 8) {
    return 'Easy';
  }

  if (stepCount <= 15) {
    return 'Medium';
  }

  return 'Difficult';
}

function getHumanStory(rawData, recipeData, recipeId) {
  if (recipeData?.human_story) {
    return recipeData.human_story;
  }

  if (rawData?.human_story) {
    return rawData.human_story;
  }

  if (rawData?.recipe?.human_story) {
    return rawData.recipe.human_story;
  }

  if (rawData?.selected_recipe?.human_story) {
    return rawData.selected_recipe.human_story;
  }

  if (Array.isArray(rawData?.human_output)) {
    const item = rawData.human_output.find((story) => {
      return String(story.recipe_id) === String(recipeId);
    });

    return item?.human_story || '';
  }

  if (Array.isArray(rawData?.human_stories)) {
    const item = rawData.human_stories.find((story) => {
      return String(story.recipe_id) === String(recipeId);
    });

    return item?.human_story || '';
  }

  return '';
}

function getLlmStory(rawData, recipeId) {
  if (rawData?.llm_story) {
    return rawData.llm_story;
  }

  if (rawData?.recipe?.llm_story) {
    return rawData.recipe.llm_story;
  }

  if (rawData?.selected_recipe?.llm_story) {
    return rawData.selected_recipe.llm_story;
  }

  if (Array.isArray(rawData)) {
    const item = rawData.find((story) => {
      return String(story.recipe_id) === String(recipeId);
    });

    return item?.llm_story || '';
  }

  if (Array.isArray(rawData?.llm_output)) {
    const item = rawData.llm_output.find((story) => {
      return String(story.recipe_id) === String(recipeId);
    });

    return item?.llm_story || '';
  }

  if (Array.isArray(rawData?.llm_stories)) {
    const item = rawData.llm_stories.find((story) => {
      return String(story.recipe_id) === String(recipeId);
    });

    return item?.llm_story || '';
  }

  return '';
}