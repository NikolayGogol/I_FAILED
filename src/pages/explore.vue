<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>

<script setup>
  import { computed, onBeforeMount, ref } from 'vue'
  import Filter from '@/components/feed/Filter.vue'
  import { getIcon } from '@/models/icons.js'
  import { useFilterStore } from '@/stores/main/filter.js'
  import '@/styles/pages/explore.scss'
  //
  const searchValue = ref('')
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
    filterStore.clearFilters()
  })
  function toggleFilter () {
    isFilterPanel.value = !isFilterPanel.value
  }

  function applyFilters () {
    console.log(filterStore.selectedFilter)
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
        <form-input v-model="searchValue" hide-details />
        <div class="position-absolute search-icon d-flex" v-html="getIcon('search')" />
      </div>
      <div class="submit-btn">Search</div>
      <div class="composer-filter">
        <v-badge v-if="activeFilterCount > 0" color="primary" :content="activeFilterCount" floating>
          <v-icon icon="mdi-filter-variant" @click="toggleFilter" />
        </v-badge>
        <v-icon v-else icon="mdi-filter-variant" @click="toggleFilter" />
      </div>
    </div>
    <v-slide-y-transition>
      <Filter v-if="isFilterPanel" @apply="applyFilters" @close="isFilterPanel = false" />
    </v-slide-y-transition>
  </div>
</template>
