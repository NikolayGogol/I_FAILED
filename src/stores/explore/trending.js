import dayjs from 'dayjs'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { db } from '@/firebase.js'
import { useUserStore } from '@/stores/user.js'
const collection_db = import.meta.env.VITE_POST_COLLECTION

export const useTrendingStore = defineStore('trending', {
  state: () => ({
    posts: [],
    loading: false,
    hasMore: true,
    nextCursorDocId: null,
    filters: {},
    weeklyBookmarkedPosts: [], // New state to store weekly bookmarked posts
    weeklyBookmarkedLoading: false,
  }),
  actions: {
    async fetchTrendingPosts (newFilters) {
      if (this.loading) {
        return
      }

      this.loading = true
      try {
        // If new filters are applied, reset the state
        if (newFilters) {
          this.filters = newFilters
          this.posts = []
          this.nextCursorDocId = null
          this.hasMore = true
        }

        if (!this.hasMore) {
          this.loading = false
          return
        }

        // Corrected: Using the original '/explore/trending' route
        const response = await api.post('/explore/trending', {
          pageSize: 3, // Default to 3 as requested
          cursor: this.nextCursorDocId,
          filters: this.filters,
        })

        const { posts, nextCursorDocId, hasMore } = response.data
        const userPromises = posts.map(post => useUserStore().getUserById(post.uid))
        const users = await Promise.all(userPromises)
        for (const [index, post] of posts.entries()) {
          post.user = users[index]
        }
        this.posts.push(...posts)
        this.nextCursorDocId = nextCursorDocId
        this.hasMore = hasMore
      } catch (error) {
        console.error('Error fetching trending posts:', error)
        // Optionally, handle the error in the UI
      } finally {
        this.loading = false
      }
    },

    async fetchWeeklyBookmarkedPosts () {
      const startDate = dayjs().startOf('week')
      const postsRef = collection(db, collection_db)
      const q = query(postsRef,
        where('createdAt', '>=', new Date(startDate)),
      )
      const snapshot = await getDocs(q)
      let result = []
      for (const doc of snapshot.docs) {
        result.push({
          ...doc.data(),
          id: doc.id,
        })
      }
      result = result.toSorted((a, b) => (b.bookmarks || 0) - (a.bookmarks || 0))
      return result.splice(0, 3)
    },

    reset () {
      this.posts = []
      this.loading = false
      this.hasMore = true
      this.nextCursorDocId = null
      this.filters = {}
      this.weeklyBookmarkedPosts = [] // Reset weekly bookmarked posts as well
      this.weeklyBookmarkedLoading = false
    },
  },
})
