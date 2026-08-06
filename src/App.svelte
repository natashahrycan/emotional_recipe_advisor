<script>

import KitchenStage from '$lib/components/KitchenStage.svelte';
import StepSidebar from '$lib/components/StepSidebar.svelte';
import ProfilePanel from '$lib/components/ProfilePanel.svelte';
import QuestionPanel from '$lib/components/QuestionPanel.svelte';
import RecipeStoryModal from '$lib/components/RecipeStoryModal.svelte';


import { hotspots, requiredAnswerKeys, getOptionLabel } 
from '$lib/data/questions.js';


import { requestRecipeRecommendation } from '$lib/api/recommendation.js';


let hoverHotspotId = null;

let activeHotspotId = 'profile';



let answers = {

  userType: null,

  dishType: null,

  format: null,

  nutritionGoal: null,

  cookingTime: null,

  effort: null,

  ingredients: [],

  allergies: []

};



let showResultModal = false;

let selectedRecipe = null;

let isGenerating = false;

let generateError = null;







// =============================
// Reactive states
// =============================


$: activeHotspot =
  hotspots.find(
    (item) => item.id === activeHotspotId
  );



$: completedIds =
  hotspots

    .filter((item) => {

      if (!item.answerKey) return false;


      const value =
        answers[item.answerKey];


      if (Array.isArray(value)) {

        return value.length > 0;

      }


      return Boolean(value);

    })

    .map(
      (item) => item.id
    );




$: missingRequiredKeys =
  requiredAnswerKeys.filter((key) => {

    const value =
      answers[key];


    if (Array.isArray(value)) {

      return value.length === 0;

    }


    return !value;

  });





$: canGenerate =
  missingRequiredKeys.length === 0;





$: missingLabels =
  missingRequiredKeys.map((key) => {


    const labels = {


      userType: 'User type',

      dishType: 'Dish type',

      nutritionGoal: 'Nutrition goal',

      cookingTime: 'Cooking time',

      effort: 'Cooking effort',

      allergies: 'Allergies / avoid rules'

    };


    return labels[key] || key;

  });





$: profileTags =
  buildProfileTags(answers);



$: recommendationSignals =
  buildSignals(answers);






function selectHotspot(id) {

  activeHotspotId = id;

}




function setAnswer(event) {


  const { key, value } =
    event.detail;


  answers = {

    ...answers,

    [key]: value

  };


}




function goToNextHotspot() {


  const currentIndex =
    hotspots.findIndex(
      (item) => item.id === activeHotspotId
    );


  const next =
    hotspots[currentIndex + 1]
    ||
    hotspots[0];


  activeHotspotId =
    next.id;

}





function goToPreviousHotspot() {


  const currentIndex =
    hotspots.findIndex(
      (item) => item.id === activeHotspotId
    );


  const previous =
    hotspots[currentIndex - 1]
    ||
    hotspots[0];


  activeHotspotId =
    previous.id;

}





function buildProfileTags(currentAnswers) {


  const tags = [];


  const simpleKeys = [

    'userType',

    'dishType',

    'format',

    'nutritionGoal',

    'cookingTime',

    'effort'

  ];



  for (const key of simpleKeys) {


    if (currentAnswers[key]) {


      tags.push(
        getOptionLabel(
          key,
          currentAnswers[key]
        )
      );


    }

  }




  if (

    Array.isArray(currentAnswers.ingredients)

    &&

    currentAnswers.ingredients.length > 0

  ) {


    if (
      currentAnswers.ingredients.includes('not-sure')
    ) {


      tags.push(
        'Ingredients not sure'
      );


    }

    else {


      tags.push(
        `${currentAnswers.ingredients.length} ingredient groups`
      );


    }

  }





  if (

    Array.isArray(currentAnswers.allergies)

    &&

    currentAnswers.allergies.length > 0

  ) {


    if (
      currentAnswers.allergies.includes('no-allergy')
    ) {


      tags.push(
        'No allergy'
      );


    }

    else {


      tags.push(
        `Avoid: ${
          currentAnswers.allergies
          .map(
            item =>
            getOptionLabel(
              'allergies',
              item
            )
          )
          .join(', ')
        }`
      );


    }

  }



  return tags;

}





function buildSignals(currentAnswers) {


  const signals = [];


  if (
    currentAnswers.userType === 'busy-student'
  ) {

    signals.push(
      'Student-friendly story angle'
    );

  }



  if (
    currentAnswers.nutritionGoal === 'high-protein'
  ) {

    signals.push(
      'Protein-focused recommendation'
    );

  }



  if (
    currentAnswers.cookingTime === '0-15'
    ||
    currentAnswers.cookingTime === '15-30'
  ) {

    signals.push(
      'Quick meal preferred'
    );

  }



  if (
    currentAnswers.effort === 'very-simple'
  ) {

    signals.push(
      'Very simple cooking flow'
    );

  }



  if (
    signals.length === 0
  ) {

    return [
      'Waiting for more answers'
    ];

  }


  return signals.slice(0,5);

}





// =============================
// Temporary mock generate
// Replace with API later
// =============================


async function generateStory() {
  if (!canGenerate || isGenerating) return;

  isGenerating = true;
  generateError = null;

  try {
    selectedRecipe = await requestRecipeRecommendation(answers);
    showResultModal = true;
  } catch (error) {
    console.error(error);
    generateError = 'Failed to generate recipe story. Please try again.';
  } finally {
    isGenerating = false;
  }
}




</script>

<main class="app-shell">
  <div class="app-frame">
    <KitchenStage
      {hotspots}
      {hoverHotspotId}
      {activeHotspotId}
      {completedIds}
      on:hover={(event) => (hoverHotspotId = event.detail)}
      on:select={(event) => selectHotspot(event.detail)}
    />

    <header class="top-hud">
      <div class="brand">
        <span class="brand-icon">🍲</span>
        <div>
          <strong>Recipe Story AI</strong>
          <small>Pixel kitchen recommender</small>
        </div>
      </div>

      <div class="top-progress">
        {#each hotspots as hotspot}
          <button
            class:active={activeHotspotId === hotspot.id}
            class:done={completedIds.includes(hotspot.id)}
            on:click={() => selectHotspot(hotspot.id)}
          >
            {hotspot.stepLabel}
          </button>
        {/each}
      </div>

      <nav class="top-links">
        <span>Saved</span>
        <span>History</span>
        <span>Profile</span>
      </nav>
    </header>

    <StepSidebar
      {hotspots}
      {activeHotspotId}
      {completedIds}
      on:select={(event) => selectHotspot(event.detail)}
    />

    <ProfilePanel
      profileTags={profileTags}
      signals={recommendationSignals}
    />

    <QuestionPanel
      {activeHotspot}
      {answers}
      {canGenerate}
      {missingLabels}
      {isGenerating}
      {generateError}
      on:answer={setAnswer}
      on:next={goToNextHotspot}
      on:back={goToPreviousHotspot}
      on:generate={generateStory}
    />

    <RecipeStoryModal
      recipe={showResultModal ? selectedRecipe : null}
      {profileTags}
      on:close={() => (showResultModal = false)}
      on:adjust={() => {
        showResultModal = false;
        activeHotspotId = 'profile';
      }}
    />
  </div>
</main>