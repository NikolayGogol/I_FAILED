import { doc, getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth'

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

/**
 * Store for the "For You" feed tab.
 */
export const useForYouStore = defineStore('forYou', {
  state: () => ({
    posts: [],
    lastVisible: null,
    hasMore: true,
    loading: false,
    userCache: {},
    fallbackTried: false, // When personalized feed ends, load the remaining posts.
  }),
  getters: {
    /**
     * Filters posts based on client-side rules, like "not interested" tags and own posts.
     * @param {object} state - The store's state.
     * @returns {Array} The filtered posts.
     */
    filteredPosts (state) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        return state.posts // Return all posts if user is not logged in
      }

      const notInterestedTags = authStore.user.notInterestedTags || []
      const currentUserId = authStore.user.uid
      const followedUsers = new Set(authStore.user.following || [])

      return state.posts.filter(post => {
        // Exclude user's own posts
        if (post.uid === currentUserId) {
          return false
        }

        // If a followed user created an anonymous post, don't show it.
        if (post.isAnonymous && post.uid && followedUsers.has(post.uid)) {
          return false
        }

        // Exclude posts with tags the user is not interested in
        if (post.tags && post.tags.some(tag => notInterestedTags.includes(tag))) {
          return false
        }
        return true
      })
    },
  },
  actions: {
    /**
     * Fetches posts for the "For You" feed with pagination.
     * @param {object} options - The options for fetching posts.
     * @param {number} options.pageSize - The number of posts to fetch.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    async fetchPosts ({ pageSize = 10, refresh = false, fallback = false } = {}) {
      const authStore = useAuthStore()
      const followedUsers = authStore.user?.following || []
      const followedTags = authStore.user?.followedTags || []
      const currentUserId = authStore.user?.uid

      const isForYouFallback = fallback

      if (refresh) {
        this.posts = []
        this.lastVisible = null
        this.hasMore = true
        this.loading = false
        this.fallbackTried = false
      }

      if (this.loading) {
        return
      }

      // If personalized mode is exhausted, try fallback once.
      if (!isForYouFallback && !this.hasMore) {
        const hasAnyPrefs = (Array.isArray(followedUsers) && followedUsers.length > 0)
          || (Array.isArray(followedTags) && followedTags.length > 0)
        if (hasAnyPrefs && !this.fallbackTried) {
          this.fallbackTried = true
          return await this.fetchPosts({ pageSize, refresh: false, fallback: true })
        }
        return
      }

      this.loading = true

      try {
        // Prepare payload for the API request
        const payload = {
          tab: 'for-you',
          pageSize,
          cursor: this.lastVisible,
          followedUsers,
          followedTags,
          fallback: isForYouFallback,
          currentUserId,
        }

        const response = await api.post('posts/feed', payload)
        const { posts: backendPosts = [], nextCursorDocId = null, hasMore: hasMoreFromBackend = false } = response.data || {}

        this.lastVisible = nextCursorDocId
        this.hasMore = hasMoreFromBackend

        // Cache user data to avoid repeated fetches
        const userUidsToFetch = new Set()
        for (const post of backendPosts) {
          if (post.uid && !post.isAnonymous && !this.userCache[post.uid]) {
            userUidsToFetch.add(post.uid)
          }
        }

        if (userUidsToFetch.size > 0) {
          await Promise.all(
            Array.from(userUidsToFetch).map(async uid => {
              try {
                const userRef = doc(db, USER_COLLECTION, uid)
                const userSnap = await getDoc(userRef)
                this.userCache[uid] = userSnap.exists() ? { ...userSnap.data(), uid } : { uid }
              } catch {
                this.userCache[uid] = { uid }
              }
            }),
          )
        }

        // Map backend posts to include cached user data
        const newPosts = backendPosts.map(post => {
          if (post.uid && !post.isAnonymous) {
            post.user = { ...post.user, ...this.userCache[post.uid] }
          }
          return post
        })

        this.posts.push(...newPosts)
      } catch (error) {
        console.error('Error fetching "For You" posts:', error)
        this.hasMore = false
      } finally {
        this.loading = false
      }
    },
  },
})
