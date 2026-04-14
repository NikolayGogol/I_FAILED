import { defineStore } from 'pinia'
import api from '@/axios.js'
export const useTrendingStore = defineStore('trending', {
  state: () => ({}),
  actions: {
    async fetchPost (filters) {
      console.log(filters)
      api.post('/explore/trending', filters)
    },
  },
})
