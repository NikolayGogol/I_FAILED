<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<script setup>
  import { computed, onMounted, onUnmounted } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useMainStore } from '@/stores/main.js'
  import '@/styles/pages/index.scss'

  const mainStore = useMainStore()

  const tabs = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    { label: 'For You', value: 'for-you' },
  ]

  // The active tab is now managed by the store, but we can keep a local ref for the UI
  const activeTab = computed(() => mainStore.activeTab)

  // Posts are now directly from the store, no client-side sorting needed
  const posts = computed(() => mainStore.posts)

  function selectTab (tab) {
    // Fetch posts for the newly selected tab
    mainStore.fetchPosts({ tab: tab.value })
  }

  function handleScroll () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    // Fetch more posts when user is 100px from the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      // Fetch more posts for the current active tab
      mainStore.fetchPosts()
    }
  }

  onMounted(() => {
    // Initial fetch for the default tab
    mainStore.fetchPosts({ tab: 'latest' })
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<template>
  <div class="feed-page">
    <section class="feed-main">
      <!-- Tabs -->
      <div class="feed-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="feed-tab"
          :class="{ active: activeTab === tab.value }"
          @click="selectTab(tab)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Composer -->
      <div class="composer-card mb-6">
        <div class="write-post-btn font-weight-semibold">
          Write a post
        </div>
        <div class="composer-filter">
          <v-icon icon="mdi-filter-variant" />
        </div>
      </div>

      <!-- Posts -->
      <div v-if="mainStore.loading && posts.length === 0" class="text-center py-10">
        Loading...
      </div>
      <div v-else-if="posts.length === 0" class="text-center py-10 text-gray-500">
        No posts found.
      </div>
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
      <div v-if="mainStore.loading && posts.length > 0" class="text-center py-4">
        Loading more posts...
      </div>
      <div v-if="!mainStore.hasMore && posts.length > 0" class="text-center py-4 text-gray-500">
        You've reached the end.
      </div>
    </section>
  </div>
</template>
