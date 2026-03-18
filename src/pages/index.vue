<route lang="json">
{
"meta": {
"layout": "MainLayout"
}
}
</route>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useDisplay } from 'vuetify'
  import Filter from '@/components/feed/Filter.vue'
  import PostCard from '@/components/feed/PostCard.vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useMainStore } from '@/stores/main.js'
  import { generateRandomPost } from '@/utils/post-generator.js'
  import '@/styles/pages/index.scss'
  const { smAndUp } = useDisplay()
  //
  const mainStore = useMainStore()
  const authStore = useAuthStore()
  const { filteredPosts: posts, loading, hasMore, activeTab } = storeToRefs(mainStore)
  const toast = useToast()
  const isFilterPanel = ref(false)
  const tabs = reactive([
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
  ])
  if (authStore.user) {
    tabs.push({ label: 'For You', value: 'for-you' })
  }

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

  async function handleGeneratePost () {
    try {
      await generateRandomPost()
      toast.success('Random post generated successfully!')
      await mainStore.fetchPosts({ tab: activeTab.value, refresh: true })
    } catch {
      toast.error('Failed to generate random post.')
    }
  }

  const isDevMode = computed(() => {
    return location.hostname === 'localhost'
  })
</script>

<template>
  <div class="feed-page mt-4 mt-md-0">
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
          {'mb-2 sm-mb-6': !isFilterPanel},
          {'card-open': smAndUp && isFilterPanel},
        ]"
      >
        <div class="d-flex">
          <div class="font-weight-semibold cancel-btn" @click="$router.push('/create-post')">
            New failure
          </div>
          <div v-if="isDevMode" class="cancel-btn font-weight-semibold ml-2 d-none d-md-block" @click="handleGeneratePost">
            Generate Post
          </div>
        </div>
        <div class="composer-filter">
          <v-icon icon="mdi-filter-variant" @click="toggleFilter" />
        </div>
      </div>
      <template v-if="isFilterPanel && smAndUp">
        <Filter />
      </template>
      <template v-if="!smAndUp">
        <MobileSlide v-model="isFilterPanel">
          <Filter title="Filter" />
        </MobileSlide>
      </template>
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
        :class="{'mt-2 sm-mt-6': isFilterPanel}"
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
