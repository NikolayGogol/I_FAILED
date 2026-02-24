import { collection, getDocs } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'

export const useWhoToFollowStore = defineStore('whoToFollow', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAllUsers () {
      if (this.users.length > 0) {
        return
      }

      this.loading = true
      this.error = null
      try {
        const querySnapshot = await getDocs(collection(db, 'users'))
        this.users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      } catch (error) {
        this.error = 'Failed to fetch users.'
        console.error('Error fetching users:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
