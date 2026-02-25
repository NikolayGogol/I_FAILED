<route lang="json">
{
"meta": {
"layout": "MainLayout"
}
}
</route>
<script setup>
  import { computed, ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useMainStore } from '@/stores/main.js'
  import { useAuthStore } from '@/stores/auth.js'
  import '@/styles/pages/index.scss'
  const { getFeeds } = useMainStore()
  const authStore = useAuthStore()
  const activeTab = ref(1)
  const posts = ref([])
  const tabs = [
    {
      label: 'Lastest',
      value: 1,
    },
    {
      label: 'Popular',
      value: 2,
    },
    {
      label: 'For You',
      value: 3,
    },
  ]

  const sortedPosts = computed(() => {
    if (activeTab.value === 2) {
      return [...posts.value].toSorted((a, b) => b.views - a.views)
    }
    if (activeTab.value === 3) {
      const following = authStore.user?.following || []
      const followingPosts = posts.value.filter(post => following.includes(post.user.uid))
      const otherPosts = posts.value.filter(post => !following.includes(post.user.uid))
      otherPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      return [...followingPosts, ...otherPosts]
    }
    return posts.value
  })

  getFeeds()
    .then(res => {
      posts.value = res
    })
  function selectTab (tab) {
    activeTab.value = tab.value
  }
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
        <div
          class="write-post-btn font-weight-semibold"
        >
          Write a post
        </div>
        <div class="composer-filter">
          <v-icon icon="mdi-filter-variant" />
        </div>
      </div>

      <!-- Posts -->
      <PostCard
        v-for="post in sortedPosts"
        :key="post.id"
        :post="post"
      />
    </section>
  </div>
</template>
