<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<script setup>
  import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { categories, costRange, emotionTags, recoveryTimeOptions } from '@/models/categories.js'
  import { useMainStore } from '@/stores/main.js'
  import '@/styles/pages/index.scss'

  const mainStore = useMainStore()
  const isFilterPanel = ref(false)
  const tabs = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    { label: 'For You', value: 'for-you' },
  ]
  const selectedFilter = reactive({
    categories: [],
    emojiTags: [],
    recoveryTime: [],
    costRange: [],
    postedBy: null,
  })
  const activeTab = computed(() => mainStore.activeTab)
  const posts = computed(() => mainStore.posts)

  function selectTab (tab) {
    // Scroll to the top of the page with smooth animation
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Fetch posts for the newly selected tab
    mainStore.fetchPosts({ tab: tab.value })
  }

  function handleScroll () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (scrollHeight - scrollTop - clientHeight < 100) {
      mainStore.fetchPosts()
    }
  }

  onMounted(() => {
    mainStore.fetchPosts({ tab: 'latest' })
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  function toggleFilter () {
    isFilterPanel.value = !isFilterPanel.value
  }

  function applyFilters () {}

  function clearFilters () {
    selectedFilter.categories = []
    selectedFilter.emojiTags = []
    selectedFilter.recoveryTime = []
    selectedFilter.costRange = []
    selectedFilter.postedBy = null
  }
</script>

<template>
  <div class="feed-page">
    <section class="feed-main px-5">
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
      <div
        class="composer-card"
        :class="[
          {'mb-6': !isFilterPanel},
          {'card-open': isFilterPanel},
        ]"
      >
        <div class="write-post-btn font-weight-semibold" @click="$router.push('/create-post')">
          New failure
        </div>
        <div class="composer-filter">
          <v-icon icon="mdi-filter-variant" @click="toggleFilter" />
        </div>
      </div>
      <div v-if="isFilterPanel" class="filter-panel">
        <h5>Category</h5>
        <v-chip-group v-model="selectedFilter.categories" multiple>
          <v-chip
            v-for="item in categories"
            :key="item.id"
            color="primary"
            :text="item.label"
            :value="item"
          />
        </v-chip-group>
        <h5 class="mt-6">Emotion Tags</h5>
        <v-chip-group v-model="selectedFilter.emojiTags" multiple>
          <v-chip
            v-for="item in emotionTags"
            :key="item.value"
            color="primary"
            :text="item.label"
            :value="item"
          />
        </v-chip-group>
        <h5 class="mt-6">Recovery time</h5>
        <v-chip-group v-model="selectedFilter.recoveryTime" multiple>
          <v-chip
            v-for="item in recoveryTimeOptions"
            :key="item.value"
            color="primary"
            :text="item.title"
            :value="item"
          />
        </v-chip-group>
        <h5 class="mt-6">Cost Range</h5>
        <v-chip-group v-model="selectedFilter.costRange" multiple>
          <v-chip
            v-for="item in costRange"
            :key="item.value"
            color="primary"
            :text="item.label"
            :value="item"
          />
        </v-chip-group>
        <div class="d-flex align-center mt-6">
          <div class="submit-btn" @click="applyFilters">Apply</div>
          <div class="clear" @click="clearFilters">Clear all filters</div>
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
        :class="{'mt-6': isFilterPanel}"
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
