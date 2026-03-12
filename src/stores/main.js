// =================================================================================================
// Imports
// =================================================================================================
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

// =================================================================================================
// Constants
// =================================================================================================
const collection_db = import.meta.env.VITE_POST_COLLECTION
const USER_COLLECTION = import.meta.env.VITE_USERS_COLLECTION

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
    currentFilters: null,
    allPosts: [], // To store all fetched posts before filtering
  }),
  getters: {
    filteredPosts (state) {
      if (!state.currentFilters || Object.values(state.currentFilters).every(f => !f || f.length === 0)) {
        return state.allPosts
      }
      return state.allPosts.filter(post => {
        const { categories, emojiTags, recoveryTime, costRange } = state.currentFilters

        // 1. Category Match
        const postCategories = post.stepOne?.selectedCategories || []
        const categoryMatch = !categories || categories.length === 0 || categories.some(filterCat =>
          postCategories.some(postCat => postCat.id === filterCat.id),
        )

        // 2. Emoji Match
        const postEmojis = post.stepFour?.emotionTags || []
        const emojiMatch = !emojiTags || emojiTags.length === 0 || emojiTags.some(filterEmoji =>
          postEmojis.includes(filterEmoji.value),
        )

        // 3. Recovery Time Match
        const postRecoveryTime = post.stepFour?.recoveryTime
        const recoveryMatch = !recoveryTime || recoveryTime.length === 0 || recoveryTime.some(filterRecovery =>
          filterRecovery.value === postRecoveryTime,
        )

        // 4. Cost Range Match
        const postCostRaw = post.stepFour?.cost
        const postCost = Number(postCostRaw)
        const costMatch = !costRange || costRange.length === 0 || costRange.some(range => {
          if (range.label === 'Free') {
            return !postCostRaw || postCost === 0
          }
          if (isNaN(postCost)) {
            return false
          }
          switch (range.label) {
            case '<$100': return postCost > 0 && postCost < 100
            case '$100 - $1k': return postCost >= 100 && postCost <= 1000
            case '$1k - $5k': return postCost > 1000 && postCost <= 5000
            case '$5k+': return postCost > 5000
            default: return false
          }
        })

        return categoryMatch && emojiMatch && recoveryMatch && costMatch
      })
    },
  },
  actions: {
    /**
     * Fetches the total number of posts from the server.
     */
    async fetchTotalPostCount () {
      try {
        const postsRef = collection(db, collection_db)
        const snapshot = await getCountFromServer(postsRef)
        this.totalPosts = snapshot.data().count
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
      const clonedFilters = JSON.parse(JSON.stringify(filters))
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
     * @param {string} options.tab - The tab to fetch posts for ('latest', 'popular', 'for-you').
     * @param {number} options.pageSize - The number of posts to fetch per page.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    async fetchPosts ({ tab, pageSize = 10, refresh = false } = {}) {
      if ((tab && tab !== this.activeTab) || refresh) {
        if (tab) this.activeTab = tab
        this.allPosts = []
        this.lastVisible = null
        this.hasMore = true
        this.loading = false
      }

      if (this.loading || !this.hasMore) return

      this.loading = true
      const authStore = useAuthStore()

      try {
        const postsRef = collection(db, collection_db)
        let queryConstraints = []

        if (this.activeTab === 'popular') {
          queryConstraints.push(orderBy('views', 'desc'))
        } else {
          queryConstraints.push(orderBy('createdAt', 'desc'))
        }

        if (this.activeTab === 'for-you') {
          const following = authStore.user?.following || []
          if (following.length > 0) {
            queryConstraints.push(where('uid', 'in', following.slice(0, 10)))
          } else {
            this.allPosts = []
            this.hasMore = false
            this.loading = false
            return
          }
        }

        if (this.lastVisible) {
          queryConstraints.push(startAfter(this.lastVisible))
        }
        queryConstraints.push(limit(pageSize))

        const q = query(postsRef, ...queryConstraints)
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          this.hasMore = false
        } else {
          this.lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
          if (querySnapshot.docs.length < pageSize) {
            this.hasMore = false
          }

          const newPosts = []
          const blockedUsers = authStore.user?.blockedUsers || []

          for (const postDoc of querySnapshot.docs) {
            const postData = postDoc.data()
            if (blockedUsers.includes(postData.uid)) continue

            const finalPost = { id: postDoc.id, ...postData }
            if (postData.uid && !postData.stepFive?.isAnonymous) {
              const userRef = doc(db, USER_COLLECTION, postData.uid)
              const userSnap = await getDoc(userRef)
              finalPost.user = userSnap.exists() ? { ...finalPost.user, ...userSnap.data(), uid: userSnap.id } : { ...finalPost.user, uid: postData.uid }
            }
            newPosts.push(finalPost)
          }
          this.allPosts.push(...newPosts)

          // If after filtering we have too few posts, and there are more to fetch, fetch again.
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
