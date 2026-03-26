<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>
<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useLibraryStore } from '@/stores/library.js'
  //
  const libraryStore = useLibraryStore()
  const route = useRoute()
  const postList = ref([])
  const isLoading = ref(false)
  //
  onMounted(() => {
    isLoading.value = true
    libraryStore.getPostFromCollection(route.params.id)
      .then(res => {
        postList.value = res
      })
      .finally(() => {
        isLoading.value = false
      })
  })
</script>

<template>
  <div class="library-page">
    <div class="page-header">
      <v-icon class="cursor-pointer" icon="mdi-arrow-left" @click="$router.go(-1)" />
      <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0">Startup Lessons</h1>
    </div>
    <div class="d-flex my-5">
      <p class="text-description">{{ postList.length }} posts</p>
    </div>
    <p v-if="isLoading" class="text-center">Loading ....</p>
    <template v-else>
      <div v-if="postList.length > 0" class="mt-4">
        <post-card v-for="post in postList" :key="post.id" :post="post" />
      </div>
      <div v-else>Collection is empty</div>
    </template>
  </div>
</template>
