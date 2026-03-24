<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

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
          <div class="library-icon">
            <v-icon color="primary">mdi-bookmark-outline</v-icon>
          </div>
          <div class="library-content">
            <h3>{{ bookmark.id || 'No title' }}</h3>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>You haven't saved any posts yet.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
  import { onMounted, computed } from 'vue'
  import { useLibraryStore } from '@/stores/library'
  import { storeToRefs } from 'pinia'
  import dayjs from 'dayjs'
  import '@/styles/pages/library.scss'

  const libraryStore = useLibraryStore()
  const { bookmarkedPosts, loading, error } = storeToRefs(libraryStore)

  onMounted(() => {
    libraryStore.fetchBookmarkedPosts()
  })

  const formatDate = (timestamp) => {
    if (timestamp?.seconds) {
      return dayjs.unix(timestamp.seconds).format('MMM D, YYYY')
    }
    return 'date not available'
  }
</script>
