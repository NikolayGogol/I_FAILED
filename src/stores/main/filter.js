import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useMainStore } from '@/stores/main/main.js'
import api from '@/axios.js'

export const useFilterStore = defineStore('filter', () => {
  const mainStore = useMainStore()

  const selectedFilter = reactive({
    categories: [],
    emojiTags: [],
    recoveryTime: [],
    costRange: [],
    postedBy: null,
  })

  async function applyFilters () {
    try {
      const params = {
        categories: selectedFilter.categories.map(c => c.id),
        emojiTags: selectedFilter.emojiTags.map(t => t.value),
        recoveryTime: selectedFilter.recoveryTime.map(t => t.value),
        costRange: selectedFilter.costRange.map(c => c.value),
        postedBy: selectedFilter.postedBy,
      }
      const response = await api.get('/posts', { params })
      mainStore.posts = response.data
    } catch (error) {
      console.error('Error applying filters:', error)
    }
  }

  function clearFilters () {
    selectedFilter.categories = []
    selectedFilter.emojiTags = []
    selectedFilter.recoveryTime = []
    selectedFilter.costRange = []
    selectedFilter.postedBy = null
    mainStore.posts = []
  }

  return {
    selectedFilter,
    applyFilters,
    clearFilters,
  }
})
