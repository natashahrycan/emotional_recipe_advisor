<script>
  import { createEventDispatcher } from 'svelte';


  export let recipe = null;
  export let profileTags = [];


  const dispatch = createEventDispatcher();



  $: selectedRecipe =
    recipe?.selected_recipe || null;


  $: nutrition =
    selectedRecipe?.nutrition || {};


  $: matchReasons =
    recipe?.match_reasons || [];


  $: howRecommended =
    recipe?.how_recommended || [];


  $: timeline =
    recipe?.timeline || [];


  $: templateStoryText =
    recipe?.template_story || "";


  $: llmStoryText =
    recipe?.llm_story || "";


  $: storySource =
    recipe?.story_source || "";



  $: nutritionVisuals =
    buildNutritionVisuals(nutrition);



  function buildNutritionVisuals(nutrition) {


    const caloriesPercent =
      nutrition.calories
      ?
      Math.round(
        (nutrition.calories / 2000) * 100
      )
      :
      0;



    return [

      {
        name: "Calories",
        value: nutrition.calories,
        percent: caloriesPercent
      },


      {
        name: "Protein",
        value: nutrition.protein_pdv,
        percent: nutrition.protein_pdv
      },


      {
        name: "Fat",
        value: nutrition.fat_pdv,
        percent: nutrition.fat_pdv
      },


      {
        name: "Sugar",
        value: nutrition.sugar_pdv,
        percent: nutrition.sugar_pdv
      },


      {
        name: "Sodium",
        value: nutrition.sodium_pdv,
        percent: nutrition.sodium_pdv
      }

    ];

  }


</script>



{#if recipe && selectedRecipe}


<div class="modal-backdrop" on:click={() => dispatch('close')}>



<section
class="story-modal"
on:click|stopPropagation
>



<header class="modal-header">


<div>


<p class="eyebrow">
Recipe Data Storytelling
</p>



<h2>
{selectedRecipe.name}
</h2>



<p>
{selectedRecipe.tagline || selectedRecipe.description}
</p>


</div>



<button
class="close-btn"
on:click={() => dispatch('close')}
>
×
</button>


</header>





<div class="modal-profile">


{#each profileTags as tag}

<span>
{tag}
</span>

{/each}



{#if storySource}

<span>
Story source: {storySource}
</span>

{/if}


</div>






<div class="story-columns">


<article class="story-card">


<h3>
Recommendation Summary
</h3>



{#if templateStoryText}


<p>
{templateStoryText}
</p>



{:else if selectedRecipe.description}


<p>
{selectedRecipe.description}
</p>



{#if matchReasons.length > 0}

<ul>

{#each matchReasons as reason}

<li>
{reason}
</li>

{/each}

</ul>

{/if}



{:else}


<p>
No recommendation summary returned yet.
</p>


{/if}



</article>





<article class="story-card">


<h3>
LLM-generated Story
</h3>



{#if llmStoryText}


<p>
{llmStoryText}
</p>



{:else}


<p class="placeholder-text">

Waiting for the LLM story output.

</p>



{/if}



</article>


</div>







<div class="result-bottom">



<article class="why-card">


<h3>
Why this recipe fits
</h3>



{#if matchReasons.length > 0}


<ul>

{#each matchReasons as reason}


<li>
{reason}
</li>


{/each}

</ul>



{:else}


<p>
No match reasons returned yet.
</p>


{/if}


</article>







<article class="metrics-card">


<h3>
Nutrition Snapshot
</h3>





<div class="nutrition-chart-grid">


{#each nutritionVisuals as item}



<div class="nutrition-item">



<div
class="donut"
style={`--percent:${Math.min(item.percent || 0,100)}%`}
>


<div class="donut-center">

{Math.round(item.percent || 0)}%

</div>


</div>





<strong>
{item.name}
</strong>



<span>


{item.value ?? "—"}



{#if item.name === "Calories"}

kcal

{:else}

% DV

{/if}



</span>



</div>



{/each}


</div>





<p class="nutrition-note">

Calories are calculated based on a 2000 kcal daily reference diet.

</p>






<div class="extra-info">


<div>

Time:

<strong>
{selectedRecipe.minutes ?? "—"} min
</strong>

</div>



<div>

Steps:

<strong>
{selectedRecipe.n_steps ?? "—"}
</strong>

</div>




<div>

Difficulty:

<strong>
{nutrition.difficulty ?? "—"}
</strong>

</div>



</div>




</article>



</div>







{#if howRecommended.length > 0}


<article class="why-card">


<h3>
How this recommendation was made
</h3>



<ul>


{#each howRecommended as reason}


<li>
{reason}
</li>


{/each}


</ul>


</article>


{/if}







{#if selectedRecipe.ingredients?.length}


<article class="why-card ingredients-card">


<h3>
Ingredients
</h3>




<div class="modal-ingredient-list">


{#each selectedRecipe.ingredients as ingredient}


<span>
{ingredient}
</span>


{/each}


</div>


</article>


{/if}








<footer class="modal-footer">


<button
class="secondary-btn"
on:click={() => dispatch('adjust')}
>

Adjust Answers

</button>



<button
class="primary-btn"
on:click={() => dispatch('close')}
>

Done

</button>


</footer>





</section>



</div>


{/if}