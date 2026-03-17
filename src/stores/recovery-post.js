import { defineStore } from 'pinia'

export const useRecoveryPostStore = defineStore('recovery-post', {
  state: () => ({}),
  actions: {
    recoveryPost (payload) {
      console.log(payload)
    },
  },
  persist: false,
})
