<script>
  import { createEventDispatcher } from 'svelte';

  export let recipe = null;
  export let profileTags = [];

  const dispatch = createEventDispatcher();

  $: selectedRecipe = recipe?.selected_recipe || null;
  $: nutrition = selectedRecipe?.nutrition || {};
  $: matchReasons = recipe?.match_reasons || [];
  $: howRecommended = recipe?.how_recommended || [];
  $: timeline = recipe?.timeline || [];
  $: templateStoryText = recipe?.template_story || '';
  $: llmStoryText = recipe?.llm_story || '';
  $: storySource = recipe?.story_source || '';

  $: hasTemplateStory = Boolean(templateStoryText) || timeline.length > 0;
  $: hasFallbackSummary = selectedRecipe?.description || selectedRecipe?.tagline || matchReasons.length > 0;
</script>

{#if recipe && selectedRecipe}
  <div class="modal-backdrop" on:click={() => dispatch('close')}>
    <section class="story-modal" on:click|stopPropagation>
      <header class="modal-header">
        <div>
          <p class="eyebrow">Recipe Data Storytelling</p>
          <h2>{selectedRecipe.name}</h2>
          <p>{selectedRecipe.tagline || selectedRecipe.description}</p>
        </div>

        <button class="close-btn" on:click={() => dispatch('close')}>×</button>
      </header>

      <div class="modal-profile">
        {#each profileTags as tag}
          <span>{tag}</span>
        {/each}

        {#if storySource}
          <span>Story source: {storySource}</span>
        {/if}
      </div>

      <div class="story-columns">
        <article class="story-card">
          <h3>Recommendation Summary</h3>

          {#if templateStoryText}
            <p>{templateStoryText}</p>
          {:else if timeline.length > 0}
            <div class="timeline-list">
              {#each timeline as item}
                <div class="timeline-item">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              {/each}
            </div>
          {:else if hasFallbackSummary}
            {#if selectedRecipe.description}
              <p>{selectedRecipe.description}</p>
            {/if}

            {#if matchReasons.length > 0}
              <ul>
                {#each matchReasons as reason}
                  <li>{reason}</li>
                {/each}
              </ul>
            {/if}
          {:else}
            <p>No recommendation summary returned yet.</p>
          {/if}
        </article>

        <article class="story-card">
          <h3>LLM-generated Story</h3>

          {#if llmStoryText}
            <p>{llmStoryText}</p>
          {:else}
            <p class="placeholder-text">
              Waiting for the LLM story output. Once the LLM module is connected,
              this section will display the generated narrative for the selected recipe.
            </p>
          {/if}
        </article>
      </div>

      <div class="result-bottom">
        <article class="why-card">
          <h3>Why this recipe fits</h3>

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

            <div>
              <span>Steps</span>
              <strong>{selectedRecipe.n_steps ?? selectedRecipe.steps?.length ?? '—'}</strong>
            </div>

            <div>
              <span>Difficulty</span>
              <strong>{nutrition.difficulty || '—'}</strong>
            </div>
          </div>
        </article>
      </div>

      {#if howRecommended.length > 0}
        <article class="why-card explanation-card">
          <h3>How this recommendation was made</h3>
          <ul>
            {#each howRecommended as reason}
              <li>{reason}</li>
            {/each}
          </ul>
        </article>
      {/if}

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

      {#if selectedRecipe.steps?.length}
        <article class="why-card steps-card">
          <h3>Cooking Steps</h3>

          <ol>
            {#each selectedRecipe.steps as step}
              <li>{step}</li>
            {/each}
          </ol>
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