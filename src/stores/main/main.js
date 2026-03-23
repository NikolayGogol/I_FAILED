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
  startAfter,
  where,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
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
      const normalize = v => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase()
      if (!state.currentFilters || Object.values(state.currentFilters).every(f => !f || f.length === 0)) {
        return state.allPosts
      }
      const matched = state.allPosts.filter(post => {
        const { categories } = state.currentFilters

        // 1. Category Match
        const postCategories = post.selectedCategories || []
        const categoryMatch = !categories || categories.length === 0 || categories.some(filterCat => {
          const filterId = normalize(filterCat.id)
          const filterLabel = normalize(filterCat.label)

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

            const postId = normalize(postCat?.id || postCat?.categoryId || postCat?.value)
            const postLabel = normalize(postCat?.label || postCat?.categoryLabel)

            return postId === filterId
              || postLabel === filterLabel
          })
        })
        return categoryMatch
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
      // Clone the filters to prevent reactivity issues
      const clonedFilters = structuredClone(filters)
      const hasFilters = Object.values(clonedFilters).some(f => f && f.length > 0)
      this.currentFilters = hasFilters ? clonedFilters : null

      // After applying filters, check if we need to fetch more posts
      if (this.filteredPosts.length < 5 && this.hasMore) {
        this.fetchPosts({})
      }
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
              this.currentFilters = null
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
        const postsRef = collection(db, collection_db)
        const queryConstraints = []

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

          this.currentFilters = filterCategories.length > 0
            ? { categories: filterCategories }
            : null
        }

        if (this.activeTab === 'popular') {
          queryConstraints.push(orderBy('views', 'desc'))
        } else {
          queryConstraints.push(orderBy('createdAt', 'desc'))
        }

        if (this.lastVisible) {
          queryConstraints.push(startAfter(this.lastVisible))
        }
        queryConstraints.push(limit(effectivePageSize))

        const q = query(postsRef, ...queryConstraints)
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          this.hasMore = false
        } else {
          this.lastVisible = querySnapshot.docs.at(-1)
          if (querySnapshot.docs.length < effectivePageSize) {
            this.hasMore = false
          }

          const newPosts = []
          const blockedUsers = authStore.user?.blockedUsers || []
          const userUidsToFetch = new Set()

          for (const postDoc of querySnapshot.docs) {
            const postData = postDoc.data()
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

          for (const postDoc of querySnapshot.docs) {
            const postData = postDoc.data()
            if (blockedUsers.includes(postData.uid)) {
              continue
            }

            const finalPost = { id: postDoc.id, ...postData }
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
