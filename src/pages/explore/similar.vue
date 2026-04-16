<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { computed } from 'vue'
  import { useMainStore } from '@/stores/main/main.js'
  const mainStore = useMainStore()
  const totalPosts = computed(() => mainStore.totalPosts)

</script>

<template>
  <div class="d-flex align-center d-sm-block">
    <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
    <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Similar posts</h1>
  </div>
  <p class="text-description">{{ totalPosts }} posts</p>
  <ForYouTab />
</template>

<style scoped lang="scss">

</style>
