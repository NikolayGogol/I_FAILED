import { defineStore } from 'pinia'
import api from '@/axios.js'

export const useResultsStore = defineStore('results', {
  state: () => ({}),
  actions: {
    async searchAction (payload) {
      api.post('/explore/search', payload)
        .then(res => {
          console.log(res);
        })
    },
  },
})
