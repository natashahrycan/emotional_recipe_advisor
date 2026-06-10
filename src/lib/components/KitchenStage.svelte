<script>
  import { createEventDispatcher } from 'svelte';
  import fullBg from '$lib/assets/kitchen/full_bg_clean.png';

  export let hotspots = [];
  export let hoverHotspotId = null;
  export let activeHotspotId = null;
  export let completedIds = [];

  const dispatch = createEventDispatcher();

  $: characterHotspot = hotspots.find((hotspot) => hotspot.id === 'profile');

  // 关键：永远只显示一个视觉高亮层
  $: visualHotspotId = hoverHotspotId || activeHotspotId;
  $: visualHotspot = hotspots.find((hotspot) => hotspot.id === visualHotspotId);

  function boxStyle(box) {
    return `
      left: ${(box.x / 1200) * 100}%;
      top: ${(box.y / 900) * 100}%;
      width: ${(box.w / 1200) * 100}%;
      height: ${(box.h / 900) * 100}%;
    `;
  }

  function isHoverVisual() {
    return hoverHotspotId && visualHotspotId === hoverHotspotId;
  }

  function isActiveVisual() {
    return !hoverHotspotId && visualHotspotId === activeHotspotId;
  }
</script>

<div class="kitchen-stage">
  <div class="scene-canvas">
    <img class="main-bg" src={fullBg} alt="Pixel kitchen background" />

    {#if characterHotspot?.asset}
      <img class="character-layer" src={characterHotspot.asset} alt="" />
    {/if}

    {#if visualHotspot?.asset}
      <div
        class="single-highlight-layer"
        class:hover-highlight={isHoverVisual()}
        class:active-highlight={isActiveVisual()}
      >
        <img class="highlight-shadow" src={visualHotspot.asset} alt="" />
        <img class="highlight-body" src={visualHotspot.asset} alt="" />
      </div>
    {/if}

    {#each hotspots as hotspot}
      <button
        class="hotspot-hitbox"
        style={boxStyle(hotspot.hitbox)}
        aria-label={hotspot.label}
        on:mouseenter={() => dispatch('hover', hotspot.id)}
        on:mouseleave={() => dispatch('hover', null)}
        on:focus={() => dispatch('hover', hotspot.id)}
        on:blur={() => dispatch('hover', null)}
        on:click={() => dispatch('select', hotspot.id)}
      >
        {#if hoverHotspotId === hotspot.id}
          <span class="hotspot-tooltip">{hotspot.label}</span>
        {/if}
      </button>
    {/each}
  </div>
</div>