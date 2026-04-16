import { defineStore } from 'pinia'
import api from '@/axios.js'

export const useResultsStore = defineStore('results', {
  state: () => ({
    posts: [],
    users: [],
    isLoading: false,
  }),
  actions: {
    async searchAction (payload) {
      this.isLoading = true
      try {
        const { data } = await api.post('/explore/search', payload)
        this.posts = data.posts
        this.users = data.users
        return data
      } finally {
        this.isLoading = false
      }
    },
  },
})
