<script setup>

</script>

<template>
  <div class="subscribe-card">
    <h3 class="subscribe-title">Subscribe to premium</h3>
    <p class="subscribe-desc">
      Get rid of ads, see advanced analytics, post anonymously and unlock 10+ features.
    </p>
    <button class="submit-btn" @click="$router.push('/premium')">Subscribe now</button>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/components/sidebars/subscribe.scss";
</style>
