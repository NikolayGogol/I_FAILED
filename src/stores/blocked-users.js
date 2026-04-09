import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useUserStore } from '@/stores/user.js'

export const useBlockedUsersStore = defineStore('blockedUsers', {
  state: () => ({}),
  actions: {
    async getBlockedUsers () {
      const auth = useAuthStore()
      const userStore = useUserStore()

      if (!auth.user || !auth.user.uid) {
        console.warn('User not authenticated.')
        this.loading = false
        return
      }

      // We need the full user object to get the blockedUsers list
      const currentUserInfo = await userStore.getUserById(auth.user.uid)

      if (!currentUserInfo || !currentUserInfo.blockedUsers || currentUserInfo.blockedUsers.length === 0) {
        console.warn('No blocked users found.')
        this.loading = false
        return
      }

      try {
        const userPromises = currentUserInfo.blockedUsers.map(userId =>
          userStore.getUserById(userId),
        )
        const users = await Promise.all(userPromises)

        // Filter out any null results (e.g., user deleted)
        return users.filter(user => user !== null)
      } catch (error) {
        console.error('Error fetching blocked users:', error)
        this.users = []
      } finally {
        this.loading = false
      }
    },
  },
})
