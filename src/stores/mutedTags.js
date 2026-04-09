import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useUserStore } from '@/stores/user.js'

export const useMutedTagsStore = defineStore('mutedTags', {
  state: () => ({}),

  actions: {
    async getMutedTags () {
      const auth = useAuthStore()
      const userStore = useUserStore()

      if (!auth.user || !auth.user.uid) {
        console.warn('User not authenticated.')
        this.loading = false
        return
      }
      const currentUserInfo = await userStore.getUserById(auth.user.uid)
      return currentUserInfo.notInterestedTags
    },
  },
})
