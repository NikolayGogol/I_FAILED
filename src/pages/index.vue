<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted, onUnmounted, reactive, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import PostCard from '@/components/feed/PostCard.vue'
  import { categories, costRange, emotionTags, recoveryTimeOptions } from '@/models/categories.js'
  import { useMainStore } from '@/stores/main.js'
  import { generateRandomPost } from '@/utils/post-generator.js'
  import '@/styles/pages/index.scss'

  const mainStore = useMainStore()
  const { filteredPosts: posts, loading, hasMore, activeTab } = storeToRefs(mainStore)
  const toast = useToast()

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

  function selectTab (tab) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    mainStore.fetchPosts({ tab: tab.value, refresh: true })
  }

  function handleScroll () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (scrollHeight - scrollTop - clientHeight < 100) {
      mainStore.fetchPosts({})
    }
  }

  onMounted(() => {
    // Clear any persistent filters from previous sessions on mount
    mainStore.currentFilters = null
    mainStore.fetchPosts({ tab: 'latest', refresh: true })
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  function toggleFilter () {
    isFilterPanel.value = !isFilterPanel.value
  }

  function applyFilters () {
    mainStore.applyPostFilters(selectedFilter)
    isFilterPanel.value = false
  }

  function clearFilters () {
    selectedFilter.categories = []
    selectedFilter.emojiTags = []
    selectedFilter.recoveryTime = []
    selectedFilter.costRange = []
    selectedFilter.postedBy = null
    mainStore.applyPostFilters(selectedFilter)
  }

  async function handleGeneratePost () {
    try {
      await generateRandomPost()
      toast.success('Random post generated successfully!')
      mainStore.fetchPosts({ tab: activeTab.value, refresh: true })
    } catch {
      toast.error('Failed to generate random post.')
    }
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
        <div class="d-flex">
          <div class="font-weight-semibold cancel-btn" @click="$router.push('/create-post')">
            New failure
          </div>
          <div class="cancel-btn font-weight-semibold ml-2" @click="handleGeneratePost">
            Generate Post
          </div>
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
        <div class="d-flex align-center mt-6">
          <div class="submit-btn" @click="applyFilters">Apply</div>
          <div class="clear" @click="clearFilters">Clear all filters</div>
        </div>
      </div>
      <!-- Posts -->
      <div v-if="loading && posts.length === 0" class="text-center py-10">
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
      <div v-if="loading && posts.length > 0" class="text-center py-4">
        Loading more posts...
      </div>
      <div v-if="!hasMore && posts.length > 0" class="text-center py-4 text-gray-500">
        You've reached the end.
      </div>
    </section>
  </div>
</template>
