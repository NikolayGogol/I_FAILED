// =================================================================================================
// Imports
// =================================================================================================
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'
import { useLatestStore } from '@/stores/feed/latest.js'

// =================================================================================================
// Constants
// =================================================================================================
const collection_db = import.meta.env.VITE_POST_COLLECTION
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const user_category_reads_collection = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION
const NOTIFICATIONS_COLLECTION = import.meta.env.VITE_NOTIFICATION_COLLECTION

let notificationListeners = []
// =================================================================================================
// Main Store
// =================================================================================================
export const useMainStore = defineStore('main', {
  state: () => ({
    posts: [],
    lastVisible: null,
    hasMore: true,
    loading: false,
    activeTab: 'latest',
    totalPosts: 0, // State to hold the total count
    lessonsShared: 0, // State to hold the total count
    notifications: 0,
    currentFilters: null,
    allPosts: [], // To store all fetched posts before filtering
    savedFiltersBeforeForYou: null,
    // Cache user docs to avoid repeated Firestore reads in the feed.
    // Key: uid, Value: { ...userDocData, uid }
    userCache: {},
  }),
  getters: {
    /**
     * Filters and sorts posts based on the current tab and filters.
     */
    filteredPosts (state) {
      const authStore = useAuthStore()
      const notInterestedTags = authStore.user?.notInterestedTags || []
      const normalize = v => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase()

      // For "For You" tab, we trust the backend to send pre-sorted and relevant posts.
      // We only apply client-side filters that the backend is not aware of, like "not interested".
      if (state.activeTab === 'for-you') {
        return state.allPosts.filter(post => {
          return !notInterestedTags.some(tag => post.tags?.includes(tag))
        })
      }

      // --- Default filtering logic for other tabs ('latest', 'popular') ---
      const matched = state.allPosts.filter(post => {
        // Exclude posts with not interested tags
        if (post.tags && post.tags.some(tag => notInterestedTags.includes(tag))) {
          return false
        }

        // If no other filters are set, the post is a match
        if (!state.currentFilters || Object.values(state.currentFilters).every(f => !f || f.length === 0)) {
          return true
        }

        const {
          categories,
          emojiTags,
          recoveryTime,
          costRange,
          postedBy,
        } = state.currentFilters || {}

        // Match categories
        const postCategories = post.selectedCategories || []
        const categoryMatch = !categories || categories.length === 0 || categories.some(filterCat => {
          const filterId = normalize(filterCat?.id ?? filterCat)
          const filterLabel = normalize(filterCat?.label ?? '')

          return postCategories.some(postCat => {
            if (typeof postCat === 'string') {
              const pc = normalize(postCat)
              return pc === filterId || pc === filterLabel
            }

            const postId = normalize(postCat?.id ?? postCat?.categoryId ?? postCat?.value)
            const postLabel = normalize(postCat?.label ?? postCat?.categoryLabel)

            return postId === filterId || postLabel === filterLabel
          })
        })

        // Match emotion tags
        const postEmotionValues = (post.emotionTags || []).map(t => {
          if (typeof t === 'string') {
            return t
          }
          return t?.value ?? t?.label ?? ''
        })
        const emotionMatch = !emojiTags || emojiTags.length === 0 || emojiTags.some(tagVal => {
          const tv = normalize(tagVal)
          return postEmotionValues.some(pv => normalize(pv) === tv)
        })

        // Match recovery time
        const postRecovery = post?.lessonLearned?.recoveryTime
        const postRecoveryVal = typeof postRecovery === 'string'
          ? postRecovery
          : postRecovery?.value ?? postRecovery?.title ?? ''
        const recoveryMatch = !recoveryTime || recoveryTime.length === 0 || recoveryTime.some(rv => normalize(postRecoveryVal) === normalize(rv))

        // Match cost range
        const parseCost = v => {
          if (v === undefined || v === null || v === '') {
            return null
          }
          if (typeof v === 'number' && !Number.isNaN(v)) {
            return v
          }
          const direct = Number(v)
          if (!Number.isNaN(direct)) {
            return direct
          }
          const cleaned = String(v).replace(/[^0-9.]/g, '')
          if (!cleaned) {
            return null
          }
          const parsed = Number(cleaned)
          return Number.isNaN(parsed) ? null : parsed
        }

        const costNum = parseCost(post?.lessonLearned?.cost)
        const costMatch = !costRange || costRange.length === 0 || costRange.some(rangeVal => {
          if (costNum === null) {
            return false
          }
          const rv = normalize(rangeVal)

          if (rv === 'free') {
            return costNum <= 0
          }
          if (rv === '<100') {
            return costNum > 0 && costNum < 100
          }
          if (rv === '100-1000') {
            return costNum >= 100 && costNum <= 1000
          }
          if (rv === '1000-5000') {
            return costNum >= 1000 && costNum <= 5000
          }
          if (rv === '>5000') {
            return costNum > 5000
          }
          return false
        })

        // Match posted by
        const postedByMatch = (() => {
          if (!postedBy) {
            return true
          }

          if (postedBy === 'anonymous') {
            return !!post.isAnonymous
          }
          if (postedBy === 'public') {
            return !post.isAnonymous
          }

          return normalize(post.uid) === normalize(postedBy)
        })()

        return categoryMatch && emotionMatch && recoveryMatch && costMatch && postedByMatch
      })

      return matched
    },
  },
  actions: {
    listenForNotifications (uid) {
      // Unsubscribe from any existing listeners
      for (const unsub of notificationListeners) {
        unsub()
      }
      notificationListeners = []

      if (!uid) {
        this.notifications = 0
        return
      }

      if (!NOTIFICATIONS_COLLECTION) {
        console.warn(
          'VITE_NOTIFICATIONS_COLLECTION is not set in your environment variables. Skipping notification listener.',
        )
        return
      }

      const subcollections = ['likes', 'mentions', 'followers']
      const counts = {
        likes: 0,
        mentions: 0,
        followers: 0,
      }

      const updateTotal = () => {
        this.notifications = counts.likes + counts.mentions + counts.followers
      }

      for (const subcollectionName of subcollections) {
        try {
          const collectionRef = collection(db, NOTIFICATIONS_COLLECTION, uid, subcollectionName)
          const unsubscribe = onSnapshot(collectionRef, snapshot => {
            counts[subcollectionName] = snapshot.size
            updateTotal()
          })
          notificationListeners.push(unsubscribe)
        } catch (error) {
          console.error(`Failed to listen to ${subcollectionName} subcollection`, error)
        }
      }
    },
    /**
     * Loads categories the user reads most (from `VITE_USER_CATEGORY_READS_COLLECTION`)
     * and returns normalized objects suitable for post filtering: { id, label, count }.
     */
    async fetchTopCategoriesForUserForYou ({ userId, limit: topLimit = 5 } = {}) {
      if (!userId) {
        return []
      }
      if (!user_category_reads_collection) {
        console.warn('[For You] VITE_USER_CATEGORY_READS_COLLECTION is not set')
        return []
      }
      try {
        // Use server-side ordering to avoid fetching all docs + client sorting.
        // If the required composite index is missing, we fall back to client sorting.
        try {
          const q = query(
            collection(db, user_category_reads_collection),
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
          const q = query(
            collection(db, user_category_reads_collection),
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
     * Fetches the total number of posts from the server.
     */
    async fetchTotalPostCount () {
      try {
        const postsRef = collection(db, collection_db)
        const snapshot = await getCountFromServer(postsRef)
        this.totalPosts = snapshot.data().count
        const q = query(postsRef, where('lessonLearned', '!=', null))
        const snapshot2 = await getCountFromServer(q)
        this.lessonsShared = snapshot2.data().count
      } catch (error) {
        console.error('Error fetching total post count:', error)
      }
    },

    /**
     * Sets the filters to be applied to the posts.
     * @param {object} filters - The filters object.
     */
    applyPostFilters (filters) {
      if (this.activeTab === 'latest') {
        const latestStore = useLatestStore()
        latestStore.applyPostFilters(filters)
        return
      }
      // Avoid `structuredClone` because Vue/Pinia data can contain proxies
      // that are not cloneable. We manually build a safe, plain object.
      // eslint-disable-next-line @stylistic/multiline-ternary
      const safeFilters = filters ? {
        categories: Array.isArray(filters.categories)
          ? filters.categories
              .map(c => ({
                id: c?.id,
                label: c?.label,
                // Preserve optional `count` used by the "for-you" bucketing logic.
                count: c?.count,
              }))
              .filter(c => c.id || c.label)
          : [],
        emojiTags: Array.isArray(filters.emojiTags) ? [...filters.emojiTags] : [],
        recoveryTime: Array.isArray(filters.recoveryTime) ? [...filters.recoveryTime] : [],
        costRange: Array.isArray(filters.costRange) ? [...filters.costRange] : [],
        postedBy: filters.postedBy?.value ?? filters.postedBy ?? null,
      } : null

      const hasFilters = !!safeFilters && Object.values(safeFilters).some(f => {
        if (Array.isArray(f)) {
          return f.length > 0
        }
        return !!f
      })

      this.currentFilters = hasFilters ? safeFilters : null

      // Reload feed from scratch so the first page matches current filters.
      this.fetchPosts({ tab: this.activeTab, refresh: true })
    },

    /**
     * Fetches posts from Firestore with pagination.
     * @param {object} options - The options for fetching posts.
     * @param {string} options.tab - The tab to fetch posts for ('latest', 'popular').
     * @param {number} options.pageSize - The number of posts to fetch per page.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    // eslint-disable-next-line complexity
    async fetchPosts ({ tab, pageSize = 10, refresh = false } = {}) {
      const authStore = useAuthStore()
      const prevTab = this.activeTab
      const isTabChanging = !!tab && tab !== prevTab

      if ((tab && tab !== this.activeTab) || refresh) {
        if (tab) {
          if (isTabChanging) {
            if (tab === 'for-you') {
              // For "For You", we don't need to save/restore filters as it has its own logic
              this.currentFilters = null
            } else if (prevTab === 'for-you') {
              // Clear filters when moving away from "For You" to a normal tab
              this.currentFilters = null
            }
          }

          this.activeTab = tab
        }
        this.allPosts = []
        this.lastVisible = null
        this.hasMore = true
        this.loading = false
      }

      if (this.loading || !this.hasMore) {
        return
      }

      this.loading = true

      try {
        const effectivePageSize = pageSize

        // Construct the payload for the API
        const payload = {
          tab: this.activeTab,
          pageSize: effectivePageSize,
          cursor: this.lastVisible,
          filters: this.activeTab === 'for-you' ? null : this.currentFilters, // Do not send filters for "For You"
        }

        // For "For You" tab, send user's follow data for personalization
        if (this.activeTab === 'for-you') {
          payload.followedUsers = authStore.user?.following || []
          payload.followedTags = authStore.user?.followedTags || []
        }

        const response = await api.post('posts/feed', payload)
        const responseData = response?.data || {}
        const backendPosts = Array.isArray(responseData.posts) ? responseData.posts : []
        const nextCursorDocId = responseData.nextCursorDocId ?? null
        const hasMoreFromBackend = responseData.hasMore ?? false

        this.lastVisible = nextCursorDocId
        this.hasMore = hasMoreFromBackend

        const newPosts = []
        const blockedUsers = authStore.user?.blockedUsers || []
        const userUidsToFetch = new Set()

        for (const post of backendPosts) {
          const postData = post || {}
          if (blockedUsers.includes(postData.uid)) {
            continue
          }

          if (postData.uid && !postData.isAnonymous && !this.userCache[postData.uid]) {
            userUidsToFetch.add(postData.uid)
          }
        }

        // Fetch all needed users in parallel (and cache them) to avoid N+1 reads.
        if (userUidsToFetch.size > 0) {
          await Promise.all(Array.from(userUidsToFetch).map(async uid => {
            try {
              const userRef = doc(db, USER_COLLECTION, uid)
              const userSnap = await getDoc(userRef)
              const data = userSnap.exists() ? userSnap.data() : null
              this.userCache[uid] = data
                ? { ...data, uid }
                : { uid }
            } catch {
              this.userCache[uid] = { uid }
            }
          }))
        }

        for (const post of backendPosts) {
          const postData = post || {}
          if (blockedUsers.includes(postData.uid)) {
            continue
          }

          const finalPost = { ...postData }
          // Backend returns `{ id, ...docData }`. Keep it consistent with existing UI.
          if (!finalPost.id && postData.id === undefined) {
            // no-op (id should exist)
          }

          if (postData.uid && !postData.isAnonymous) {
            const cachedUser = this.userCache[postData.uid]
            finalPost.user = cachedUser
              ? { ...finalPost.user, ...cachedUser, uid: postData.uid }
              : {
                  ...finalPost.user,
                  uid: postData.uid,
                }
          }

          newPosts.push(finalPost)
        }

        this.allPosts.push(...newPosts)

        if (this.filteredPosts.length < 5 && this.hasMore) {
          setTimeout(() => this.fetchPosts({}), 100)
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        this.hasMore = false
      } finally {
        this.loading = false
      }
    },
  },
  persist: false,
})
