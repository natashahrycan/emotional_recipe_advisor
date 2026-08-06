const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function buildRecommendationPayload(answers) {
  return {
    persona: answers.userType,

    answers: {
      dishType: answers.dishType,
      nutritionGoal: answers.nutritionGoal,
      time: answers.cookingTime,

      ingredients: normalizeIngredientGroupsForBackend(
        answers.ingredients
      ),

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
    legumes:
      'legumes-plant-protein'
  };


  return value.map(
    item => map[item] || item
  );
}



export async function requestRecipeRecommendation(answers) {

  const payload =
    buildRecommendationPayload(answers);


  const response = await fetch(
    `${API_BASE_URL}/api/recommend-recipe`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json'
      },

      body:
        JSON.stringify(payload)
    }
  );


  if (!response.ok) {

    throw new Error(
      `Recommendation request failed: ${response.status}`
    );

  }


  const rawData =
    await response.json();


  return normalizeRecommendationResponse(
    rawData
  );

}




export function normalizeRecommendationResponse(rawData) {


  /*
    Supported:

    1.
    Backend recipe object:

    {
      recipe_id,
      name,
      nutrition_raw,
      why_it_fits
    }


    2.
    Backend merged with LLM:

    {
      ...recipe,
      llm_story
    }


    3.
    Backend wrapper:

    {
      recipe,
      llm_output:[]
    }

  */



  const recipeData =
    rawData?.recipe || rawData;



  const recipeId =
    recipeData?.recipe_id;



  const nutritionRaw =
    recipeData?.nutrition_raw || {};



  return {

    selected_recipe: {

      id:
        recipeId,

      recipe_id:
        recipeId,


      name:
        recipeData?.name,


      description:
        recipeData?.description,


      tagline:
        recipeData?.tagline,


      minutes:
        recipeData?.minutes,


      n_steps:
        recipeData?.n_steps,


      ingredients:
        recipeData?.ingredients || [],


      steps:
        recipeData?.steps || [],


      tags:
        recipeData?.tags || [],


      nutrition: {

        calories:
          nutritionRaw.calories,


        fat_pdv:
          nutritionRaw.total_fat_pct_dv,


        sugar_pdv:
          nutritionRaw.sugar_pct_dv,


        sodium_pdv:
          nutritionRaw.sodium_pct_dv,


        protein_pdv:
          nutritionRaw.protein_pct_dv,


        saturated_fat_pdv:
          nutritionRaw.saturated_fat_pct_dv,


        carbohydrates_pdv:
          nutritionRaw.carbohydrates_pct_dv,


        difficulty:
          getDifficultyFromStepCount(
            recipeData?.n_steps
          )

      }

    },


    match_reasons:
      recipeData?.why_it_fits || [],


    how_recommended:
      recipeData?.how_recommended || [],


    llm_story:
      getLlmStory(
        rawData,
        recipeId
      ),


    story_source:
      getLlmStory(
        rawData,
        recipeId
      )
      ? 'llm'
      : 'backend'

  };

}




function getDifficultyFromStepCount(stepCount) {


  if (
    typeof stepCount !== 'number'
  ) {

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




function getLlmStory(
  rawData,
  recipeId
) {


  // Case 1:
  // backend already merges story

  if (
    rawData?.llm_story
  ) {

    return rawData.llm_story;

  }



  // Case 2:
  // LLM returns directly:

  /*
  [
    {
      recipe_id:338753,
      llm_story:"..."
    }
  ]
  */


  if (
    Array.isArray(rawData)
  ) {


    const item =
      rawData.find(
        x =>
          String(x.recipe_id)
          ===
          String(recipeId)
      );


    return item?.llm_story || '';

  }



  // Case 3:
  // backend wrapper


  if (
    Array.isArray(
      rawData?.llm_output
    )
  ) {


    const item =
      rawData.llm_output.find(
        x =>
          String(x.recipe_id)
          ===
          String(recipeId)
      );


    return item?.llm_story || '';

  }



  return '';

}