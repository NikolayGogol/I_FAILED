import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.js'
import { useSinglePostStore } from '@/stores/single-post/single-post.js'

const VITE_BOOKMARKS_COLLECTION = import.meta.env.VITE_BOOKMARKS

export const useLibraryStore = defineStore('library', {
  state: () => ({
    bookmarkedPosts: [], // Holds the fully loaded post objects
    bookmarkedPostIds: [], // Holds only the IDs of all bookmarked posts
    loading: false, // For initial ID fetch
    loadingMore: false, // For loading subsequent pages
    error: null,
    hasMore: true, // Becomes false when all posts are loaded
  }),
  actions: {
    async fetchBookmarkedPostIds() {
      this.loading = true
      this.error = null
      this.bookmarkedPosts = []
      this.bookmarkedPostIds = []
      this.hasMore = true

      try {
        const authStore = useAuthStore()
        const uid = authStore.user?.uid
        if (!uid) {
          console.log('User not authenticated.')
          this.hasMore = false
          return
        }

        const bookmarksQuery = query(
          collection(db, VITE_BOOKMARKS_COLLECTION),
          where('userId', '==', uid),
        )

        const snapshot = await getDocs(bookmarksQuery)

        if (snapshot.empty) {
          console.log('No bookmarked posts found.')
          this.bookmarkedPostIds = []
          this.hasMore = false
        } else {
          // Assuming the bookmark document contains a 'postId' field.
          const ids = snapshot.docs.map(doc => doc.data().postId).filter(Boolean)
          this.bookmarkedPostIds = ids
          this.hasMore = ids.length > 0
        }
      } catch (error) {
        console.error('Error fetching bookmarked post IDs:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async loadMoreBookmarks(pageSize = 5) {
      if (this.loadingMore || !this.hasMore) return

      this.loadingMore = true
      this.error = null

      try {
        const singlePostStore = useSinglePostStore()
        const currentlyLoadedCount = this.bookmarkedPosts.length
        const idsToLoad = this.bookmarkedPostIds.slice(
          currentlyLoadedCount,
          currentlyLoadedCount + pageSize,
        )

        if (idsToLoad.length === 0) {
          this.hasMore = false
          return
        }

        const promises = idsToLoad.map(id => singlePostStore.getPostById(id))
        const newPosts = await Promise.all(promises)

        this.bookmarkedPosts.push(...newPosts.filter(post => post)) // Add new posts, filtering out any nulls

        if (this.bookmarkedPosts.length >= this.bookmarkedPostIds.length) {
          this.hasMore = false
        }
      } catch (error) {
        console.error('Error loading more bookmarks:', error)
        this.error = error.message // Show loading error
      } finally {
        this.loadingMore = false
      }
    },
  },
})
