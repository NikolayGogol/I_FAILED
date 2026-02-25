import { defineStore } from 'pinia'
import { collection, getDocs, limit, query } from 'firebase/firestore'
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
        const usersRef = collection(db, 'users')
        const q = query(usersRef, limit(15)) // Get up to 15 users
        const querySnapshot = await getDocs(q)
        this.users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        this.error = 'Failed to fetch users.'
        console.error('Error fetching users:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
