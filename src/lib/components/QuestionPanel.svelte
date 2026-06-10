<script>
  import { createEventDispatcher } from 'svelte';
  import { getOptionLabel } from '$lib/data/questions.js';

  export let activeHotspot = null;
  export let answers = {};
  export let canGenerate = false;
  export let missingLabels = [];
  export let isGenerating = false;
  export let generateError = null;

  const dispatch = createEventDispatcher();

  function currentValue() {
    if (!activeHotspot?.answerKey) return null;
    return answers[activeHotspot.answerKey];
  }

  function isSelected(option) {
    const value = currentValue();

    if (activeHotspot.type === 'multi') {
      return Array.isArray(value) && value.includes(option.value);
    }

    return value === option.value;
  }

  function choose(option) {
    if (!activeHotspot?.answerKey) return;

    const key = activeHotspot.answerKey;

    if (activeHotspot.type === 'multi') {
      const oldValue = Array.isArray(answers[key]) ? answers[key] : [];
      let nextValue;

      if (option.value === 'no-allergy' || option.value === 'not-sure') {
        nextValue = [option.value];
      } else {
        const exclusiveValues = ['no-allergy', 'not-sure'];
        const cleanedOldValue = oldValue.filter((item) => !exclusiveValues.includes(item));

        if (cleanedOldValue.includes(option.value)) {
          nextValue = cleanedOldValue.filter((item) => item !== option.value);
        } else {
          nextValue = [...cleanedOldValue, option.value];
        }
      }

      dispatch('answer', { key, value: nextValue });
      return;
    }

    dispatch('answer', { key, value: option.value });
  }

  function answerSummary() {
    const rows = [
      ['User', answers.userType],
      ['Dish', answers.dishType],
      ['Format', answers.format],
      ['Goal', answers.nutritionGoal],
      ['Time', answers.cookingTime],
      ['Effort', answers.effort],
      ['Ingredients', answers.ingredients],
      ['Avoid', answers.allergies]
    ];

    return rows
      .filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
      })
      .map(([label, value]) => {
        if (Array.isArray(value)) {
          return [label, value.map((item) => getOptionLabel(labelToAnswerKey(label), item)).join(', ')];
        }

        return [label, getOptionLabel(labelToAnswerKey(label), value)];
      });
  }

  function labelToAnswerKey(label) {
    const map = {
      User: 'userType',
      Dish: 'dishType',
      Format: 'format',
      Goal: 'nutritionGoal',
      Time: 'cookingTime',
      Effort: 'effort',
      Ingredients: 'ingredients',
      Avoid: 'allergies'
    };

    return map[label];
  }
</script>

<section class="question-panel">
  {#if !activeHotspot}
    <div class="question-avatar">🍳</div>

    <div class="question-copy">
      <h2>Click an item in the kitchen.</h2>
      <p>Each object opens one question for the recipe recommendation flow.</p>
    </div>
  {:else if activeHotspot.type === 'review'}
    <div class="question-avatar">📖</div>

    <div class="question-copy review-copy">
      <h2>{activeHotspot.question}</h2>
      <p>{activeHotspot.helper}</p>

      <div class="review-grid">
        {#each answerSummary() as row}
          <div class="review-row">
            <strong>{row[0]}</strong>
            <span>{row[1]}</span>
          </div>
        {/each}
      </div>

      {#if !canGenerate}
        <div class="missing-warning">
          Still missing: {missingLabels.join(', ')}
        </div>
      {/if}

      {#if generateError}
        <div class="missing-warning">
          {generateError}
        </div>
      {/if}
    </div>

    <div class="question-actions">
      <button
        class="secondary-btn"
        disabled={isGenerating}
        on:click={() => dispatch('back')}
      >
        Back
      </button>

      <button
        class="primary-btn"
        disabled={!canGenerate || isGenerating}
        on:click={() => dispatch('generate')}
      >
        {isGenerating ? 'Generating...' : 'Generate Story'}
      </button>
    </div>
  {:else}
    <div class="question-avatar">👩‍🍳</div>

    <div class="question-copy">
      <h2>{activeHotspot.question}</h2>
      <p>{activeHotspot.helper}</p>
    </div>

    <div class="option-row">
      {#each activeHotspot.options as option}
        <button
          class="answer-option"
          class:selected={isSelected(option)}
          on:click={() => choose(option)}
        >
          <span>{option.label}</span>
          {#if isSelected(option)}
            <b>✓</b>
          {/if}
        </button>
      {/each}
    </div>

    <div class="question-actions">
      <button class="secondary-btn" on:click={() => dispatch('back')}>Back</button>
      <button class="primary-btn" on:click={() => dispatch('next')}>Continue</button>
    </div>
  {/if}
</section>