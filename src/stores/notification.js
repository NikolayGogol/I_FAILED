import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const NOTIFICATIONS_COLLECTION = import.meta.env.VITE_NOTIFICATION_COLLECTION

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    followers: [],
    likes: [],
    mentions: [],
    notifications: [],
    loading: false,
    currentPage: 1,
    itemsPerPage: 10,
  }),
  getters: {
    paginatedNotifications (state) {
      const start = (state.currentPage - 1) * state.itemsPerPage
      const end = start + state.itemsPerPage
      return state.notifications.slice(start, end)
    },
    totalPages (state) {
      return Math.ceil(state.notifications.length / state.itemsPerPage)
    },
  },
  actions: {
    async fetchNotifications () {
      this.loading = true
      const authStore = useAuthStore()
      if (!authStore.user?.uid) {
        this.loading = false
        return
      }

      const uid = authStore.user.uid
      const subcollections = ['followers', 'likes', 'mentions']
      const allNotifications = []

      try {
        for (const sub of subcollections) {
          const subcollectionRef = collection(db, NOTIFICATIONS_COLLECTION, uid, sub)
          // Assuming notifications should be ordered by creation time
          const q = query(subcollectionRef, orderBy('createdAt', 'desc'))
          const snapshot = await getDocs(q)
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: sub.slice(0, -1) }))

          this[sub] = items
          allNotifications.push(...items)
        }

        this.notifications = allNotifications.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        this.loading = false
      }
    },
    setCurrentPage (page) {
      this.currentPage = page
    },
  },
})
