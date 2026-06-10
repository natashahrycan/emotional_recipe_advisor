<script>
  export let profileTags = [];
  export let signals = [];
</script>

<aside class="profile-panel">
  <div class="panel-title">Current Profile</div>
  <div class="panel-subtitle">Updated from your choices</div>

  {#if profileTags.length > 0}
    <div class="profile-tags">
      {#each profileTags as tag}
        <span class="profile-chip">{tag}</span>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      No answers yet. Click kitchen items to start.
    </div>
  {/if}

  <div class="divider"></div>

  <div class="signal-title">Recommendation Signals</div>

  {#if signals.length > 0}
    <ul class="signals">
      {#each signals as signal}
        <li>{signal}</li>
      {/each}
    </ul>
  {:else}
    <div class="empty-state small">
      Signals will appear after you select answers.
    </div>
  {/if}

  <div class="profile-note">
    We will use these text inputs to match a recipe and build the story.
  </div>
</aside>