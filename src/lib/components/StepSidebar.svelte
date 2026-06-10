<script>
  import { createEventDispatcher } from 'svelte';

  export let hotspots = [];
  export let activeHotspotId = null;
  export let completedIds = [];

  const dispatch = createEventDispatcher();

  $: visibleSteps = hotspots;
</script>

<aside class="step-sidebar">
  <div class="panel-title">Kitchen Flow</div>
  <div class="panel-subtitle">Click objects to answer</div>

  <div class="step-list">
    {#each visibleSteps as hotspot, index}
      <button
        class="step-item"
        class:active={activeHotspotId === hotspot.id}
        class:done={completedIds.includes(hotspot.id)}
        on:click={() => dispatch('select', hotspot.id)}
      >
        <span class="step-number">{index + 1}</span>
        <span class="step-text">{hotspot.label}</span>
        {#if completedIds.includes(hotspot.id)}
          <span class="step-check">✓</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="sidebar-tip">
    <span>💡</span>
    <p>Explore the kitchen to build your recipe story.</p>
  </div>
</aside>