import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.js'

const VITE_BOOKMARKS_COLLECTION = import.meta.env.VITE_BOOKMARKS
const VITE_POST_COLLECTION = import.meta.env.VITE_POST_COLLECTION

export const useLibraryStore = defineStore('library', {
  state: () => ({
    bookmarkedPosts: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchBookmarkedPosts () {
      this.loading = true
      this.error = null

      try {
        const authStore = useAuthStore()
        const uid = authStore.user?.uid

        if (!uid) {
          console.log('User not authenticated.')
          this.bookmarkedPosts = []
          return
        }

        const bookmarksQuery = query(
          collection(db, VITE_BOOKMARKS_COLLECTION),
          where('userId', '==', uid),
        )

        const snapshot = await getDocs(bookmarksQuery)

        if (snapshot.empty) {
          console.log('No bookmarked posts found.')
          this.bookmarkedPosts = []
          return
        }

        this.bookmarkedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
        }))
      } catch (error) {
        console.error('Error fetching bookmarked posts:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})
