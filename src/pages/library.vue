<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>
<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted } from 'vue'
  import { useLibraryStore } from '@/stores/library'
  import '@/styles/pages/library.scss'

  const libraryStore = useLibraryStore()
  const { bookmarkedPosts, loading, error } = storeToRefs(libraryStore)
  onMounted(() => {
    libraryStore.fetchBookmarkedPosts()
  })

</script>

<template>
  <div class="library-page">
    <section class="library-main">
      <div class="page-header">
        <h1>Library</h1>
        <p>Your saved posts and resources.</p>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading your saved posts...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>Error: {{ error }}</p>
      </div>

      <div v-else-if="bookmarkedPosts.length > 0" class="library-grid">
        <div v-for="bookmark in bookmarkedPosts" :key="bookmark.id" class="library-card">
          <PostCard :post="bookmark"></PostCard>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>You haven't saved any posts yet.</p>
      </div>
    </section>
  </div>
</template>
