<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>
<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted, onUnmounted, ref } from 'vue'
  import { useLibraryStore } from '@/stores/library'
  import '@/styles/pages/library.scss'

  const libraryStore = useLibraryStore()
  const { bookmarkedPosts, loading, error, hasMore, loadingMore } = storeToRefs(libraryStore)
  const observerTarget = ref(null)
  let observer

  onMounted(async () => {
    // Fetch initial set of post IDs
    await libraryStore.fetchBookmarkedPostIds()
    // Load the first page of bookmarks if IDs were found
    if (libraryStore.hasMore) {
      await libraryStore.loadMoreBookmarks()
    }

    // Set up the Intersection Observer
    observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
          libraryStore.loadMoreBookmarks()
        }
      },
      {
        rootMargin: '200px', // Load more when the user is 200px away from the bottom
      },
    )

    if (observerTarget.value) {
      observer.observe(observerTarget.value)
    }
  })

  onUnmounted(() => {
    // Clean up the observer
    if (observer && observerTarget.value) {
      observer.unobserve(observerTarget.value)
    }
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
          <PostCard :post="bookmark" />
        </div>
      </div>

      <div v-else class="empty-state">
        <p>You haven't saved any posts yet.</p>
      </div>

      <!-- Observer Target -->
      <div ref="observerTarget" class="observer-target" />

      <!-- Loading indicator for lazy loading -->
      <div v-if="loadingMore" class="loading-more">
        <p>Loading more posts...</p>
      </div>
    </section>
  </div>
</template>
