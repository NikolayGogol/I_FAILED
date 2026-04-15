import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth'

const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const USER_CATEGORY_READS_COLLECTION = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION

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
    /**
     * If personalized matching returns no more results, we do one fallback request
     * ("what's left") to keep the feed infinite.
     */
    fallbackTried: false,
    preferredCategories: [],
    preferredCategoriesFetchedAt: 0,
    currentFilters: null,
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

      // These are "negative" preferences from the user profile.
      // Any post containing at least one of these tags is removed from the UI feed.
      const notInterestedTags = authStore.user.notInterestedTags || []
      const currentUserId = authStore.user.uid

      // We use following as an additional client-side safety net:
      // if the author is followed and the post is anonymous, we must not show it.
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
     * Applies filters and refreshes the posts list.
     * @param {object} filters - The filters to apply.
     * @param {string} [filters.searchText] - Text to search for in posts.
     */
    applyPostFilters (filters) {
      this.currentFilters = filters
      this.fetchPosts({ pageSize: 3, refresh: true })
    },
    /**
     * Loads top categories by user's read stats for the "For You" feed.
     * @param {object} options
     * @param {string} options.userId
     * @param {number} options.limit
     */
    /**
     * Returns the user's top read categories based on
     * `VITE_USER_CATEGORY_READS_COLLECTION`.
     *
     * We store categoryId/categoryLabel/count there and increment the counter
     * on the single post page when the user reads a category.
     */
    async fetchTopCategoriesForUserForYou ({ userId, limit: topLimit = 5 } = {}) {
      if (!userId) {
        return []
      }
      if (!USER_CATEGORY_READS_COLLECTION) {
        console.warn('[For You] VITE_USER_CATEGORY_READS_COLLECTION is not set')
        return []
      }

      try {
        // Prefer server-side ordering (where+orderBy+limit) to avoid fetching all docs.
        // If a composite index is missing in Firestore, this query will throw,
        // and we fall back to client-side sorting.
        try {
          const q = query(
            collection(db, USER_CATEGORY_READS_COLLECTION),
            where('uid', '==', userId),
            orderBy('count', 'desc'),
            limit(topLimit),
          )
          const snapshot = await getDocs(q)
          return snapshot.docs.map(d => {
            const data = d.data() || {}
            return {
              id: data.categoryId,
              label: data.categoryLabel,
              count: data.count || 0,
            }
          })
        } catch {
          // Fallback if the required composite index is missing.
          const q = query(
            collection(db, USER_CATEGORY_READS_COLLECTION),
            where('uid', '==', userId),
          )
          const snapshot = await getDocs(q)
          const rawDocs = snapshot.docs.map(d => {
            const data = d.data() || {}
            return {
              docId: d.id,
              categoryId: data.categoryId,
              categoryLabel: data.categoryLabel,
              count: data.count || 0,
            }
          })

          rawDocs.sort((a, b) => (b.count || 0) - (a.count || 0))
          return rawDocs.slice(0, topLimit).map(d => ({
            id: d.categoryId,
            label: d.categoryLabel,
            count: d.count,
          }))
        }
      } catch (error) {
        console.error('[For You] Error fetching top categories:', error)
        return []
      }
    },

    /**
     * Fetches posts for the "For You" feed with pagination.
     * @param {object} options - The options for fetching posts.
     * @param {number} options.pageSize - The number of posts to fetch.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    // eslint-disable-next-line complexity
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

      // Category preferences are "read statistics".
      // We refresh them when:
      //  - caller asked for a refresh
      //  - we don't have categories yet
      //  - it's been more than 60s since we last loaded them
      const shouldReloadCategories = refresh
        || this.preferredCategories.length === 0
        || (Date.now() - this.preferredCategoriesFetchedAt > 60_000)
      if (shouldReloadCategories && currentUserId) {
        this.preferredCategories = await this.fetchTopCategoriesForUserForYou({ userId: currentUserId, limit: 5 })
        this.preferredCategoriesFetchedAt = Date.now()
      }

      if (this.loading) {
        return
      }

      // If personalized mode is exhausted, try fallback once.
      // This keeps scrolling usable even when the user has strict preferences.
      if (!isForYouFallback && !this.hasMore) {
        const hasAnyPrefs = (Array.isArray(followedUsers) && followedUsers.length > 0)
          || (Array.isArray(followedTags) && followedTags.length > 0)
          || (Array.isArray(this.preferredCategories) && this.preferredCategories.length > 0)
        if (hasAnyPrefs && !this.fallbackTried) {
          this.fallbackTried = true
          return await this.fetchPosts({ pageSize, refresh: false, fallback: true })
        }
        return
      }

      this.loading = true

      try {
        // Prepare payload for the API request.
        // The backend uses these signals to build the "For You" list.
        const payload = {
          tab: 'for-you',
          pageSize,
          cursor: this.lastVisible,
          followedUsers,
          followedTags,
          preferredCategories: this.preferredCategories,
          fallback: isForYouFallback,
          currentUserId,
          filters: this.currentFilters,
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
