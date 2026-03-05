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
  }),
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
     * Fetches posts from Firestore with pagination.
     * @param {object} options - The options for fetching posts.
     * @param {string} options.tab - The tab to fetch posts for ('latest', 'popular', 'for-you').
     * @param {number} options.pageSize - The number of posts to fetch per page.
     * @param {boolean} options.refresh - Whether to refresh the posts list.
     */
    async fetchPosts ({ tab, pageSize = 4, refresh = false } = {}) {
      // If a new tab is selected or a refresh is requested, reset the state
      if ((tab && tab !== this.activeTab) || refresh) {
        if (tab) {
          this.activeTab = tab
        }
        this.posts = []
        this.lastVisible = null
        this.hasMore = true
        this.loading = false // Reset loading state on refresh
      }

      // Prevent fetching if already loading or no more posts are available
      if (this.loading || !this.hasMore) {
        return
      }

      this.loading = true
      const authStore = useAuthStore()

      try {
        const postsRef = collection(db, collection_db)
        let q

        // Set up query constraints for pagination
        const queryConstraints = [limit(pageSize)]
        if (this.lastVisible) {
          queryConstraints.push(startAfter(this.lastVisible))
        }

        // Build the query based on the active tab
        if (this.activeTab === 'popular') {
          q = query(postsRef, orderBy('views', 'desc'), ...queryConstraints)
        } else if (this.activeTab === 'for-you') {
          const following = authStore.user?.following || []
          if (following.length === 0) {
            this.posts = []
            this.hasMore = false
            this.loading = false
            return
          }
          const followedUIDs = following.slice(0, 10)
          q = query(postsRef, where('uid', 'in', followedUIDs), orderBy('createdAt', 'desc'), ...queryConstraints)
        } else { // 'latest'
          q = query(postsRef, orderBy('createdAt', 'desc'), ...queryConstraints)
        }

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          this.hasMore = false
        } else {
          this.lastVisible = querySnapshot.docs.at(-1)
          if (querySnapshot.docs.length < pageSize) {
            this.hasMore = false
          }

          const newPosts = []
          const blockedUsers = authStore.user?.blockedUsers || []

          // Process each post document
          for (const postDoc of querySnapshot.docs) {
            const postData = postDoc.data()

            // Skip posts from blocked users
            if (blockedUsers.includes(postData.uid)) {
              continue
            }

            const finalPost = { id: postDoc.id, ...postData }

            // Fetch user data for the post if it's not anonymous
            if (postData.uid && !postData.stepFive?.isAnonymous) {
              const userRef = doc(db, USER_COLLECTION, postData.uid)
              const userSnap = await getDoc(userRef)
              finalPost.user = userSnap.exists() ? { ...finalPost.user, ...userSnap.data(), uid: userSnap.id } : { ...finalPost.user, uid: postData.uid }
            }
            newPosts.push(finalPost)
          }
          this.posts.push(...newPosts)
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
