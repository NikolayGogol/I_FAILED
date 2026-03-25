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
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import api from '@/axios.js'
import { db } from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'

// =================================================================================================
// Constants
// =================================================================================================
const collection_db = import.meta.env.VITE_POST_COLLECTION
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION
const user_category_reads_collection = import.meta.env.VITE_USER_CATEGORY_READS_COLLECTION

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
    currentFilters: null,
    allPosts: [], // To store all fetched posts before filtering
    savedFiltersBeforeForYou: null,
    // Cache user docs to avoid repeated Firestore reads in the feed.
    // Key: uid, Value: { ...userDocData, uid }
    userCache: {},
  }),
  getters: {
    filteredPosts (state) {
      const authStore = useAuthStore()
      const notInterestedTags = authStore.user?.notInterestedTags || []
      const normalize = v => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase()
      if (!state.currentFilters || Object.values(state.currentFilters).every(f => !f || f.length === 0)) {
        return state.allPosts.filter(post => !post.tags || !post.tags.some(tag => notInterestedTags.includes(tag)))
      }
      const matched = state.allPosts.filter(post => {
        if (post.tags && post.tags.some(tag => notInterestedTags.includes(tag))) {
          return false
        }
        const {
          categories,
          emojiTags,
          recoveryTime,
          costRange,
          postedBy,
        } = state.currentFilters || {}

        // =========================
        // 1) Category Match
        // =========================
        const postCategories = post.selectedCategories || []
        const categoryMatch = !categories || categories.length === 0 || categories.some(filterCat => {
          const filterId = normalize(filterCat?.id ?? filterCat)
          const filterLabel = normalize(filterCat?.label ?? '')

          return postCategories.some(postCat => {
            // Be tolerant to different Firestore shapes:
            // - { id, label }
            // - { categoryId, categoryLabel }
            // - string ('business')
            // - { value: 'business' }
            if (typeof postCat === 'string') {
              const pc = normalize(postCat)
              return pc === filterId || pc === filterLabel
            }

            const postId = normalize(postCat?.id ?? postCat?.categoryId ?? postCat?.value)
            const postLabel = normalize(postCat?.label ?? postCat?.categoryLabel)

            return postId === filterId || postLabel === filterLabel
          })
        })

        // =========================
        // 2) Emotion Tags Match
        // =========================
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

        // =========================
        // 3) Recovery Time Match
        // =========================
        const postRecovery = post?.lessonLearned?.recoveryTime
        const postRecoveryVal = typeof postRecovery === 'string'
          ? postRecovery
          : postRecovery?.value ?? postRecovery?.title ?? ''
        const recoveryMatch = !recoveryTime || recoveryTime.length === 0 || recoveryTime.some(rv => normalize(postRecoveryVal) === normalize(rv))

        // =========================
        // 4) Cost Range Match
        // =========================
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

        // =========================
        // 5) Posted By Match
        // =========================
        const postedByMatch = (() => {
          if (!postedBy) {
            return true
          }

          // In the UI, `postedBy` values are:
          // - 'anonymous' => only anonymous posts
          // - 'public' => only non-anonymous posts
          if (postedBy === 'anonymous') {
            return !!post.isAnonymous
          }
          if (postedBy === 'public') {
            return !post.isAnonymous
          }

          // Fallback: if someone passes a uid, match by uid.
          return normalize(post.uid) === normalize(postedBy)
        })()

        return categoryMatch && emotionMatch && recoveryMatch && costMatch && postedByMatch
      })

      // For "For You" we want a feed ordered by user interest counts (not by createdAt only).
      // This makes the "right" categories visible immediately.
      if (state.activeTab === 'for-you' && state.currentFilters?.categories?.some(c => c?.count !== undefined)) {
        const topCats = (state.currentFilters.categories || [])
          .map(c => ({
            id: normalize(c?.id),
            label: normalize(c?.label),
            count: c?.count || 0,
          }))
          .filter(c => c.id || c.label)

        const createdAtValue = post => {
          const ts = post?.createdAt
          if (ts?.seconds !== undefined) {
            return Number(ts.seconds)
          }
          const asDate = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null)
          return asDate ? asDate.getTime() / 1000 : 0
        }

        const postHasFilter = (post, filterCat) => {
          const postCategories = post.selectedCategories || []

          return postCategories.some(postCat => {
            if (typeof postCat === 'string') {
              const pc = normalize(postCat)
              return pc === filterCat.id || pc === filterCat.label
            }

            const postId = normalize(postCat?.id || postCat?.categoryId || postCat?.value)
            const postLabel = normalize(postCat?.label || postCat?.categoryLabel)

            return postId === filterCat.id || postLabel === filterCat.label
          })
        }

        const catKey = c => c.id || c.label

        // Bucket posts by "best matching" top category, then do round-robin.
        const buckets = new Map()
        const otherKey = '__other__'

        for (const post of matched) {
          let best = null
          let bestCount = -1

          for (const c of topCats) {
            if (!postHasFilter(post, c)) {
              continue
            }
            if (c.count > bestCount) {
              best = c
              bestCount = c.count
            }
          }

          const key = best ? catKey(best) : otherKey
          if (!buckets.has(key)) {
            buckets.set(key, [])
          }
          buckets.get(key).push(post)
        }

        // Keep time-order inside each category bucket.
        for (const [key, arr] of buckets.entries()) {
          arr.sort((a, b) => createdAtValue(b) - createdAtValue(a))
          buckets.set(key, arr)
        }

        const orderedCatsKeys = topCats.map(element => catKey(element))
        const hasOther = buckets.has(otherKey)

        const result = []
        let guard = 0
        const max = matched.length + 5

        while (result.length < matched.length && guard < max) {
          guard++
          let addedThisRound = false

          for (const key of orderedCatsKeys) {
            const arr = buckets.get(key)
            if (arr && arr.length > 0) {
              result.push(arr.shift())
              addedThisRound = true
              if (result.length >= matched.length) {
                break
              }
            }
          }

          if (!addedThisRound && hasOther) {
            const otherArr = buckets.get(otherKey)
            if (otherArr && otherArr.length > 0) {
              result.push(otherArr.shift())
            }
          }

          if (!addedThisRound) {
            break
          }
        }

        return result
      }

      return matched
    },
  },
  actions: {
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
              // Keep user's manual filters, but swap them for the "For You" categories.
              this.savedFiltersBeforeForYou = this.currentFilters
                ? structuredClone(this.currentFilters)
                : null
              // Preserve other filter fields, but force categories to be recalculated.
              this.currentFilters = this.currentFilters
                ? { ...this.currentFilters, categories: [] }
                : null
            } else if (prevTab === 'for-you') {
              // Restore manual filters when leaving the "For You" tab.
              this.currentFilters = this.savedFiltersBeforeForYou
              this.savedFiltersBeforeForYou = null
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
        // For the first "For You" load, fetch more posts so we hit enough matches
        // before the client-side bucketing logic in `filteredPosts`.
        const effectivePageSize = (this.activeTab === 'for-you' && this.allPosts.length === 0)
          ? Math.max(pageSize * 3, 20)
          : pageSize

        if (this.activeTab === 'for-you' // Set category filters based on what the user reads most.
          && (!this.currentFilters || !this.currentFilters.categories || this.currentFilters.categories.length === 0)) {
          const topCategories = await this.fetchTopCategoriesForUserForYou({
            userId: authStore.user?.uid,
            limit: 5,
          })

          const filterCategories = topCategories
            .filter(c => c && c.id && c.label)
            .map(c => ({ id: c.id, label: c.label, count: c.count }))

          if (filterCategories.length > 0) {
            const prev = this.currentFilters || {}
            this.currentFilters = { ...prev, categories: filterCategories }
          } else {
            this.currentFilters = this.currentFilters
              ? { ...this.currentFilters, categories: [] }
              : null
          }
        }

        // Fetch already-filtered posts from backend to avoid Firestore "requires an index".
        // Backend sorts by `createdAt`/`views`, then applies filters in memory.
        const payload = {
          tab: this.activeTab,
          pageSize: effectivePageSize,
          cursor: this.lastVisible,
          filters: this.currentFilters,
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
            finalPost.user = cachedUser ? { ...finalPost.user, ...cachedUser, uid: postData.uid } : { ...finalPost.user, uid: postData.uid }
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
