<script>
  import { createEventDispatcher } from 'svelte';

  export let recipe = null;
  export let profileTags = [];

  const dispatch = createEventDispatcher();

  $: selectedRecipe = recipe?.selected_recipe;
  $: nutrition = selectedRecipe?.nutrition || {};
  $: matchReasons = recipe?.match_reasons || [];
  $: humanStory = recipe?.human_story || '';
  $: llmStory = recipe?.llm_story || '';
</script>

{#if recipe && selectedRecipe}
  <div class="modal-backdrop" on:click={() => dispatch('close')}>
    <section class="story-modal" on:click|stopPropagation>
      <header class="modal-header">
        <div>
          <p class="eyebrow">Recipe Data Storytelling</p>
          <h2>{selectedRecipe.name}</h2>
          <p>{selectedRecipe.description}</p>
        </div>

        <button class="close-btn" on:click={() => dispatch('close')}>×</button>
      </header>

      <div class="modal-profile">
        {#each profileTags as tag}
          <span>{tag}</span>
        {/each}
      </div>

      <div class="story-columns">
        <article class="story-card">
          <h3>Human-written Story</h3>
          <p>{humanStory || 'No human-written story returned yet.'}</p>
        </article>

        <article class="story-card">
          <h3>LLM-generated Story</h3>
          <p>{llmStory || 'No LLM-generated story returned yet.'}</p>
        </article>
      </div>

      <div class="result-bottom">
        <article class="why-card">
          <h3>Why this recipe was selected</h3>

          {#if matchReasons.length > 0}
            <ul>
              {#each matchReasons as reason}
                <li>{reason}</li>
              {/each}
            </ul>
          {:else}
            <p>No match reasons returned yet.</p>
          {/if}
        </article>

        <article class="metrics-card">
          <h3>Nutrition Snapshot</h3>

          <div class="metric-grid">
            <div>
              <span>Calories</span>
              <strong>{nutrition.calories ?? '—'}</strong>
            </div>

            <div>
              <span>Protein</span>
              <strong>{nutrition.protein_pdv ?? '—'}% DV</strong>
            </div>

            <div>
              <span>Fat</span>
              <strong>{nutrition.fat_pdv ?? '—'}% DV</strong>
            </div>

            <div>
              <span>Sugar</span>
              <strong>{nutrition.sugar_pdv ?? '—'}% DV</strong>
            </div>

            <div>
              <span>Sodium</span>
              <strong>{nutrition.sodium_pdv ?? '—'}% DV</strong>
            </div>

            <div>
              <span>Saturated Fat</span>
              <strong>{nutrition.saturated_fat_pdv ?? '—'}% DV</strong>
            </div>

            <div>
              <span>Carbs</span>
              <strong>{nutrition.carbohydrates_pdv ?? '—'}% DV</strong>
            </div>

            <div>
              <span>Time</span>
              <strong>{selectedRecipe.minutes ?? '—'} min</strong>
            </div>
          </div>
        </article>
      </div>

      {#if selectedRecipe.ingredients?.length}
        <article class="why-card ingredients-card">
          <h3>Ingredients</h3>

          <div class="modal-ingredient-list">
            {#each selectedRecipe.ingredients as ingredient}
              <span>{ingredient}</span>
            {/each}
          </div>
        </article>
      {/if}

      <footer class="modal-footer">
        <button class="secondary-btn" on:click={() => dispatch('adjust')}>
          Adjust Answers
        </button>

        <button class="primary-btn" on:click={() => dispatch('close')}>
          Done
        </button>
      </footer>
    </section>
  </div>
{/if}