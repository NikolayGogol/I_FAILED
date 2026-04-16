<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { computed, markRaw, onBeforeMount, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import Discover from '@/components/explore/tabs/Discover.vue'
  import Result from '@/components/explore/tabs/Result.vue'
  import Trending from '@/components/explore/tabs/Trending.vue'
  import Filter from '@/components/feed/Filter.vue'
  import { getIcon } from '@/models/icons.js'
  import { useResultsStore } from '@/stores/explore/results.js'
  import { useFilterStore } from '@/stores/main/filter.js'
  import '@/styles/pages/explore.scss'
  const tabs = reactive([
    { label: '🔥 Trending', value: 'trending', component: markRaw(Trending) },
    { label: '✨ Discover', value: 'discover', component: markRaw(Discover) },
  ])
  const activeTab = ref('trending')
  //
  const searchValue = ref('')
  const router = useRouter()
  const route = useRoute()
  const resultStore = useResultsStore()
  const activeFilterCount = computed(() => {
    const filters = filterStore.selectedFilter
    if (!filters) return 0
    let count = 0
    if (filters.categories?.length) count += filters.categories.length
    if (filters.emojiTags?.length) count += filters.emojiTags.length
    if (filters.recoveryTime?.length) count += filters.recoveryTime.length
    if (filters.costRange?.length) count += filters.costRange.length
    if (filters.postedBy) count += 1
    return count
  })
  const isFilterPanel = ref(false)
  const filterStore = useFilterStore()
  //
  onBeforeMount(() => {
    filterStore.clearFilters(false)
  })
  function toggleFilter () {
    isFilterPanel.value = !isFilterPanel.value
  }
  onMounted(() => {
    if (route.query) {
      searchValue.value = route.query.searchValue
      applyFilters()
    }
  })

  function applyFilters () {
    const obj = tabs.find(el => el.value === 'result')
    if (!obj) {
      tabs.push({ label: '🔍 Result', value: 'result', component: markRaw(Result) })
    }
    router.push({
      path: '/explore',
      query: {
        searchValue: searchValue.value,
      },
    })
    resultStore.searchAction({
      ...filterStore.selectedFilter,
      searchText: searchValue.value,
    })
    activeTab.value = 'result'
  }
  function selectTab (tab) {
    activeTab.value = tab.value
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

<template>
  <div class="explore-page">
    <h1 class="font-weight-bold text-grey-darken-3 ml-3 ml-sm-0 title">Explore</h1>
    <div
      class="d-flex w-100 align-center justify-space-between mt-6 search-wrapper"
      :class="[
        {'mb-2 sm-mb-6': !isFilterPanel},
        {'card-open':isFilterPanel}
      ]"
    >
      <div class="search-panel w-75 position-relative">
        <form-input v-model="searchValue" hide-details @keyup.enter="applyFilters" />
        <div class="position-absolute search-icon d-flex" v-html="getIcon('search')" />
      </div>
      <div class="submit-btn" @click="applyFilters">Search</div>
      <div class="composer-filter">
        <v-badge v-if="activeFilterCount > 0" color="primary" :content="activeFilterCount" floating>
          <v-icon icon="mdi-filter-variant" @click="toggleFilter" />
        </v-badge>
        <v-icon v-else icon="mdi-filter-variant" @click="toggleFilter" />
      </div>
    </div>
    <v-slide-y-transition>
      <Filter
        v-if="isFilterPanel"
        :refresh-feed="false"
        @apply="applyFilters"
        @close="isFilterPanel = false"
      />
    </v-slide-y-transition>
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
    <component :is="tabs.find(t => t.value === activeTab).component" class="mt-4" />
  </div>
</template>
