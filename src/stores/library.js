import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.js'
import { useSinglePostStore } from '@/stores/single-post/single-post.js'

const VITE_BOOKMARKS_COLLECTION = import.meta.env.VITE_BOOKMARKS

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
        const SinglePostStore = useSinglePostStore()

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

        const postIds = snapshot.docs.map(doc => ({
          id: doc.data().postId,
        }))
        if (postIds.length === 0) {
          return
        } else {
          for (const item of postIds) {
            // eslint-disable-next-line unicorn/no-single-promise-in-promise-methods
            const res = await Promise.all([SinglePostStore.getPostById(item.id)])
            this.bookmarkedPosts.push(res[0])
          }
        }
      } catch (error) {
        console.error('Error fetching bookmarked posts:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})
