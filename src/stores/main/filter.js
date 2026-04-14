import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useMainStore } from '@/stores/main/main.js'

export const useFilterStore = defineStore('filter', () => {
  const mainStore = useMainStore()

  const selectedFilter = reactive({
    categories: [],
    emojiTags: [],
    recoveryTime: [],
    costRange: [],
    postedBy: null,
  })

  async function applyFilters (refreshFeed = true) {
    try {
      const params = {
        // Keep category objects (id + label) so both:
        // 1) client filtering can match reliably
        // 2) we can build Firestore queries with the same shape
        categories: selectedFilter.categories.map(c => ({ id: c.id, label: c.label })),
        emojiTags: selectedFilter.emojiTags.map(t => t.value),
        recoveryTime: selectedFilter.recoveryTime.map(t => t.value),
        costRange: selectedFilter.costRange.map(c => c.value),
        // `postedBy` is stored as string values like 'anonymous' / 'public'
        // (but we still support an object shape as a fallback).
        postedBy: selectedFilter.postedBy?.value ?? selectedFilter.postedBy,
      }
      if (refreshFeed) {
        await mainStore.applyPostFilters(params)
      }
      return mainStore.filteredPosts.length > 0
    } catch (error) {
      console.error('Error applying filters:', error)
      return false
    }
  }

  function clearFilters (refreshFeed = true) {
    selectedFilter.categories = []
    selectedFilter.emojiTags = []
    selectedFilter.recoveryTime = []
    selectedFilter.costRange = []
    selectedFilter.postedBy = null
    if (refreshFeed) {
      mainStore.applyPostFilters(null)
    }
  }

  return {
    selectedFilter,
    applyFilters,
    clearFilters,
  }
})
