import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore'
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
    async getDataByTab (tab) {
      this.loading = true
      const authStore = useAuthStore()
      if (!authStore.user?.uid) {
        this.loading = false
        return
      }
      const uid = authStore.user.uid

      const subcollectionRef = collection(db, NOTIFICATIONS_COLLECTION, uid, tab.path)
      const q = query(subcollectionRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      this.notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: tab.path.slice(0, -1) }))
      this.loading = false
    },
    async toggleMarkAsRead (notification) {
      const authStore = useAuthStore()
      if (!authStore.user?.uid) {
        return
      }

      const uid = authStore.user.uid
      const newIsRead = !notification.isRead
      const subcollection = `${notification.type}s` // e.g., 'like' -> 'likes'

      try {
        const notifRef = doc(db, NOTIFICATIONS_COLLECTION, uid, subcollection, notification.id)
        await updateDoc(notifRef, { isRead: newIsRead })

        // Update local state
        const index = this.notifications.findIndex(n => n.id === notification.id)
        if (index !== -1) {
          this.notifications[index].isRead = newIsRead
        }
      } catch (error) {
        console.error('Error updating notification read status:', error)
      }
    },
    async deleteNotification (notification) {
      const authStore = useAuthStore()
      if (!authStore.user?.uid) {
        return
      }

      const uid = authStore.user.uid
      const subcollection = `${notification.type}s`

      try {
        const notifRef = doc(db, NOTIFICATIONS_COLLECTION, uid, subcollection, notification.id)
        await deleteDoc(notifRef)

        // Update local state
        this.notifications = this.notifications.filter(n => n.id !== notification.id)
      } catch (error) {
        console.error('Error deleting notification:', error)
        throw error // Re-throw to handle it in the component
      }
    },
    async markAllAsRead () {
      const authStore = useAuthStore()
      if (!authStore.user?.uid) {
        return
      }

      const uid = authStore.user.uid
      const subcollections = ['followers', 'likes', 'mentions']
      const batch = writeBatch(db)

      try {
        for (const sub of subcollections) {
          const subcollectionRef = collection(db, NOTIFICATIONS_COLLECTION, uid, sub)
          const snapshot = await getDocs(subcollectionRef)
          for (const document of snapshot.docs) {
            // Only update documents that are not already read
            if (document.data().isRead !== true) {
              batch.update(document.ref, { isRead: true })
            }
          }
        }
        await batch.commit()

        // Update local state
        for (const n of this.notifications) {
          if (n.isRead !== true) {
            n.isRead = true
          }
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    },
  },
})
