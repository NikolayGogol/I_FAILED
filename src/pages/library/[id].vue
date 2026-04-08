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
  import { getIcon } from '@/models/icons.js'
  import { useLibraryStore } from '@/stores/library.js'
  //
  const libraryStore = useLibraryStore()
  const route = useRoute()
  const postList = ref([])
  const isLoading = ref(false)
  const isModalVisible = ref(false)
  const postToDelete = ref(null)
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

  function openConfirmationModal (post) {
    postToDelete.value = post
    isModalVisible.value = true
  }

  function cancelDelete () {
    postToDelete.value = null
    isModalVisible.value = false
  }

  function confirmDelete () {
    if (postToDelete.value) {
      libraryStore.removePostFromCollection(route.params.id, postToDelete.value.id, {
        counter: postList.value.length - 1,
      })
        .then(() => {
          postList.value = postList.value.filter(p => p.id !== postToDelete.value.id)
          cancelDelete()
        })
        .catch(error => {
          console.error('Failed to delete post:', error)
          cancelDelete()
        })
    }
  }
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
        <post-card v-for="post in postList.reverse()" :key="post.id" :post="post">
          <template #recovered-content>
            <div class="d-flex" @click="openConfirmationModal(post)" v-html="getIcon('trash')" />
          </template>
        </post-card>
      </div>
      <div v-else>Collection is empty</div>
    </template>
    <v-dialog v-model="isModalVisible" max-width="400">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="headline text-center">Confirm Deletion</v-card-title>
        <v-card-text class="text-center text-description">Are you sure you want to remove this post from the collection?</v-card-text>
        <div class="d-flex justify-center">
          <div class="cancel-btn mr-2" @click="cancelDelete">Cancel</div>
          <div class="submit-btn" @click="confirmDelete">
            <v-progress-circular
              v-if="isLoading"
              class="mr-2"
              indeterminate
              size="20"
              width="2"
            />
            <span v-else>Delete</span>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
