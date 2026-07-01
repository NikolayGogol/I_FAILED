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
  <div class="d-flex align-center d-sm-block px-4 mt-4 mt-sm-0">
    <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
    <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Similar posts</h1>
  </div>
  <p class="text-description px-4">{{ totalPosts }} posts</p>
  <div class="px-4">
    <ForYouTab />
  </div>
</template>

<style scoped lang="scss">
@include media-down($breakpoint-sm) {
  h1 {
    font-weight: 600 !important;
    font-size: 20px;
  }
}
</style>
